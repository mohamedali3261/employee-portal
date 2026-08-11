import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Loader2, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginAdmin, changeAdminPassword, changePasswordWithSecurity } from '../../services/api';
import { useLanguage, translations } from '../../contexts/LanguageContext';
import Navbar from '../../components/common/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 10;

function getLoginAttempts() {
  try {
    return JSON.parse(localStorage.getItem('loginAttempts') || '{}');
  } catch {
    return {};
  }
}

function setLoginAttempts(attempts) {
  localStorage.setItem('loginAttempts', JSON.stringify(attempts));
}

function isLockedOut(username) {
  if (!username) return false;
  const attempts = getLoginAttempts();
  const record = attempts[username];
  if (!record) return false;
  if (record.count >= MAX_ATTEMPTS) {
    const elapsed = (Date.now() - record.lockedAt) / 1000 / 60;
    if (elapsed < LOCKOUT_MINUTES) return true;
    delete attempts[username];
    setLoginAttempts(attempts);
  }
  return false;
}

function recordFailedAttempt(username) {
  if (!username) return;
  const attempts = getLoginAttempts();
  const record = attempts[username] || { count: 0, lockedAt: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) record.lockedAt = Date.now();
  attempts[username] = record;
  setLoginAttempts(attempts);
  return record.count;
}

function clearAttempts(username) {
  if (!username) return;
  const attempts = getLoginAttempts();
  delete attempts[username];
  setLoginAttempts(attempts);
}

export default function LoginPage() {
  const [username, setUsername] = useState(() => localStorage.getItem('rememberedUser') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedUser'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('login'));

  const [mustChangePw, setMustChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const LANGUAGES = ['en', 'ar', 'fr'];
  const SECURITY_QUESTIONS = [1, 2, 3, 4].map((n) => {
    const key = `securityQ${n}`;
    return LANGUAGES.map((l) => translations[l][key]).join(' / ');
  })

  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('admin') || '{}');
    if (token) {
      if (user.role === 'user') {
        navigate('/portal', { replace: true });
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLockedOut(username)) {
      const msg = t('lockoutMessage') || `Too many failed attempts. Please wait ${LOCKOUT_MINUTES} minutes.`;
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const res = await loginAdmin({ username, password, rememberMe });
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      clearAttempts(username);
      if (res.data?.mustChangePassword) {
        setMustChangePw(true);
      } else {
        toast.success(t('loginSuccess'));
        const user = res.data?.user;
        if (user?.role === 'user') {
          navigate('/portal');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      const count = recordFailedAttempt(username);
      const remaining = MAX_ATTEMPTS - count;
      let message = err.message || t('loginFailed');
      if (remaining > 0) {
        message += ` (${remaining} ${t('attemptsRemaining') || 'attempts remaining'})`;
      } else {
        message = t('lockoutMessage') || `Too many failed attempts. Please wait ${LOCKOUT_MINUTES} minutes.`;
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = pwForm;
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }
    setChangingPw(true);
    try {
      await changePasswordWithSecurity({
        newPassword,
        confirmPassword,
        question: securityQuestion || undefined,
        answer: securityAnswer || undefined,
      });
      toast.success(t('passwordChanged'));
      setMustChangePw(false);
      const user = JSON.parse(localStorage.getItem('admin') || '{}');
      if (user.role === 'user') {
        navigate('/portal');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(err.message || t('saveFailed'));
    } finally {
      setChangingPw(false);
    }
  };

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
            <img src="/good_france.png" alt="Welcome" className="login-good-img" />
            <h2 className="login-title">{t('welcome')}</h2>
            <p className="login-subtitle">{t('welcomeHint')}</p>
          </div>

          {error && (
            <div className="login-error">
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="username">
                {t('username')}
              </label>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                {t('password')}
              </label>
              <div className="login-password-wrapper">
                <Lock size={16} className="login-password-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-remember">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                <span>{t('rememberMe') || 'Remember me'}</span>
              </label>
            </div>

            <div className="login-forgot">
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 13 }}>
                {t('forgotPassword')}
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="login-spinner" />
                  <span>{t('loading')}</span>
                </>
              ) : (
                <span>{t('login')}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forced Password Change Modal Popup */}
      {mustChangePw && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 480, padding: 32, borderRadius: 16, border: '1px solid var(--border-color, #e5e7eb)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary, #3b82f6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                {t('changePasswordFirst') || 'تغيير كلمة المرور المبدئية'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                {t('changePasswordFirstHint') || 'حسابك جديد أو تمت إعادة ضبط كلمة المرور له. يرجى كتابة كلمة المرور الجديدة مرتين للاستمرار.'}
              </p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="login-field" style={{ margin: 0 }}>
                <label className="login-label" style={{ marginBottom: 6 }}>{t('newPassword') || 'كلمة المرور الجديدة'}</label>
                <div className="login-password-wrapper">
                  <Lock size={16} className="login-password-icon" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="login-input"
                    placeholder={t('newPasswordPlaceholder') || 'أدخل كلمة المرور الجديدة...'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button type="button" className="login-password-toggle" onClick={() => setShowNewPw(!showNewPw)} tabIndex={-1}>
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-field" style={{ margin: 0 }}>
                <label className="login-label" style={{ marginBottom: 6 }}>{t('confirmPassword') || 'تأكيد كلمة المرور الجديدة'}</label>
                <div className="login-password-wrapper">
                  <Lock size={16} className="login-password-icon" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="login-input"
                    placeholder={t('confirmPasswordPlaceholder') || 'تأكيد كلمة المرور الجديدة...'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button type="button" className="login-password-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1}>
                    {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Security Question Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={15} />
                  {t('securityQuestionOptionalHint')}
                </div>

                <div className="login-field" style={{ margin: '0 0 12px 0' }}>
                  <label className="login-label" style={{ marginBottom: 6 }}>{t('chooseQuestion')}</label>
                  <select
                    className="login-select"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                  >
                    <option value="">-- {t('chooseSecurityQuestion')} --</option>
                    {SECURITY_QUESTIONS.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                {securityQuestion && (
                  <div className="login-field" style={{ margin: 0 }}>
                    <label className="login-label" style={{ marginBottom: 6 }}>{t('answer')}</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder={t('answerPlaceholder')}
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="login-btn" disabled={changingPw} style={{ marginTop: 8 }}>
                {changingPw ? (
                  <><Loader2 size={20} className="login-spinner" /><span>{t('loading')}</span></>
                ) : (
                  <span>{t('saveAndLogin')}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}