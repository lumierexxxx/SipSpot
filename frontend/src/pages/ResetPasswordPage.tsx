// ============================================
// SipSpot Frontend - Reset Password Page
// 重置密码页面（通过邮件链接进入）
// ============================================

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '@services/authAPI'

interface ResetFormData {
  password: string
  confirm: string
}

interface PasswordStrength {
  level: number
  label: string
  color: string
}

type ResetStatus = 'idle' | 'loading' | 'success' | 'error'

const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()

    const [formData, setFormData] = useState<ResetFormData>({ password: '', confirm: '' })
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [showConfirm, setShowConfirm] = useState<boolean>(false)
    const [status, setStatus] = useState<ResetStatus>('idle')
    const [errors, setErrors] = useState<Record<string, string>>({})

    // ============================================
    // 密码强度
    // ============================================
    const getStrength = (pw: string): PasswordStrength => {
        if (!pw) return { level: 0, label: '', color: '' }
        let score = 0
        if (pw.length >= 6) score++
        if (pw.length >= 10) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++
        if (score <= 1) return { level: score, label: '弱', color: 'bg-red-400' }
        if (score <= 3) return { level: score, label: '中', color: 'bg-amber-400' }
        return { level: score, label: '强', color: 'bg-green-500' }
    }

    const strength = getStrength(formData.password)

    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {}
        if (!formData.password) errs.password = '请输入新密码'
        else if (formData.password.length < 6) errs.password = '密码至少 6 个字符'
        if (!formData.confirm) errs.confirm = '请确认新密码'
        else if (formData.password !== formData.confirm) errs.confirm = '两次密码不一致'
        return errs
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name as keyof ResetFormData]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        try {
            setStatus('loading')
            await resetPassword(token!, formData.password)
            setStatus('success')
        } catch (error: unknown) {
            const err = error as { message?: string }
            setErrors({ submit: err.message || '重置失败，链接可能已过期' })
            setStatus('error')
        }
    }

    // ============================================
    // 渲染
    // ============================================
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-4xl">☕</span>
                        </div>
                    </a>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">设置新密码</h2>
                    <p className="text-gray-600">请输入你的新密码</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {status === 'success' ? (
                        /* 成功状态 */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">密码重置成功</h3>
                            <p className="text-gray-600 mb-6">你的密码已更新，请使用新密码登录。</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary px-8 py-2.5"
                            >
                                前往登录
                            </button>
                        </div>
                    ) : (
                        /* 表单 */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* 新密码 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    新密码
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                                        placeholder="至少 6 个字符"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}

                                {/* 密码强度条 */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${strength.level <= 1 ? 'text-red-500' : strength.level <= 3 ? 'text-amber-500' : 'text-green-600'}`}>
                                            密码强度：{strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 确认密码 */}
                            <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                                    确认新密码
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm"
                                        name="confirm"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={formData.confirm}
                                        onChange={handleChange}
                                        className={`input pr-10 ${errors.confirm ? 'input-error' : ''}`}
                                        placeholder="再次输入密码"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirm ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.confirm && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>
                                )}
                                {/* 一致性提示 */}
                                {formData.confirm && formData.password === formData.confirm && (
                                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        密码一致
                                    </p>
                                )}
                            </div>

                            {/* 提交错误 */}
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">{errors.submit}</p>
                                    <a href="/forgot-password" className="text-sm text-red-700 underline mt-1 inline-block">
                                        重新申请重置链接
                                    </a>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full btn btn-primary py-3 text-base"
                            >
                                {status === 'loading' ? (
                                    <div className="flex items-center justify-center">
                                        <div className="spinner w-5 h-5 mr-2" />
                                        重置中...
                                    </div>
                                ) : (
                                    '确认重置密码'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center mt-6">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        返回首页
                    </a>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordPage
