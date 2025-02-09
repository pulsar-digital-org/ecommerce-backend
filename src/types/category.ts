import { z } from 'zod';

export const categoryModifiableSchema = z.object({
	name: z.string({
		required_error: "Name must be provided!",
		invalid_type_error: "Name must be a string!",
	}).min(1),
	imageId: z.string().uuid().min(1),
	parentId: z.string().optional()
});

export type CategoryModifiable = z.infer<typeof categoryModifiableSchema>;

export const categoriesGetSchema = z.object({
	name: z.string().optional(),
	parentId: z.string().uuid().optional(),
	pageParam: z.number().min(1),
	sizeParam: z.number().optional()
});
