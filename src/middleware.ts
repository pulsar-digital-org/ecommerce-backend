import { createMiddleware } from 'hono/factory'
import { tokenVerify } from './controllers/auth';
import { userGet } from './controllers/user';
import { User } from './db/models/User';
import { UnauthorizedError } from './errors';

type Auth = {
	Variables: {
		user: User
	}
}

const authHandler = createMiddleware<Auth>(async (c, next) => {
	const token = c.req.header('Authorization');
	if (!token) throw new UnauthorizedError('No token provided');

	const userId = tokenVerify(token);
	const user = await userGet(userId);

	c.set('user', user);

	await next();
});

const authSuperHandler = createMiddleware<Auth>(async (c, next) => {
	const token = c.req.header('Authorization');
	if (!token) throw new UnauthorizedError('No token provided');

	const userId = tokenVerify(token);
	const user = await userGet(userId);

	if (!user.isSuperUser()) throw new UnauthorizedError('User is not a super user');

	c.set('user', user);

	await next();
});

export {
	authHandler,
	authSuperHandler
};
