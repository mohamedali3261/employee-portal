import { useState } from 'react'
import { User, Copy, Check, Phone, Building2, Printer, Download, GraduationCap, Languages, Clock, File, Hash, Shield, Mail, MapPin, ClipboardList, Calendar, CreditCard, StickyNote } from 'lucide-react'
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

function Section({ title, children }) {
  return (
    <div className="d2-section">
      <h3 className="d2-section-title">{title}</h3>
      <div className="d2-section-body">{children}</div>
    </div>
  )
}

export default function Design2({ employee, onPrint, onDownloadPdf, customFieldsMeta = [], profileSections = [], sectionFieldDefs = [] }) {
  const { t, language } = useLanguage()
  const [copied, setCopied] = useState(false)
  if (!employee) return null

  const { employeeId, arabicName, englishName, jobTitleAr, jobTitleEn, department, email, sector, hireDate, address, phone, status, notes, profileImage, insuranceNumber, education, employmentStart, languages, documents, customFields = {}, age } = employee
  const displayName = arabicName || englishName

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
    { id: 'personal', section_key: 'personal', name_en: t('personalInfo'), name_ar: t('personalInfo'), column_no: 1, sort_order: 10 },
    { id: 'contact', section_key: 'contact', name_en: t('contactInfo'), name_ar: t('contactInfo'), column_no: 2, sort_order: 20 },
    { id: 'employment', section_key: 'employment', name_en: t('employmentInfo'), name_ar: t('employmentInfo'), column_no: 2, sort_order: 30 },
    { id: 'languages', section_key: 'languages', name_en: t('languages'), name_ar: t('languages'), column_no: 1, sort_order: 40 },
    { id: 'documents', section_key: 'documents', name_en: t('documents'), name_ar: t('documents'), column_no: 2, sort_order: 50 },
    { id: 'notes', section_key: 'notes', name_en: t('notes'), name_ar: t('notes'), column_no: 2, sort_order: 60 },
    { id: 'custom', section_key: 'custom', name_en: t('customFields'), name_ar: t('customFields'), column_no: 2, sort_order: 70 },
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

  const defaultPersonal = (
    <>
      <Row icon={Hash} label={t('employeeId')} value={employeeId} />
      <Row icon={User} label={t('age')} value={age} />
      <Row icon={GraduationCap} label={t('education')} value={education} />
    </>
  )
  const defaultContact = (
    <>
      <RowLink icon={Phone} label={t('phone')} value={phone} type="tel" />
      <RowLink icon={Mail} label={t('email')} value={email} type="mail" />
      <Row icon={MapPin} label={t('address')} value={address} />
    </>
  )
  const defaultEmployment = (
    <>
      <Row icon={Building2} label={t('department')} value={department} />
      <Row icon={Shield} label={t('status')} value={status ? t(status) : null} />
      <Row icon={Building2} label={t('sector')} value={sector} />
      <Row icon={Calendar} label={t('hireDate')} value={hireDate ? new Date(hireDate).toLocaleDateString() : null} />
      <Row icon={Calendar} label={t('employmentStartDate')} value={employmentStart ? new Date(employmentStart).toLocaleDateString() : null} />
      <Row icon={Shield} label={t('insuranceNumber')} value={insuranceNumber} />
      {experience && (
        <div className="d2-experience">
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
      )}
    </>
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
      case 'personal':
        return renderBuiltinRows('personal', defaultPersonal)
      case 'contact':
        return renderBuiltinRows('contact', defaultContact)
      case 'employment':
        return renderBuiltinRows('employment', defaultEmployment)
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
    .map((section) => ({ section, content: sectionContent(section) }))
    .filter(({ content }) => content !== null && content !== undefined)

  const leftSections = renderedSections.filter(({ section }) => Number(section.column_no) === 1)
  const rightSections = renderedSections.filter(({ section }) => Number(section.column_no) !== 1)

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(String(employeeId)) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="d2">
      <div className="d2-header">
        <div className="d2-header-line"></div>
        <div className="d2-header-top">
          <button className="d2-copy-btn" onClick={handleCopy} title={t('copyId')}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{employeeId}</span>
          </button>
          <span className={`d2-status ${status === 'active' ? 'd2-status--active' : status === 'inactive' ? 'd2-status--inactive' : 'd2-status--resigned'}`}>
            {status === 'active' ? t('active') : status === 'inactive' ? t('inactive') : t('resigned')}
          </span>
        </div>
        <div className="d2-header-main">
          <ProfileImage photo={profileImage} name={displayName} />
          <div className="d2-header-info">
            <h1 className="d2-name">{displayName}</h1>
            {arabicName && englishName && englishName !== arabicName && <p className="d2-name-alt">{englishName}</p>}
            <div className="d2-meta">
              {department && <span className="d2-meta-item"><Building2 size={14} /> {department}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="d2-body">
        <div className="d2-cols">
          <div className="d2-col">
            {leftSections.map(({ section, content }) => (
              <Section key={section.section_key || section.id} title={sectionTitle(section)}>{content}</Section>
            ))}
          </div>
          <div className="d2-col">
            {rightSections.map(({ section, content }) => (
              <Section key={section.section_key || section.id} title={sectionTitle(section)}>{content}</Section>
            ))}
          </div>
        </div>
      </div>

      <div className="d2-footer">
        <button className="d2-btn d2-btn--print" onClick={onPrint}><Printer size={16} /><span>{t('printProfile')}</span></button>
        <button className="d2-btn d2-btn--pdf" onClick={onDownloadPdf}><Download size={16} /><span>{t('downloadPdf')}</span></button>
      </div>
    </div>
  )
}
