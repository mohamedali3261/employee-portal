import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import LoadingScreen from '../../components/common/LoadingScreen'
import { useLanguage } from '../../contexts/LanguageContext'
import { searchPortalEmployees } from '../../services/api'
import usePageTitle from '../../hooks/usePageTitle'

export default function PortalPage() {
  const { t, language } = useLanguage()
  usePageTitle(t('searchEmployee'))
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    // مسح بيانات تسجيل الدخول من localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    // التوجيه لصفحة تسجيل الدخول
    navigate('/login', { replace: true })
  }

  // Fetch search suggestions with debouncing
  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await searchPortalEmployees(query)
        setSuggestions(res.data || [])
      } catch (err) {
        console.error('Failed to search employees:', err)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(`/employee/${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSelectEmployee = (employeeId) => {
    setShowSuggestions(false)
    navigate(`/employee/${employeeId}`)
  }

  return (
    <div className="portal-page">
      {pageLoading && <LoadingScreen />}
      <Navbar variant="employee" onLogout={handleLogout} />

      <div className="portal-bg">
        <div className="portal-blob portal-blob--1" />
        <div className="portal-blob portal-blob--2" />
        <div className="portal-blob portal-blob--3" />
        <div className="portal-blob portal-blob--4" />
      </div>

      <main className="portal-main">
        <div className="portal-content">
          <img src="/good_france.png" alt="Welcome" className="portal-good-img" />

          <div className="login-card" ref={wrapperRef} style={{ position: 'relative', overflow: 'visible' }}>
            <div className="login-card-header">
              <div className="login-icon-wrapper">
                <Search size={28} className="login-icon" />
              </div>
              <h2 className="login-title">{t('searchEmployee')}</h2>
              <p className="login-subtitle">{t('searchEmployeeHint')}</p>
            </div>

            <form className="login-form" onSubmit={handleSearch}>
              <div className="login-input-group" style={{ position: 'relative' }}>
                <label className="login-label" htmlFor="searchQuery">
                  {t('employeeIdOrName') || t('employeeId')}
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="searchQuery"
                    type="text"
                    className="login-input"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    autoComplete="off"
                  />
                  {loading && (
                    <div style={{
                      position: 'absolute',
                      [language === 'ar' ? 'left' : 'right']: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--primary, #3b82f6)'
                    }}>
                      <Loader2 size={18} className="spin" />
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchQuery.trim() && (
                  <div className="portal-suggestions">
                    {suggestions.length === 0 ? (
                      <div className="portal-suggestions-no-results">
                        {!loading && t('noResults')}
                      </div>
                    ) : (
                      suggestions.map((emp) => (
                        <div
                          key={emp._id || emp.employeeId}
                          className="portal-suggestions-item"
                          onClick={() => handleSelectEmployee(emp.employeeId)}
                        >
                          <div className="portal-suggestions-avatar">
                            {emp.profileImage ? (
                              <img src={emp.profileImage} alt={emp.arabicName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={20} style={{ color: 'var(--primary, #3b82f6)' }} />
                            )}
                          </div>
                          <div className="portal-suggestions-info">
                            <div className="portal-suggestions-name">
                              {language === 'ar' ? (emp.arabicName || emp.englishName) : (emp.englishName || emp.arabicName)}
                            </div>
                            <div className="portal-suggestions-detail">
                              <span>{t('employeeId')}: <strong style={{ color: '#000000' }}>{emp.employeeId}</strong></span>
                              {(emp.jobTitleAr || emp.jobTitle) && (
                                <span>• {language === 'ar' ? (emp.jobTitleAr || emp.jobTitle) : emp.jobTitle}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={!searchQuery.trim()}
              >
                <Search size={18} />
                <span>{t('search')}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
