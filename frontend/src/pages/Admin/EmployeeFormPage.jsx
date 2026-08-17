import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, ArrowLeft, User, Briefcase, Mail, StickyNote } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import { useEmployeeForm } from './EmployeeFormPage/useEmployeeForm';
import usePageTitle from '../../hooks/usePageTitle';
import DynamicSectionFields from './EmployeeFormPage/DynamicSectionFields';
import Languages from './EmployeeFormPage/Languages';
import Documents from './EmployeeFormPage/Documents';
import ProfilePicture from './EmployeeFormPage/ProfilePicture';
import CustomFields from './EmployeeFormPage/CustomFields';

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    form,
    errors,
    loading,
    fetching,
    imagePreview,
    sections,
    customFieldDefs,
    profileSections,
    sectionFields,
    isEdit,
    handleChange,
    handleCustomFieldChange,
    handleImageChange,
    handleImageUrl,
    removeImage,
    handleAddLanguage,
    handleRemoveLanguage,
    handleLanguageChange,
    handleAddDocument,
    handleRemoveDocument,
    handleDocumentChange,
    handleDocumentFileChange,
    calculateExperience,
    handleSubmit,
    setForm
  } = useEmployeeForm();

  usePageTitle(isEdit ? t('editEmployee') : t('addEmployee'));

  const sectionKeyById = Object.fromEntries(
    profileSections.map((s) => [Number(s.id), s.section_key])
  );
  const fieldsFor = (sectionKey) =>
    sectionFields.filter(
      (f) => sectionKeyById[Number(f.section_id)] === sectionKey && Number(f.is_visible) === 1
    );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  if (fetching) {
    return (
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Navbar variant="admin" onLogout={handleLogout} />
          <div className="admin-content">
            <div className="form-loading">
              <Loader2 size={32} className="spin" />
              <p>{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Navbar variant="admin" onLogout={handleLogout} />
        <div className="admin-content">
          <div className="page-header">
            <div className="page-header-left">
              <button className="btn btn-ghost" onClick={() => navigate('/admin/employees')}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="page-title">
                  {isEdit ? t('editEmployee') : t('addEmployee')}
                </h1>
                <p className="page-subtitle">
                  {isEdit ? t('editEmployee') : t('addEmployee')}
                </p>
              </div>
            </div>
          </div>

          <form className="employee-form" onSubmit={(e) => handleSubmit(e, t)}>
            <div className="form-layout-sidebar">
              <div className="form-sidebar-left">
                <ProfilePicture
                  imagePreview={imagePreview}
                  handleImageChange={handleImageChange}
                  handleImageUrl={handleImageUrl}
                  removeImage={removeImage}
                  t={t}
                />
              </div>

              <div className="form-sidebar-right">
                <div className="form-row-2col">
                  <DynamicSectionFields
                    title={t('contactInfo')}
                    icon={Mail}
                    fields={fieldsFor('contact')}
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    sections={sections}
                    isEdit={isEdit}
                    t={t}
                  />

                  <DynamicSectionFields
                    title={t('employmentInfo')}
                    icon={Briefcase}
                    fields={fieldsFor('employment')}
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    sections={sections}
                    isEdit={isEdit}
                    t={t}
                  />
                </div>

                <div className="form-row-2col">
                  <DynamicSectionFields
                    title={t('notes')}
                    icon={StickyNote}
                    fields={fieldsFor('notes')}
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                    handleCustomFieldChange={handleCustomFieldChange}
                    sections={sections}
                    isEdit={isEdit}
                    t={t}
                  />

                  <Languages
                    form={form}
                    handleAddLanguage={handleAddLanguage}
                    handleRemoveLanguage={handleRemoveLanguage}
                    handleLanguageChange={handleLanguageChange}
                    t={t}
                  />
                </div>

                <div className="form-row-2col">
                  <Documents
                    form={form}
                    handleAddDocument={handleAddDocument}
                    handleRemoveDocument={handleRemoveDocument}
                    handleDocumentChange={handleDocumentChange}
                    handleDocumentFileChange={handleDocumentFileChange}
                    t={t}
                  />

                  <CustomFields
                    form={form}
                    customFieldDefs={customFieldDefs}
                    profileSections={profileSections}
                    handleCustomFieldChange={handleCustomFieldChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={() => navigate('/admin/employees')}
                disabled={loading}
              >
                <X size={16} />
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEdit ? t('save') : t('add')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
