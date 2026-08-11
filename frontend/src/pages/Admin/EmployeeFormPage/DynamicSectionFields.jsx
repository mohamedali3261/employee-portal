import FormField from './FormField';
import { useLanguage } from '../../../contexts/LanguageContext';

function StatusToggle({ value, onChange, t }) {
  const options = [
    { value: 'active', label: t('active'), className: 'form-toggle-active' },
    { value: 'inactive', label: t('inactive'), className: 'form-toggle-inactive' },
    { value: 'resigned', label: t('resigned'), className: 'form-toggle-resigned' },
  ];
  return (
    <div className="form-toggle-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`form-toggle ${value === opt.value ? opt.className : ''}`}
          onClick={() => onChange({ target: { name: 'status', value: opt.value } })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FieldInput({ field, form, errors, handleChange, handleCustomFieldChange, sections, isEdit, t, language }) {
  const isBuiltin = Number(field.is_builtin) === 1;
  const key = field.field_key;
  const value = isBuiltin ? form[key] : (form.customFields?.[key] || '');

  if (isBuiltin && key === 'status') {
    return <StatusToggle value={value || 'active'} onChange={handleChange} t={t} />;
  }

  if (isBuiltin && key === 'department') {
    return (
      <select
        name="department"
        className="form-input form-select"
        value={value}
        onChange={handleChange}
      >
        <option value="">{t('department')}</option>
        {sections.map((s) => (
          <option key={s.id} value={s.name_en}>{s.name_en}</option>
        ))}
      </select>
    );
  }

  if (isBuiltin && key === 'employeeId') {
    return (
      <input
        type="text"
        name="employeeId"
        className="form-input"
        placeholder="1001"
        value={value}
        onChange={handleChange}
        maxLength={4}
        disabled={isEdit}
      />
    );
  }

  if (isBuiltin && key === 'age') {
    return (
      <input
        type="number"
        name="age"
        className="form-input"
        value={value || ''}
        onChange={handleChange}
        min="18"
        max="100"
      />
    );
  }

  const label = (lang) => lang === 'ar' && field.name_ar ? field.name_ar : field.name_en;

  if (field.type === 'textarea') {
    return (
      <textarea
        name={isBuiltin ? key : undefined}
        className="form-input form-textarea"
        rows={3}
        value={value}
        onChange={(e) => isBuiltin ? handleChange(e) : handleCustomFieldChange(key, e.target.value)}
        placeholder={label(language)}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    );
  }

  if (field.type === 'dropdown') {
    const options = (field.options || '').split(',').map((s) => s.trim()).filter(Boolean);
    return (
      <select
        name={isBuiltin ? key : undefined}
        className="form-input form-select"
        value={value}
        onChange={(e) => isBuiltin ? handleChange(e) : handleCustomFieldChange(key, e.target.value)}
      >
        <option value="">{t('select')}...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      name={isBuiltin ? key : undefined}
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      className="form-input"
      value={value}
      onChange={(e) => isBuiltin ? handleChange(e) : handleCustomFieldChange(key, e.target.value)}
      placeholder={label(language)}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    />
  );
}

export default function DynamicSectionFields({ title, icon: Icon, fields, form, errors, handleChange, handleCustomFieldChange, sections, isEdit, t }) {
  if (!fields || fields.length === 0) return null;

  const { language } = useLanguage();

  const labelFor = (field) => {
    if (language === 'ar' && field.name_ar) return field.name_ar;
    return field.name_en;
  };

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        {Icon && <Icon size={18} />}
        {title}
      </h3>
      <div className="form-grid">
        {fields.map((field) => (
          <FormField
            key={field.id}
            label={labelFor(field)}
            required={Number(field.required) === 1}
            error={field.field_key === 'employeeId' || field.field_key === 'arabicName' || field.field_key === 'englishName' ? errors[field.field_key] : null}
          >
            <FieldInput
              field={field}
              form={form}
              errors={errors}
              handleChange={handleChange}
              handleCustomFieldChange={handleCustomFieldChange}
              sections={sections}
              isEdit={isEdit}
              t={t}
              language={language}
            />
          </FormField>
        ))}
      </div>
    </div>
  );
}
