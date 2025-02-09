import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { Op } from "sequelize";
import { productCreate, productDelete, productGet, productGetMultiple, productUpdate } from "../controllers/product";
import { Category } from "../db/models/Category";
import { authSuperHandler } from "../middleware";
import { productModifiableSchema } from "../types/product";

const productsRouter = new Hono().post('', authSuperHandler, zValidator('form', productModifiableSchema), async (c) => {
	const product = await productCreate(c.req.valid('form'));

	c.status(200);
	return c.json({ product });
}).get('/:id', async (c) => {
	const { id: productId } = c.req.param();

	const product = await productGet(productId);

	c.status(200);
	return c.json({ product: await product.data() });
}).get('', async (c) => {
	// TODO:
	const { category: categoryName, name, pageParam, sizeParam } = c.req.query();

	const { products, total, page, size } = await productGetMultiple(
		{
			page: pageParam ? parseInt(pageParam) : undefined,
			size: sizeParam ? parseInt(sizeParam) : undefined
		},
		{
			name,
		}, [
		{
			model: Category,
			where: !categoryName ? { name: { [Op.is]: null } } : { name: categoryName },
			required: !!categoryName,
		},
	],
	);

	const hasNextPage = page * size < total;

	c.status(200);
	return c.json({ items: products, hasNextPage });
}).put('/:id', authSuperHandler, zValidator('form', productModifiableSchema), async (c) => {
	const { id: productId } = c.req.param();

	const product = await productGet(productId);

	const updatedProduct = await productUpdate(product, c.req.valid('form'));

	c.status(200);
	return c.json({ product: updatedProduct });
}).delete('/:id', authSuperHandler, async (c) => {
	const { id: productId } = c.req.param();

	const product = await productGet(productId);

	await productDelete(product);

	c.status(200);
	return c.json({ message: 'Product deleted' });
});

export default productsRouter;
