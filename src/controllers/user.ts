import { User, UserInterface } from '../db/models/User';
import { generateHash } from './auth';

import { AlreadyExistsError, BadRequestError, NotFoundError } from '../errors';
import { Op } from 'sequelize';
import { UserRole } from '../db/types';
import logger from '../logger';

/** Create new user or update an existing user with email, username and password.
 *
 * @throws {BadRequestError} If credentials are not provided or user is already registered (aka. not guest) or if validation fails.
 * @throws {AlreadyExistsError} If user with the same username or email already exists.
 *
 * @returns {UserInterface} Newly created user or updated user.
 */
async function userCreate(
  username: string,
  email: string,
  password: string,
  existing_user?: User
): Promise<UserInterface> {
  if (!username || !email || !password)
    throw new BadRequestError('Credentials not provided');

  var user = await User.findOne({
    where: {
      [Op.or]: {
        email: email,
        username: username
      }
    }
  });

  if (user)
    throw new AlreadyExistsError(
      'User with the same username or email already exists'
    );

  const hash = await generateHash(password);

  if (existing_user) {
    if (existing_user.role !== UserRole.guest) {
      throw new BadRequestError('User is already registered');
    }

    user = existing_user;
    userUpdate(user, user, {
      username: username,
      email: email,
      passwordHash: hash,
      role: UserRole.user
    });

    return user.data();
  }

  user = User.build({
    username: username,
    email: email,
    passwordHash: hash,
    role: UserRole.user
  });

  try {
    await user.validate();
  } catch (err) {
    throw new BadRequestError(`Invalid user data: ${err}`);
  }

  await user.save();

  return user.data();
}

async function userCreateGuest() {
  const user = User.build({
    role: UserRole.guest
  });

  try {
    await user.validate();
  } catch (err) {
    logger.error(err);
    throw new BadRequestError(
      `Invalid user data, either username, email or password is not valid ${err}`
    );
  }

  await user.save();

  return user;
}

/**
 * This function retrieves a User instance by its id.
 *
 * @throws NotFoundError If no user with provided ID is found
 *
 * @param id - User id
 *
 * @returns User
 */
async function userGet(id: string) {
  // TODO: validate uuid(sanitize)?

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * This function retrieves multiple users based on the provided options which are partial matches.
 *
 * @throws NotFoundError
 *
 * @param limit - How many users to return, defaults to 10, max is 20
 * @param options - Partial options to filter users by
 *
 * @returns - Array of users matched by options
 */
async function userGetMultiple(
  options: { page?: number; size?: number } = {},
  filters: { [key: string]: string | undefined | null } = {}
) {
  const { page = 1, size = 10 } = options;

  const offset = (page - 1) * size;

  const filteredEntries = Object.entries(filters).filter(
    ([_, value]) =>
      value !== undefined &&
      value !== 'undefined' &&
      value !== null &&
      value !== ''
  );

  const conditions = filteredEntries.map(([key, value]) => ({
    [key]: {
      [Op.like]: `%${value}%`
    }
  }));

  const queryOptions = {
    limit: Math.min(size, 10),
    offset,
    where: conditions.length > 0 ? { [Op.and]: conditions } : {}
  };

  const users = await User.findAll({
    ...queryOptions,
    order: [['createdAt', 'DESC']]
  });

  return Promise.all(users.map(async (user) => user.data()));
}

/**
 * Update user.
 *
 * @throws BadRequestError If user is not found
 *
 * @param user - The user model instance to update
 * @param updateData - An object containing the fields to update on the user
 *
 * @returns The updated user data
 */
async function userUpdate(
  userRequestingUpdate: User,
  userToUpdate: User,
  updateData: any
) {
  userToUpdate.set({
    username: updateData.username,
    email: updateData.email
  });

  // Possible token update with admin privileges
  if (userRequestingUpdate.isOwner()) {
    if (
      updateData.role &&
      updateData.role in UserRole &&
      userRequestingUpdate.id !== userToUpdate.id
    ) {
      userToUpdate.set({
        role: updateData.role as UserRole
      });
    }
  }

  try {
    await userToUpdate.validate();
  } catch (err) {
    throw new BadRequestError('Validation failed');
  }

  await userToUpdate.save();

  return userToUpdate.data();
}

/**
 * TODO: implement soft delete
 * Hard delete user.
 *
 * @param user - User to be deleted
 * @param force - TODO:
 *
 * @returns Void, throws if errors
 */
async function userDelete(user: User) {
  await user.delete();
}

export {
  userCreate,
  userGet,
  userGetMultiple,
  userUpdate,
  userDelete,
  userCreateGuest
};
