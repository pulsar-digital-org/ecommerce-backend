import { Hono } from "hono";
import { authSuperHandler } from "../middleware";

const imagesRouter = new Hono().post('/', authSuperHandler, async (c) => {
	//const category = await categoryCreate(c.req.body);

	c.status(200);
	return c.json({});
});

export default imagesRouter;
