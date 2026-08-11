import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, LogOut } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

 const TIMEOUT = 10 * 60 * 1000
 const WARNING = 60 * 1000

export default function IdleTimer() {
  const [showWarning, setShowWarning] = useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const timerRef = useRef(null)
  const warningRef = useRef(null)
  const countdownRef = useRef(null)
  const [countdown, setCountdown] = useState(60)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    navigate('/login')
  }, [navigate])

  const resetTimer = useCallback(() => {
    setShowWarning(false)
    clearTimeout(timerRef.current)
    clearTimeout(warningRef.current)
    clearInterval(countdownRef.current)
    timerRef.current = setTimeout(() => setShowWarning(true), TIMEOUT - WARNING)
    warningRef.current = setTimeout(() => {
      logout()
    }, TIMEOUT)
  }, [logout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => resetTimer()
    events.forEach(ev => window.addEventListener(ev, handler))
    resetTimer()
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handler))
      clearTimeout(timerRef.current)
      clearTimeout(warningRef.current)
      clearInterval(countdownRef.current)
    }
  }, [resetTimer])

  useEffect(() => {
    if (showWarning) {
      setCountdown(60)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(countdownRef.current)
    }
  }, [showWarning])

  if (!showWarning) return null

  return (
    <div className="idle-overlay">
      <div className="idle-modal">
        <div className="idle-icon"><Clock size={40} /></div>
        <h2 className="idle-title">{t('sessionTimeout') || 'Session Timeout'}</h2>
        <p className="idle-text">{t('sessionTimeoutHint') || 'You have been inactive. You will be logged out due to inactivity.'}</p>
        <div className="idle-countdown">{countdown}s</div>
        <div className="idle-actions">
          <button className="btn btn-primary" onClick={resetTimer}>
            {t('stayLoggedIn') || 'Stay Logged In'}
          </button>
          <button className="btn btn-outline" onClick={logout}>
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
