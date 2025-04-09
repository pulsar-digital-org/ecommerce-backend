import { z } from 'zod'

export const queryGetMultipleSchema = z.object({
	pageParam: z.string().optional(),
	sizeParam: z.string().optional(),
})
