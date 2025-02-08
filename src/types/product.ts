import { z } from 'zod';

export const productModifiableSchema = z.object({
	name: z.string({
		required_error: "Name must be provided!",
		invalid_type_error: "Name must be a string!",
	}).min(1),
	description: z.string().optional(),
	stock: z.number().optional(),

	images: z.array(z.string()).optional(),
	categories: z.array(z.string()).min(1)
});

export const productBaseSchema = productModifiableSchema;

export type ProductModifiable = z.infer<typeof productModifiableSchema>;
