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
	parentId: z.union([z.string().uuid(), z.literal("null")]).optional(),
	pageParam: z.string().optional(),
	sizeParam: z.string().optional()
});
