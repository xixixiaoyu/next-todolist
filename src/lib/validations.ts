import { z } from 'zod'

// 认证表单验证
export const loginSchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空').min(6, '密码至少需要 6 个字符'),
})

export const registerSchema = z
  .object({
    email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(1, '密码不能为空')
      .min(6, '密码至少需要 6 个字符')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        '密码必须包含至少一个大写字母、一个小写字母和一个数字'
      ),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

// Todo 表单验证
export const todoSchema = z.object({
  title: z
    .string()
    .min(1, '标题不能为空')
    .max(100, '标题不能超过 100 个字符')
    .trim()
    .refine((val) => val.length > 0, '标题不能只包含空格'),
  description: z
    .string()
    .max(500, '描述不能超过 500 个字符')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

// 导出类型
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type TodoFormData = z.infer<typeof todoSchema>
