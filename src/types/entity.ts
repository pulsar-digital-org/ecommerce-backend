import { z } from 'zod'

export const entityModifiableSchema = z.object({
	name: z
		.string({
			required_error: 'Name must be provided!',
			invalid_type_error: 'Name must be a string!',
		})
		.min(1),
	email: z
		.string({
			required_error: 'Email must be provided!',
		})
		.email()
		.min(1),
	// validation for phone numbers
	phone: z.string().optional(),

	orgId: z.string().optional(),
	taxId: z.string().optional(),
	vatId: z.string().optional(),
})

export type EntityModifiable = z.infer<typeof entityModifiableSchema>
