
import { Hono } from "hono";
import { authHandler, authSuperHandler } from "../middleware";
import { zValidator } from '@hono/zod-validator'
import { userCreateGuest, userGet, userGetMultiple, userUpdate } from "../controllers/user";
import { tokenGet } from "../controllers/auth";
import { UnauthorizedError } from "../errors";
import { userModifiableSchema } from "../types/user";

const usersRouter = new Hono().post('', async (c) => {
	const user = await userCreateGuest();

	c.status(200);
	return c.json({ token: tokenGet(user), user: await user.data() });
}).get('/self', authHandler, async (c) => {
	c.status(200);
	return c.json({ user: c.var.user });
}).get('/:id', authHandler, async (c) => {
	const { id: userId } = c.req.param();

	if (userId !== c.var.user.id && !c.var.user.isSuperUser()) throw new UnauthorizedError('User is not and admin and cannot get this user');

	const user = await userGet(userId);

	c.status(200);
	return c.json({ user: await user.data() });
}).get('', authSuperHandler, async (c) => {
	const { role, username, email, pageParam, sizeParam } = c.req.query();

	const { users, total, page, size } = await userGetMultiple(
		{
			page: pageParam ? parseInt(pageParam) : undefined,
			size: sizeParam ? parseInt(sizeParam) : undefined
		},
		{
			role,
			username,
			email
		});

	const hasNextPage = page * size < total;

	c.status(200);
	return c.json({ items: users, hasNextPage });
}).put('/:id', authHandler, zValidator('form', userModifiableSchema), async (c) => {
	const { id: userId } = c.req.param();

	if (userId !== c.var.user.id && !c.var.user.isSuperUser()) throw new UnauthorizedError('User is not an admin and can\'t update this user');

	const user = await userGet(userId);

	const updatedUserData = await userUpdate(c.var.user, user, c.req.valid('form'));

	c.status(200);
	return c.json({ user: updatedUserData });
});

export default usersRouter;
