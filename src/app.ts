import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception';
import db from './db/db';
import { initModels } from './db/models/models';
import { NotAvailableError } from './errors';
import authRouter from './routes/auth';
import categoriesRouter from './routes/category';
import productsRouter from './routes/product';
import usersRouter from './routes/user';

const app = new Hono().use(async (c, next) => {
	try {
		console.log(c.req.path);
		initModels(db);
	} catch (err) {
		console.error(err);
		throw new NotAvailableError('Database is not available');
	}
	await next();
}).onError((err, c) => {
	if (err instanceof HTTPException) {
		c.status(err.status);
		return c.json({ message: err.message });
	}

	console.error(err);

	c.status(500);
	return c.json({ message: "Unknown error" });
}).route('api/categories/', categoriesRouter).route('api/auth/', authRouter).route('api/users/', usersRouter).route('api/products/', productsRouter);

export default app;
