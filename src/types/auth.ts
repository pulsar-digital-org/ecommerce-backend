import { z } from "zod";
import { userCreationSchema } from "./user";

const loginSchema = z.object({
	identifier: z.string().min(4),
	plainPassword: z.string().min(4)
});

const registerSchema = userCreationSchema.merge(z.object({
	token: z.string().uuid().optional()
}));

export { loginSchema, registerSchema };
