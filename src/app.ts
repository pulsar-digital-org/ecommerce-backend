import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception';
import { categoryGet } from './controllers/category';
import db from './db/db';
import { initModels } from './db/models/models';
import { NotAvailableError } from './errors';
import categoriesRouter from './routes/category';

const app = new Hono()

app.use(async (_, next) => {
	try {
		initModels(db);
	} catch (err) {
		console.error(err);
		throw new NotAvailableError('Database is not available');
	}
	await next();
})

app.route('api/categories/', categoriesRouter);

app.get('api/da/', (c) => c.text('Hello Azure Functions!'))
app.get('api/', async (c) => {
	const cat = await categoryGet('17d44ea2-edbe-4ca6-b042-24920394ec5');
	return c.json(await cat.data());
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		c.status(err.status);
		return c.json({ message: err.message });
	}

	c.status(500);
	return c.json({ message: "Unknown error" });
});

export default app
