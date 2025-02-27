import { z } from 'zod'

export const productModifiableSchema = z.object({
	name: z
		.string({
			required_error: 'Name must be provided!',
			invalid_type_error: 'Name must be a string!',
		})
		.min(1),
	description: z.string().optional(),
	stock: z.number().optional(),

	images: z.array(z.string().uuid()).optional(),
	thumbnail: z.string().uuid().min(1),
	categories: z.array(z.string().uuid()).min(1),
})

export type ProductModifiable = z.infer<typeof productModifiableSchema>

export const productsGetSchema = z.object({
	categoryId: z.string().uuid().optional(),
	name: z.string().optional(),
	pageParam: z.string().optional(),
	sizeParam: z.string().optional(),
})
