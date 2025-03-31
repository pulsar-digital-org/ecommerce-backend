import { z } from 'zod'

export const orderModifiableSchema = z.object({
	orderItems: z.array(z.string().uuid().optional()),
	billingAddress: z.string().uuid(),
	shippingAddress: z.string().uuid().optional(),
	discountId: z.string().uuid().optional(),
})
