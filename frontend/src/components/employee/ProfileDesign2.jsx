import { useState } from 'react'
import { User, Copy, Check, Phone, Building2, Printer, Download, GraduationCap, Languages, Clock, File, Hash, Shield, Mail, MapPin, ClipboardList, Calendar, CreditCard, StickyNote, Plus, X, Briefcase } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { availableLanguages } from '../../pages/Admin/EmployeeFormPage/constants'

function ProfileImage({ photo, name }) {
  const [imgError, setImgError] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  if (!photo || imgError) {
    const initials = (name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    return <div className="d2-avatar d2-avatar--fallback">{initials || <User size={40} />}</div>
  }
  return (
    <>
      <img src={photo} alt={name} className="d2-avatar d2-avatar--zoomable" onClick={() => setZoomed(true)} onError={() => setImgError(true)} />
      {zoomed && (
        <div className="img-modal-overlay" onClick={() => setZoomed(false)}>
          <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="img-modal-close" onClick={() => setZoomed(false)}>✕</button>
            <img src={photo} alt={name} className="img-modal-image" />
          </div>
        </div>
      )}
    </>
  )
}

function Row({ icon: Icon, label, value, accent }) {
  if (!value) return null
  return (
    <div className="d2-row">
      <div className="d2-row-icon" style={{ color: accent || 'var(--primary)' }}><Icon size={16} /></div>
      <div className="d2-row-content">
        <span className="d2-row-label">{label}</span>
        <span className="d2-row-value">{value}</span>
      </div>
    </div>
  )
}

function RowLink({ icon: Icon, label, value, type, accent }) {
  if (!value) return null
  return (
    <a href={`${type === 'mail' ? 'mailto' : 'tel'}:${value}`} className="d2-row d2-row--link" target="_blank" rel="noopener">
      <div className="d2-row-icon" style={{ color: accent || 'var(--primary)' }}><Icon size={16} /></div>
      <div className="d2-row-content">
        <span className="d2-row-label">{label}</span>
        <span className="d2-row-value d2-row-value--link">{value}</span>
      </div>
    </a>
  )
}

function Section({ title, children, centered, onToggle, sectionKey, isCollapsed }) {
  return (
    <div className="d2-section">
      <div className={`d2-section-header ${centered ? 'd2-section-header--center' : ''}`}>
        <h3 className={`d2-section-title ${centered ? 'd2-section-title--center' : ''}`}>{title}</h3>
        {onToggle && (
          <button className="d2-section-expand-btn" onClick={() => onToggle(sectionKey)}>
            {isCollapsed ? <Plus size={16} /> : <X size={16} />}
          </button>
        )}
      </div>
      <div className={`d2-section-body ${isCollapsed ? 'd2-section-body--collapsed' : ''}`}>{children}</div>
    </div>
  )
}

export default function Design2({ employee, onPrint, onDownloadPdf, customFieldsMeta = [], profileSections = [], sectionFieldDefs = [] }) {
  const { t, language } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [modalSection, setModalSection] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})
  if (!employee) return null

  const { employeeId, arabicName, englishName, jobTitleAr, jobTitleEn, department, email, sector, hireDate, address, phone, phone2, status, notes, profileImage, insuranceNumber, education, employmentStart, directManager, certifications, category, languages, documents, customFields = {}, birthdate } = employee
  const displayName = arabicName || englishName

  const calculateAge = (birthdate) => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge(birthdate)

  const customFieldDefs = Array.isArray(customFieldsMeta) ? customFieldsMeta : []
  const visibleCustomFields = customFieldDefs
    .map((field) => ({
      key: field.field_key,
      label: (language === 'ar' && field.name_ar) ? field.name_ar : field.name_en,
      value: customFields[field.field_key],
      sectionId: field.section_id,
    }))
    .filter((field) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')

  const fallbackSections = [
    { id: 'employment', section_key: 'employment', name_en: t('employmentInfo'), name_ar: t('employmentInfo'), column_no: 1, sort_order: 1 },
    { id: 'languages', section_key: 'languages', name_en: t('languages'), name_ar: t('languages'), column_no: 1, sort_order: 2 },
    { id: 'contact', section_key: 'contact', name_en: t('contactInfo'), name_ar: t('contactInfo'), column_no: 1, sort_order: 3 },
    { id: 'documents', section_key: 'documents', name_en: t('documents'), name_ar: t('documents'), column_no: 1, sort_order: 4 },
    { id: 'notes', section_key: 'notes', name_en: t('notes'), name_ar: t('notes'), column_no: 1, sort_order: 5 },
    { id: 'custom', section_key: 'custom', name_en: t('customFields'), name_ar: t('customFields'), column_no: 1, sort_order: 6 },
  ]
  const sections = Array.isArray(profileSections) && profileSections.length > 0 ? profileSections : fallbackSections
  const customSectionId = sections.find((s) => s.section_key === 'custom')?.id

  const sectionTitle = (section) => (language === 'ar' && section.name_ar) ? section.name_ar : (section.name_en || section.name_ar)

  const calculateExperience = (startDate) => {
    if (!startDate) return null
    const start = new Date(startDate)
    const now = new Date()
    const diffInMs = now - start
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffInDays / 365)
    const remainingDaysAfterYears = diffInDays % 365
    const months = Math.floor(remainingDaysAfterYears / 30)
    const days = remainingDaysAfterYears % 30
    return { years, months, days }
  }

  const experience = calculateExperience(employmentStart)

  const fieldIcon = (key) => {
    switch (key) {
      case 'employeeId': return Hash
      case 'department': return Building2
      case 'address': return MapPin
      case 'insuranceNumber': return Shield
      case 'sector': return Building2
      case 'hireDate': return Calendar
      case 'education': return GraduationCap
      case 'employmentStart': return Calendar
      case 'bank': return CreditCard
      case 'bankAccount': return CreditCard
      case 'notes': return StickyNote
      case 'directManager': return User
      case 'certifications': return ClipboardList
      case 'category': return Briefcase
      default: return ClipboardList
    }
  }

  const sectionKeyById = Object.fromEntries(sections.map((s) => [Number(s.id), s.section_key]))
  const fieldsBySectionKey = {}
  const allSectionFields = Array.isArray(sectionFieldDefs) ? sectionFieldDefs : []
  allSectionFields.forEach((f) => {
    const key = sectionKeyById[Number(f.section_id)]
    if (!key) return
    if (!fieldsBySectionKey[key]) fieldsBySectionKey[key] = []
    fieldsBySectionKey[key].push(f)
  })

  const renderBuiltinRows = (sectionKey, fallback) => {
    const fields = (fieldsBySectionKey[sectionKey] || [])
      .slice()
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    if (fields.length === 0) return fallback

    const rows = fields.map((field) => {
      const value = employee[field.field_key]
      if (value === undefined || value === null || String(value).trim() === '') return null
      const label = language === 'ar' && field.name_ar ? field.name_ar : field.name_en
      if (field.field_key === 'status') return null
      if (field.field_key === 'email') return <RowLink key={field.id} icon={Mail} label={label} value={value} type="mail" />
      if (field.field_key === 'phone') return <RowLink key={field.id} icon={Phone} label={label} value={value} type="tel" />
      if (field.field_key === 'notes') return <div key={field.id} className="d2-notes">{value}</div>
      if (field.field_key === 'certifications') {
        let certs = value
        if (typeof certs === 'string') {
          try { certs = JSON.parse(certs) } catch { certs = certs ? certs.split(',').map(s => s.trim()).filter(Boolean) : [] }
        }
        if (!Array.isArray(certs) || certs.length === 0) return null
        return (
          <div key={field.id} className="d2-certifications">
            <div className="d2-cert-title"><ClipboardList size={14} /> {label}</div>
            {certs.map((c, i) => (
              <div key={i} className="d2-cert-item">
                <Check size={12} /> {typeof c === 'string' ? c : c.name || c}
              </div>
            ))}
          </div>
        )
      }
      if (field.type === 'date') return <Row key={field.id} icon={fieldIcon(field.field_key)} label={label} value={value ? new Date(value).toLocaleDateString() : null} />
      return <Row key={field.id} icon={fieldIcon(field.field_key)} label={label} value={value} />
    }).filter(Boolean)

    if (sectionKey === 'employment' && experience) {
      rows.push(
        <div key="experience" className="d2-experience">
          <div className="d2-exp-label"><Clock size={14} /> {t('experience')}</div>
          <div className="d2-exp-boxes">
            <div className="d2-exp-box">
              <span className="d2-exp-num">{experience.years}</span>
              <span className="d2-exp-unit">{t('years')}</span>
            </div>
            {experience.months > 0 && (
              <div className="d2-exp-box">
                <span className="d2-exp-num">{experience.months}</span>
                <span className="d2-exp-unit">{t('months')}</span>
              </div>
            )}
            {experience.days > 0 && (
              <div className="d2-exp-box">
                <span className="d2-exp-num">{experience.days}</span>
                <span className="d2-exp-unit">{t('days')}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return rows.length > 0 ? rows : fallback
  }

  const defaultContact = (
    <>
      <RowLink icon={Phone} label={t('phone')} value={phone} type="tel" />
      <RowLink icon={Mail} label={t('email')} value={email} type="mail" />
      <Row icon={MapPin} label={t('address')} value={address} />
    </>
  )
  const defaultEmployment = (
    <div className="d2-employment-table">
      <div className="d2-employment-row">
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('employeeId')}</span>
          <span className="d2-employment-value">{employeeId}</span>
        </div>
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('arabicName')}</span>
          <span className="d2-employment-value">{arabicName}</span>
        </div>
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('englishName')}</span>
          <span className="d2-employment-value">{englishName}</span>
        </div>
      </div>
      <div className="d2-employment-row">
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('position')}</span>
          <span className="d2-employment-value">{language === 'ar' ? jobTitleAr : jobTitleEn}</span>
        </div>
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('department')}</span>
          <span className="d2-employment-value">{department}</span>
        </div>
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('sector')}</span>
          <span className="d2-employment-value">{sector}</span>
        </div>
      </div>
      <div className="d2-employment-row">
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('startDate')}</span>
          <span className="d2-employment-value">{employmentStart ? new Date(employmentStart).toLocaleDateString() : null}</span>
        </div>
        <div className="d2-employment-cell">
          <span className="d2-employment-label">{t('birthdate')}</span>
          <span className="d2-employment-value">
            {birthdate ? `${new Date(birthdate).toLocaleDateString()} ${age !== null ? `(${age})` : ''}` : ''}
          </span>
        </div>
        <div className="d2-employment-cell">
        </div>
      </div>
    </div>
  )
  const defaultNotes = () => {
    if (!notes) return null
    return <div className="d2-notes">{notes}</div>
  }

  const renderCustomField = (field) => (
    <Row key={field.key} icon={ClipboardList} label={field.label} value={field.value} />
  )

  const sectionContent = (section) => {
    switch (section.section_key) {
      case 'contact':
        return renderBuiltinRows('contact', defaultContact)
      case 'employment':
        return renderBuiltinRows('employment', defaultEmployment)
      case 'education':
        return null
      case 'languages': {
        if (!languages || languages.length === 0) return null
        return (
          <>
            {languages.map((lang, index) => {
              const langObj = availableLanguages.find(l => l.code === lang.language)
              const langName = langObj ? (language === 'ar' ? langObj.name : langObj.nameEn) : lang.language
              return (
                <Row key={index} icon={Languages} label={t('language')} value={`${langName} - ${t(lang.proficiency)}`} accent="#ea580c" />
              )
            })}
          </>
        )
      }
      case 'documents': {
        if (!documents || documents.length === 0) return null
        return (
          <>
            {documents.map((doc, index) => {
              const fileUrl = doc.fileUrl || doc.file
              return (
                <div key={index} className="d2-row">
                  <div className="d2-row-icon" style={{ color: '#ea580c' }}><File size={16} /></div>
                  <div className="d2-row-content" style={{ flex: 1 }}>
                    <span className="d2-row-label">{doc.name || t('documentName')}</span>
                    <span className="d2-row-value">{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : ''}</span>
                  </div>
                  {fileUrl && (
                    <a href={fileUrl} download={doc.name || 'document'} target="_blank" rel="noopener noreferrer" className="d2-row-icon" style={{ color: '#ea580c', cursor: 'pointer' }}>
                      <Download size={14} />
                    </a>
                  )}
                </div>
              )
            })}
          </>
        )
      }
      case 'notes': {
        return renderBuiltinRows('notes', defaultNotes())
      }
      case 'custom': {
        const fields = visibleCustomFields.filter(
          (f) => !f.sectionId || Number(f.sectionId) === Number(customSectionId)
        )
        if (fields.length === 0) return null
        return fields.map(renderCustomField)
      }
      default: {
        const fields = visibleCustomFields.filter((f) => Number(f.sectionId) === Number(section.id))
        if (fields.length === 0) return null
        return fields.map(renderCustomField)
      }
    }
  }

  const renderedSections = sections
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((section) => ({ section, content: sectionContent(section) }))
    .filter(({ content }) => content !== null && content !== undefined)

  const leftSections = renderedSections.filter(({ section }) => Number(section.column_no) === 1)
  const rightSections = renderedSections.filter(({ section }) => Number(section.column_no) !== 1)

  const isEmploymentSection = (sectionKey) => sectionKey === 'employment'

  const handleToggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const handleExpand = (sectionKey) => {
    setModalSection(sectionKey)
  }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(String(employeeId)) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="d2">
      <div className="d2-header">
        <div className="d2-header-line"></div>
        <div className="d2-header-top">
          <span className={`d2-status ${status === 'active' ? 'd2-status--active' : status === 'inactive' ? 'd2-status--inactive' : 'd2-status--resigned'}`}>
            {status === 'active' ? t('active') : status === 'inactive' ? t('inactive') : t('resigned')}
          </span>
        </div>
        <div className="d2-header-main">
          <ProfileImage photo={profileImage} name={displayName} />
        </div>
      </div>

      <div className="d2-body">
        <div className="d2-cols">
          <div className="d2-col">
            {leftSections.map(({ section, content }) => (
              <Section 
                key={section.section_key || section.id} 
                title={sectionTitle(section)} 
                centered={isEmploymentSection(section.section_key)}
                onToggle={handleToggleSection}
                sectionKey={section.section_key}
                isCollapsed={collapsedSections[section.section_key]}
              >{content}</Section>
            ))}
          </div>
          <div className="d2-col">
            {rightSections.map(({ section, content }) => (
              <Section 
                key={section.section_key || section.id} 
                title={sectionTitle(section)}
                onToggle={handleToggleSection}
                sectionKey={section.section_key}
                isCollapsed={collapsedSections[section.section_key]}
              >{content}</Section>
            ))}
          </div>
        </div>
      </div>

      <div className="d2-footer">
        <button className="d2-btn d2-btn--print" onClick={onPrint}><Printer size={16} /><span>{t('printProfile')}</span></button>
        <button className="d2-btn d2-btn--pdf" onClick={onDownloadPdf}><Download size={16} /><span>{t('downloadPdf')}</span></button>
      </div>

      {modalSection && (
        <div className="d2-modal-overlay" onClick={() => setModalSection(null)}>
          <div className="d2-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="d2-modal-header">
              <h3>{sectionTitle(sections.find(s => s.section_key === modalSection))}</h3>
              <button className="d2-modal-close" onClick={() => setModalSection(null)}><X size={20} /></button>
            </div>
            <div className="d2-modal-body">
              {modalSection === 'employment_details' && defaultEmploymentDetails}
              {modalSection === 'education' && defaultEducation}
              {modalSection === 'contact' && defaultContact}
              {modalSection === 'personal' && defaultPersonal}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
