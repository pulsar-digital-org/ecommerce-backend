import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception';
import db from './db/db';
import { initModels } from './db/models/models';
import { NotAvailableError } from './errors';
import authRouter from './routes/auth';
import categoriesRouter from './routes/category';
import productsRouter from './routes/product';
import usersRouter from './routes/user';

const app = new Hono()

app.use(async (c, next) => {
	try {
		console.log(c.req.path);
		initModels(db);
	} catch (err) {
		console.error(err);
		throw new NotAvailableError('Database is not available');
	}
	await next();
})

app.route('api/categories/', categoriesRouter);
app.route('api/auth/', authRouter);
app.route('api/users/', usersRouter);
app.route('api/products/', productsRouter);

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		c.status(err.status);
		return c.json({ message: err.message });
	}

	console.error(err);

	c.status(500);
	return c.json({ message: "Unknown error" });
});

export default app
