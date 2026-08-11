import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import LoadingScreen from '../../components/common/LoadingScreen'
import ProfileDesign2 from '../../components/employee/ProfileDesign2'
import { useLanguage } from '../../contexts/LanguageContext'
import { getEmployee, getCustomFieldDefinitions, getProfileSectionDefinitions, getSectionFieldDefinitions } from '../../services/api'
import usePageTitle from '../../hooks/usePageTitle'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  usePageTitle(t('profile'))
  const [employee, setEmployee] = useState(null)
  const [customFieldsMeta, setCustomFieldsMeta] = useState([])
  const [profileSections, setProfileSections] = useState([])
  const [sectionFieldDefs, setSectionFieldDefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      setError(null)
      const startedAt = Date.now()
      try {
        const data = await getEmployee(id)
        setEmployee(data.employee)
        try {
          const [defs, secs, fields] = await Promise.all([
            getCustomFieldDefinitions(),
            getProfileSectionDefinitions(),
            getSectionFieldDefinitions(),
          ])
          setCustomFieldsMeta(defs.data || [])
          setProfileSections(secs.data || [])
          setSectionFieldDefs(fields.data || [])
        } catch {
          setCustomFieldsMeta([])
          setProfileSections([])
          setSectionFieldDefs([])
        }
      } catch (err) {
        setError(err.message || t('employeeNotFound'))
      } finally {
        const elapsed = Date.now() - startedAt
        const remaining = Math.max(0, 5000 - elapsed)
        setTimeout(() => setLoading(false), remaining)
      }
    }
    if (id) fetchEmployee()
  }, [id, t])

  const handlePrint = useCallback(() => { window.print() }, [])

  const handleDownloadPdf = useCallback(async () => {
    if (!employee) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const el = document.querySelector('.profile-design-root')
      if (!el) return
      toast.loading(t('loading'), { id: 'pdf' })
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`employee-${employee.employeeId || id}.pdf`)
      toast.success(t('pdfGenerated'), { id: 'pdf' })
    } catch { toast.error(t('pdfFailed'), { id: 'pdf' }) }
  }, [employee, id, t])

  return (
    <div className="profile-page">
      <Navbar variant="employee" />
      <main className="profile-page-main">
        <div className="profile-page-container">
          <div className="profile-page-topbar">
            <button className="profile-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
              <span>{t('back')}</span>
            </button>
          </div>

          {loading && <LoadingScreen />}

          {error && !loading && (
            <div className="profile-page-error">
              <h2>{t('error')}</h2>
              <p>{error}</p>
              <button className="profile-retry-btn" onClick={() => navigate('/')}>{t('back')}</button>
            </div>
          )}

          {!loading && !error && employee && (
            <div className="profile-design-root">
              <ProfileDesign2
                employee={employee}
                onPrint={handlePrint}
                onDownloadPdf={handleDownloadPdf}
                customFieldsMeta={customFieldsMeta}
                profileSections={profileSections}
                sectionFieldDefs={sectionFieldDefs}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
