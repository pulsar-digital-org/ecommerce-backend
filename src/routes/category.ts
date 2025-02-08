import { Hono } from "hono";


const categoriesRouter = new Hono();

categoriesRouter.get('/', async (c) => {
	console.log('yo');
});

export default categoriesRouter;
