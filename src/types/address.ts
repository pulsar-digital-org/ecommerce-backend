import { z } from 'zod'

export const addressModifiableSchema = z.object({
	streetName: z.string().min(1),
	streetNumber: z.string().min(1),
	postalCode: z.string().min(1),
	city: z.string().min(1),
	country: z.string().min(1),
})

export type AddressModifiable = z.infer<typeof addressModifiableSchema>

export const addressGetSchema = z.object({
	pageParam: z.string().optional(),
	sizeParam: z.string().optional(),
})
