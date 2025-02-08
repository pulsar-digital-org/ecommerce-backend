import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

import { User } from '../db/models/User';

import { BadRequestError, WrongCredentialsError } from '../errors';
import logger from '../logger';

const secretKey = process.env.SECRET_KEY || 'mgIrb2CBb87tqVXpT+cYcA==';

/** Generates a password hash for a plain password */
async function generateHash(password: string) {
	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash(password, salt);

	return hash;
}

/** Basic login function using identifier (username or email) and a password
 *
 * @throws BadRequestError if no identifier or password is provided
 * @throws WrongCredentialsError if we can't find a user with the provided identifier or the hash doesn't match
 *
 * @returns New users token
 */
async function login(identifier: string | null, password: string | null) {
	if (!identifier) {
		throw new BadRequestError('Email nor username provided');
	}

	if (!password) {
		throw new BadRequestError('Password not provided');
	}

	const user = await User.findOne({
		where: {
			[Op.or]: {
				email: identifier,
				username: identifier
			}
		}
	});

	if (!user) {
		throw new WrongCredentialsError('Wrong credentials');
	}

	const hash = user.getHash();
	if (!hash) {
		throw new WrongCredentialsError('Wrong credentials');
	}

	const result = await bcrypt.compare(password, hash);
	if (!result) {
		throw new WrongCredentialsError('Wrong credentials');
	}

	return tokenGet(user);
}

/** Verifies the token
 *
 * @throws BadRequestError if the token is invalid (for example if the 'Bearer' part is missing)
 * @throws WrongCredentialsError if the token is invalid (when decoded, the token is not an object), or jwt.verify throws an error
 *
 * @returns User id associated with the token
 */
function tokenVerify(tokenString: string) {
	// Get the token part from 'Bearer token'
	const tokenParts = tokenString.split(' ');
	if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
		throw new BadRequestError('Invalid token');
	}

	const token = tokenParts[1];

	logger.info('Token: ' + token);

	let userId: string = '';
	try {
		const decodedToken = jwt.verify(token, secretKey);

		if (typeof decodedToken === 'string') {
			throw new WrongCredentialsError('Invalid token');
		}

		userId = decodedToken.id;
	} catch (err) {
		throw new WrongCredentialsError('Invalid token');
	}

	return userId;
}

/** Generate a signed token for user, expires in 7 days */
function tokenGet(user: User) {
	const token = jwt.sign(user.dataValues, secretKey, { expiresIn: '7d' });

	return token;
}

export { login, tokenVerify, generateHash, tokenGet };
