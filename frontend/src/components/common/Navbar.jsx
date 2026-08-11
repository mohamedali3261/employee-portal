import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Menu, X, LogOut, User, ChevronDown, Check, LayoutDashboard, Users, FolderOpen, ListChecks, FileInput, LayoutGrid, UserCheck } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Navbar({ variant = 'employee', onLogout }) {
  const { theme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const drawerRef = useRef(null)
  const langRef = useRef(null)

  const isAdmin = variant === 'admin'

  const languages = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'ar', label: 'AR', full: 'العربية' },
    { code: 'fr', label: 'FR', full: 'Français' },
  ]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setShowLogoutConfirm(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeDrawer = () => setMenuOpen(false)

  const handleLogoutClick = () => {
    closeDrawer()
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    onLogout && onLogout()
  }

  const adminUsername = (() => {
    try { return JSON.parse(localStorage.getItem('admin'))?.username || 'Admin' }
    catch { return 'Admin' }
  })()

  return (
    <>
    <nav className="nb">
      <div className="nb-inner">
        <Link to={isAdmin ? '/admin/dashboard' : '/'} className="nb-brand">
          <img src="/logo.png" alt="Logo" className="nb-brand-logo" />
        </Link>

        <button className="nb-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop actions */}
        <div className="nb-actions nb-actions--desktop">
          <div className="nb-actions-group">
            <div className="nb-lang-wrapper" ref={langRef}>
              <button className="nb-action nb-action--lang" onClick={() => setLangOpen(!langOpen)}>
                <div className="nb-action-icon nb-action-icon--lang">
                  <Globe size={16} />
                </div>
                <span className="nb-action-label">{languages.find(l => l.code === language)?.full || 'English'}</span>
                <ChevronDown size={14} className={`nb-lang-chevron ${langOpen ? 'nb-lang-chevron--open' : ''}`} />
              </button>

              {langOpen && (
                <div className="nb-lang-dropdown">
                  <div className="nb-lang-dropdown-header">{t('language')}</div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`nb-lang-option ${language === lang.code ? 'nb-lang-option--active' : ''}`}
                      onClick={() => {
                        setLanguage(lang.code)
                        setLangOpen(false)
                      }}
                    >
                      <span className="nb-lang-name">{lang.full}</span>
                      {language === lang.code && <Check size={14} className="nb-lang-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isAdmin && onLogout && (
              <button className="nb-action nb-action--danger" onClick={handleLogoutClick}>
                <div className="nb-action-icon nb-action-icon--danger">
                  <LogOut size={16} />
                </div>
                <span className="nb-action-label">{t('logout')}</span>
              </button>
            )}
          </div>

          {isAdmin && (
            <div className="nb-actions-group">
              <div className="nb-divider"></div>
              <div className="nb-user">
                <div className="nb-user-avatar">
                  <User size={14} />
                </div>
                <div className="nb-user-info">
                  <span className="nb-user-name">{adminUsername}</span>
                  <span className="nb-user-role">Administrator</span>
                </div>
              </div>
              <button className="nb-action nb-action--danger" onClick={handleLogoutClick}>
                <div className="nb-action-icon nb-action-icon--danger">
                  <LogOut size={16} />
                </div>
                <span className="nb-action-label">{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile drawer */}
    <div className={`nb-drawer ${menuOpen ? 'nb-drawer--open' : ''}`} ref={drawerRef}>
      <div className="nb-drawer-header">
        {isAdmin && (
          <div className="nb-drawer-user">
            <div className="nb-drawer-user-avatar">
              <User size={16} />
            </div>
            <div>
              <div className="nb-drawer-user-name">{adminUsername}</div>
              <div className="nb-drawer-user-role">Administrator</div>
            </div>
          </div>
        )}
      </div>

      <div className="nb-drawer-body">
        {isAdmin && (
          <>
            <Link to="/admin/dashboard" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><LayoutDashboard size={18} /></div>
              <span>{t('dashboard')}</span>
            </Link>
            <Link to="/admin/employees" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><Users size={18} /></div>
              <span>{t('employees')}</span>
            </Link>
            <Link to="/admin/sections" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><FolderOpen size={18} /></div>
              <span>{t('sections')}</span>
            </Link>
            <Link to="/admin/section-fields" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><ListChecks size={18} /></div>
              <span>{t('sectionFields')}</span>
            </Link>
            <Link to="/admin/custom-fields" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><FileInput size={18} /></div>
              <span>{t('customFields')}</span>
            </Link>
            <Link to="/admin/profile-sections" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><LayoutGrid size={18} /></div>
              <span>{t('profileSections')}</span>
            </Link>
            <Link to="/admin/users" className="nb-drawer-item" onClick={closeDrawer}>
              <div className="nb-drawer-item-icon"><UserCheck size={18} /></div>
              <span>{t('users') || 'المستخدمين'}</span>
            </Link>
            <div className="nb-drawer-divider"></div>
          </>
        )}
        <div className="nb-drawer-divider"></div>
        <button className="nb-drawer-item nb-drawer-item--danger" onClick={handleLogoutClick}>
          <div className="nb-drawer-item-icon"><LogOut size={18} /></div>
          <span>{t('logout')}</span>
        </button>
      </div>

      <div className="nb-drawer-footer">
        <div className="nb-drawer-lang-row">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`nb-drawer-lang-btn ${language === lang.code ? 'nb-drawer-lang-btn--active' : ''}`}
              onClick={() => setLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className={`nb-drawer-overlay ${menuOpen ? 'nb-drawer-overlay--visible' : ''}`} onClick={closeDrawer} />

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div
          style={{ background: 'var(--card-bg)', borderRadius: 16, padding: '32px 28px', maxWidth: 380, width: '90%', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <LogOut size={26} style={{ color: 'var(--danger, #ef4444)' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {t('logout')}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {t('logoutConfirmMsg') || 'هل أنت متأكد من تسجيل الخروج؟'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleLogoutConfirm}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--danger, #ef4444)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
