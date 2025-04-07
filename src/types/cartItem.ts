import { z } from 'zod'

export const cartItemModifiableSchema = z.object({})

export type CartItemModifiable = z.infer<typeof cartItemModifiableSchema>
