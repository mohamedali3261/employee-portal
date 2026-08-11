import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, HelpCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSecurityQuestion, forgotPassword } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import Navbar from '../../components/common/Navbar'
import usePageTitle from '../../hooks/usePageTitle'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  usePageTitle(t('forgotPassword'))
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: enter username, 2: answer question + new password
  const [username, setUsername] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFindUser = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    try {
      const res = await getSecurityQuestion(username.trim())
      setQuestion(res.data?.question || '')
      setStep(2)
    } catch (err) {
      toast.error(err.message || t('userNotFound'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!answer.trim()) { toast.error(t('answerRequired')); return }
    if (!newPassword || !confirmPassword) { toast.error(t('passwordRequired')); return }
    if (newPassword !== confirmPassword) { toast.error(t('passwordMismatch')); return }
    if (newPassword.length < 6) { toast.error(t('passwordMinLength')); return }

    setLoading(true)
    try {
      await forgotPassword({ username, answer, newPassword })
      toast.success('تم إعادة تعيين كلمة المرور بنجاح')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'الإجابة غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-animation">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
        <div className="login-bg-circle login-bg-circle-4"></div>
      </div>

      <Navbar variant="employee" />

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-icon-wrapper" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <HelpCircle size={30} color="white" />
            </div>
            <h2 className="login-title">{t('forgotPasswordTitle') || 'نسيت كلمة السر؟'}</h2>
            <p className="login-subtitle">
              {step === 1 ? (t('forgotPasswordStep1') || 'أدخل اسم المستخدم للمتابعة') : (t('forgotPasswordStep2') || 'أجب على سؤال الأمان وأدخل كلمة مرور جديدة')}
            </p>
          </div>

          {/* Step 1: Enter username */}
          {step === 1 && (
            <form className="login-form" onSubmit={handleFindUser}>
              <div className="login-field">
                <label className="login-label">{t('username') || 'اسم المستخدم'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="login-input"
                    placeholder={t('username') || 'اسم المستخدم'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading || !username.trim()}>
                {loading
                  ? <><Loader2 size={20} className="login-spinner" /><span>{t('searchingUser') || 'جاري البحث...'}</span></>
                  : <span>{t('continueBtn') || 'متابعة'}</span>
                }
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/login" style={{ color: 'var(--primary)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={14} />
                  {t('backToLogin') || 'العودة لتسجيل الدخول'}
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Answer + new password */}
          {step === 2 && (
            <form className="login-form" onSubmit={handleReset}>
              {/* Security Question Display */}
              <div style={{
                background: 'rgba(255, 140, 0, 0.08)',
                border: '1px solid rgba(255, 140, 0, 0.25)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 4
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('securityQuestion') || 'سؤال الأمان:'}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{question}</div>
              </div>

              <div className="login-field">
                <label className="login-label">{t('answer') || 'الإجابة'}</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder={t('answerPlaceholder') || 'اكتب إجابتك هنا...'}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div className="login-field">
                <label className="login-label">{t('newPasswordLabel') || 'كلمة المرور الجديدة'}</label>
                <div className="login-password-wrapper">
                  <Lock size={16} className="login-password-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder={t('newPasswordLabel') || 'كلمة المرور الجديدة'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">{t('confirmPasswordLabel') || 'تأكيد كلمة المرور'}</label>
                <div className="login-password-wrapper">
                  <Lock size={16} className="login-password-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="login-input"
                    placeholder={t('confirmPasswordLabel') || 'تأكيد كلمة المرور'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button type="button" className="login-password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? <><Loader2 size={20} className="login-spinner" /><span>{t('savingPassword') || 'جاري الحفظ...'}</span></>
                  : <><ShieldCheck size={18} /><span>{t('resetPassword') || 'إعادة تعيين كلمة المرور'}</span></>
                }
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={13} /> {t('changeUsername') || 'تغيير اسم المستخدم'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
