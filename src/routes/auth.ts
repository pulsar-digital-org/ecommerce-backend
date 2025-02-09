import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { login, tokenGet } from "../controllers/auth";
import { userCreate, userGet } from "../controllers/user";
import { User } from "../db/models/User";
import { BadRequestError, NotFoundError } from "../errors";
import { loginSchema, registerSchema } from "../types/auth";

const authRouter = new Hono().post('login/', zValidator('form', loginSchema), async (c) => {
	const { identifier, plainPassword } = c.req.valid('form');

	const token = await login(identifier, plainPassword);

	c.status(200);
	return c.json({ token });
}).post('register/', zValidator('form', registerSchema), async (c) => {
	const { username, email, plainPassword, token } = c.req.valid('form');

	let existingUser: User | undefined;
	if (token) {
		try {
			existingUser = await userGet(token);
		} catch (err) {
			if (!(err instanceof NotFoundError)) {
				throw new BadRequestError('Something went wrong');
			}
		}
	}

	const userData = await userCreate({ username, email, plainPassword }, existingUser);

	const user = await userGet(userData.id);

	c.status(200);
	return c.json({ token: tokenGet(user) });
});

export default authRouter;
