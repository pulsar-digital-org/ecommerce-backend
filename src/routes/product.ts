import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Op } from 'sequelize'
import {
	productCreate,
	productDelete,
	productGet,
	productGetMultiple,
	productUpdate,
} from '../controllers/product'
import { Category } from '../db/models/Category'
import { authSuperHandler } from '../middleware'
import { productModifiableSchema, productsGetSchema } from '../types/product'

const productsRouter = new Hono()
	.post(
		'',
		authSuperHandler,
		zValidator('json', productModifiableSchema),
		async (c) => {
			const product = await productCreate(c.req.valid('json'))

			c.status(200)
			return c.json({ product })
		}
	)
	.get('/:id', async (c) => {
		const { id: productId } = c.req.param()

		const product = await productGet(productId)

		c.status(200)
		return c.json({ product: await product.data() })
	})
	.get('', zValidator('query', productsGetSchema), async (c) => {
		const { categoryId, name, pageParam, sizeParam } = c.req.valid('query')

		const { products, total, page, size } = await productGetMultiple(
			{
				page: pageParam ? parseInt(pageParam) : undefined,
				size: sizeParam ? parseInt(sizeParam) : undefined,
			},
			{
				name,
			},
			[
				{
					model: Category,
					where: !categoryId ? { name: { [Op.is]: null } } : { id: categoryId },
					required: !!categoryId,
				},
			]
		)

		const hasNextPage = page * size < total

		c.status(200)
		return c.json({ items: products, hasNextPage })
	})
	.put(
		'/:id',
		authSuperHandler,
		zValidator('json', productModifiableSchema),
		async (c) => {
			const { id: productId } = c.req.param()

			const product = await productGet(productId)

			const updatedProduct = await productUpdate(product, c.req.valid('json'))

			c.status(200)
			return c.json({ product: updatedProduct })
		}
	)
	.delete('/:id', authSuperHandler, async (c) => {
		const { id: productId } = c.req.param()

		const product = await productGet(productId)

		await productDelete(product)

		c.status(200)
		return c.json({ message: 'Product deleted' })
	})

export default productsRouter
