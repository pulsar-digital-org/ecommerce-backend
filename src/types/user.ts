import { z } from 'zod';
import { UserRole } from '../db/types';

export const userModifiableSchema = z.object({
	username: z.string().min(4),
	email: z.string().email().min(1),
	role: z.nativeEnum(UserRole).optional()
});

export type UserModifiable = z.infer<typeof userModifiableSchema>;

export const userCreationSchema = z.object({
	username: z.string().min(4),
	email: z.string().email().min(1),
	plainPassword: z.string().min(4)
});

export type UserCreation = z.infer<typeof userCreationSchema>;
