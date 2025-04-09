import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
	addressCreate,
	addressDelete,
	addressGet,
	addressGetMultiple,
} from '../controllers/address'
import { UnauthorizedError } from '../errors'
import { authHandler, authSuperHandler } from '../middleware'
import { addressGetSchema, addressModifiableSchema } from '../types/address'

const addressRouter = new Hono()
	.post(
		'',
		authHandler,
		zValidator('json', addressModifiableSchema),
		async (c) => {
			// TODO: this might be changed to create an address for any user
			// because we can have userId/address POST request where we can create address for any user if we are super user
			const user = c.var.user

			const address = await addressCreate(c.req.valid('json'), user)

			c.status(200)
			return c.json({ address })
		}
	)
	.get('/:id', authHandler, async (c) => {
		const { id: addressId } = c.req.param()

		const user = c.var.user

		const address = await addressGet(addressId)

		if (!user.hasAddress(address) && !user.isSuperUser())
			throw new UnauthorizedError("You don't have access to this address")

		c.status(200)
		return c.json({ address: await address.data() })
	})
	.get(
		'',
		authSuperHandler,
		zValidator('query', addressGetSchema),
		async (c) => {
			const { pageParam, sizeParam } = c.req.valid('query')

			const { addresses, total, page, size } = await addressGetMultiple(
				{
					page: pageParam ? parseInt(pageParam) : undefined,
					size: sizeParam ? parseInt(sizeParam) : undefined,
				},
				{},
				[]
			)

			const hasNextPage = page * size < total

			c.status(200)
			return c.json({ items: addresses, hasNextPage })
		}
	)
	.delete('/:id', authSuperHandler, async (c) => {
		const { id: addressId } = c.req.param()

		const address = await addressGet(addressId)

		await addressDelete(address)

		c.status(200)
		return c.json({ message: 'Address deleted' })
	})

export default addressRouter
