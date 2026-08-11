import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FolderOpen, UserCheck, FileInput, LayoutGrid, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Sidebar({ isOpen, onToggle, collapsed }) {
  const { t } = useLanguage()

  const links = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/admin/employees', icon: Users, label: t('employees') },
    { to: '/admin/sections', icon: FolderOpen, label: t('sections') },
    { to: '/admin/section-fields', icon: ListChecks, label: t('sectionFields') },
    { to: '/admin/custom-fields', icon: FileInput, label: t('customFields') },
    { to: '/admin/profile-sections', icon: LayoutGrid, label: t('profileSections') },
    { to: '/admin/users', icon: UserCheck, label: t('users') || 'المستخدمين' },
  ]

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              end={to === '/admin/dashboard'}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
