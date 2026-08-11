import { ClipboardList } from 'lucide-react';
import FormField from './FormField';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function CustomFields({ form, customFieldDefs, profileSections, handleCustomFieldChange }) {
  const { t, language } = useLanguage();

  if (!customFieldDefs || customFieldDefs.length === 0) return null;

  const labelFor = (field) => (language === 'ar' && field.name_ar) ? field.name_ar : field.name_en;

  const sections = Array.isArray(profileSections) ? profileSections : [];
  const customSection = sections.find((s) => s.section_key === 'custom');

  const groups = sections
    .map((section) => {
      let defs;
      if (section.section_key === 'custom') {
        defs = customFieldDefs.filter(
          (f) => !f.section_id || Number(f.section_id) === Number(customSection?.id)
        );
      } else {
        defs = customFieldDefs.filter((f) => Number(f.section_id) === Number(section.id));
      }
      return { section, defs };
    })
    .filter((g) => g.defs.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <ClipboardList size={18} />
        {t('customFields')}
      </h3>

      {groups.map(({ section, defs }) => (
        <div key={section.id} style={{ marginBottom: groups.length > 1 ? 24 : 0 }}>
          {groups.length > 1 && (
            <h4 className="form-card-subtitle">
              {language === 'ar' && section.name_ar ? section.name_ar : section.name_en}
            </h4>
          )}
          <div className="form-grid">
            {defs.map((field) => {
              const value = form.customFields?.[field.field_key] || '';

              if (field.type === 'textarea') {
                return (
                  <FormField key={field.id} label={labelFor(field)}>
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      value={value}
                      onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      placeholder={labelFor(field)}
                    />
                  </FormField>
                );
              }

              if (field.type === 'dropdown') {
                const options = (field.options || '').split(',').map(s => s.trim()).filter(Boolean);
                return (
                  <FormField key={field.id} label={labelFor(field)}>
                    <select
                      className="form-input form-select"
                      value={value}
                      onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                    >
                      <option value="">{t('select')}...</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </FormField>
                );
              }

              return (
                <FormField key={field.id} label={labelFor(field)}>
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    className="form-input"
                    value={value}
                    onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                    placeholder={labelFor(field)}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </FormField>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
