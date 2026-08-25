import { useState } from 'react';
import FormField from './FormField';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Plus, Pencil, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

function FieldInput({ field, form, errors, handleChange, handleCustomFieldChange, sections, isEdit, t, language, employees, navigate, onAddEmployee }) {
  const isBuiltin = Number(field.is_builtin) === 1;
  const key = field.field_key;
  const value = isBuiltin ? (form[key] ?? '') : (form.customFields?.[key] ?? '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');

  const label = (lang) => lang === 'ar' && field.name_ar ? field.name_ar : field.name_en;

  if (isBuiltin && key === 'status') {
    return <StatusToggle value={value || 'active'} onChange={handleChange} t={t} />;
  }

  if (isBuiltin && key === 'directManager') {
    const handleAddManager = () => {
      if (!newManagerName.trim()) return;
      const name = newManagerName.trim();
      const newEmp = { employee_id: name, name_en: name, name_ar: name };
      if (onAddEmployee) onAddEmployee(newEmp);
      handleChange({ target: { name: 'directManager', value: name } });
      setNewManagerName('');
      setShowAddModal(false);
    };

    return (
      <>
        <div className="direct-manager-field">
          <select
            name="directManager"
            className="form-input form-select"
            value={value}
            onChange={handleChange}
          >
            <option value="">{t('select')}...</option>
            {(employees || []).map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {language === 'ar' ? emp.name_ar : emp.name_en}
              </option>
            ))}
          </select>
          <div className="direct-manager-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddModal(true)} title={t('addManager')}>
              <Plus size={14} />
            </button>
            {value && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                const emp = (employees || []).find(e => String(e.employee_id) === String(value));
                if (emp) {
                  setNewManagerName(language === 'ar' ? emp.name_ar : emp.name_en);
                  setShowAddModal(true);
                }
              }} title={t('editEmployee')}>
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{value ? t('editEmployee') : t('addManager')}</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-input"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder={t('directManager')}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManager(); } }}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>{t('cancel')}</button>
                <button type="button" className="btn btn-primary" onClick={handleAddManager}>{t('save')}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
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

  if (isBuiltin && key === 'birthdate' || key === 'hireDate' || key === 'employmentStart') {
    const fieldName = key === 'birthdate' ? 'birthdate' : key === 'hireDate' ? 'hireDate' : 'employmentStart';

    const calculateAge = (birthdate) => {
      if (!birthdate) return null;
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const age = key === 'birthdate' ? calculateAge(value) : null;

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={(date) => handleChange({ target: { name: fieldName, value: date ? date.toISOString().split('T')[0] : '' } })}
          dateFormat="yyyy-MM-dd"
          className="form-input"
          placeholderText={label(language)}
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={100}
          popperPlacement="top-start"
        />
        {age !== null && (
          <span style={{ fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap' }}>
            ({age} {language === 'ar' ? 'سنة' : 'years'})
          </span>
        )}
      </div>
    );
  }

  if (isBuiltin && key === 'age') {
    return null;
  }

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
          <option key={opt} value={opt}>{t(opt) || opt}</option>
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

export default function DynamicSectionFields({ title, icon: Icon, fields, form, errors, handleChange, handleCustomFieldChange, sections, isEdit, t, employees, onAddEmployee }) {
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
              employees={employees}
              onAddEmployee={onAddEmployee}
            />
          </FormField>
        ))}
      </div>
    </div>
  );
}
