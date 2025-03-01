import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
});

export const validateLoginInput = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateRegisterInput = (data: unknown) => {
  return registerSchema.safeParse(data);
};
