import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100).trim(),
  phone: z.string().regex(/^(\+84|0)[0-9]{9}$/, 'Số điện thoại không hợp lệ').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
