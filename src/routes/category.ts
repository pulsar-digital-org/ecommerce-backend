import { Hono } from "hono";
import { categoryCreate, categoryDelete, categoryGet, categoryGetMultiple, categorySubAdd, categorySubRemove, categoryUpdate } from "../controllers/category";
import { authSuperHandler } from "../middleware";
import { zValidator } from '@hono/zod-validator'
import { categoryModifiableSchema } from "../types/category";

const categoriesRouter = new Hono();

categoriesRouter.post('/', authSuperHandler, zValidator('form', categoryModifiableSchema), async (c) => {
	const category = await categoryCreate(c.req.valid('form'));

	c.status(200);
	return c.json({ category });
});


categoriesRouter.get('/:id', async (c) => {
	const { id: categoryId } = c.req.param();

	const category = await categoryGet(categoryId);

	c.status(200);
	return c.json({ category: await category.data() });
});

categoriesRouter.get('/', async (c) => {
	const { name, parent, pageParam, sizeParam } = c.req.query();

	const { categories, total, page, size } = await categoryGetMultiple(
		{
			page: pageParam ? parseInt(pageParam) : undefined,
			size: sizeParam ? parseInt(sizeParam) : undefined
		},
		{
			name,
			parentCategoryId: parent
		});

	const hasNextPage = page * size < total;

	c.status(200);
	return c.json({ items: categories, hasNextPage });
});

categoriesRouter.put('/:id', authSuperHandler, zValidator('form', categoryModifiableSchema), async (c) => {
	const { id: categoryId } = c.req.param();

	const category = await categoryGet(categoryId);

	const updatedCategory = await categoryUpdate(category, c.req.valid('form'));

	c.status(200);
	return c.json({ category: updatedCategory });
});

categoriesRouter.delete('/:id', authSuperHandler, async (c) => {
	const { id: categoryId } = c.req.param();

	const category = await categoryGet(categoryId);

	await categoryDelete(category);

	c.status(200);
	return c.json({ message: 'Category deleted' });
});

categoriesRouter.post('/:id/:subcategoryId', authSuperHandler, async (c) => {
	const { id: categoryId, subcategoryId } = c.req.param();

	const category = await categoryGet(categoryId);
	const subcategory = await categoryGet(subcategoryId);

	await categorySubAdd(category, subcategory);

	c.status(200);
	return c.json({ message: 'Subcategory added' });
});

categoriesRouter.delete('/:id/:subcategoryId', authSuperHandler, async (c) => {
	const { id: categoryId, subcategoryId } = c.req.param();

	const category = await categoryGet(categoryId);
	const subcategory = await categoryGet(subcategoryId);

	await categorySubRemove(category, subcategory);

	c.status(200);
	return c.json({ message: 'Subcategory removed' });
});

export default categoriesRouter;
