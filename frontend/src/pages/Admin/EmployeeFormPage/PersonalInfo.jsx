import { User } from 'lucide-react';
import FormField from './FormField';

export default function PersonalInfo({ form, errors, sections, handleChange, isEdit, t, setForm }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <User size={18} />
        {t('personalInfo')}
      </h3>

      <div className="form-grid">
        <FormField
          label={t('employeeId')}
          required
          error={errors.employeeId}
        >
          <input
            type="text"
            name="employeeId"
            className="form-input"
            placeholder="1001"
            value={form.employeeId}
            onChange={handleChange}
            maxLength={4}
            disabled={isEdit}
          />
        </FormField>

        <FormField
          label={t('arabicName') || 'Arabic Name'}
          required
          error={errors.arabicName}
        >
          <input
            type="text"
            name="arabicName"
            className="form-input"
            placeholder={t('arabicName') || 'Arabic Name'}
            value={form.arabicName}
            onChange={handleChange}
            dir="rtl"
          />
        </FormField>

        <FormField
          label={t('englishName') || 'English Name'}
          required
          error={errors.englishName}
        >
          <input
            type="text"
            name="englishName"
            className="form-input"
            placeholder={t('englishName') || 'English Name'}
            value={form.englishName}
            onChange={handleChange}
          />
        </FormField>

        <FormField label={t('jobTitleAr')}>
          <input
            type="text"
            name="jobTitleAr"
            className="form-input"
            placeholder={t('jobTitleAr')}
            value={form.jobTitleAr}
            onChange={handleChange}
            dir="rtl"
          />
        </FormField>

        <FormField label={t('jobTitleEn')}>
          <input
            type="text"
            name="jobTitleEn"
            className="form-input"
            placeholder={t('jobTitleEn')}
            value={form.jobTitleEn}
            onChange={handleChange}
          />
        </FormField>

        <FormField label={t('department')}>
          <select
            name="department"
            className="form-input form-select"
            value={form.department}
            onChange={handleChange}
          >
            <option value="">{t('department')}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.name_en}>{s.name_en}</option>
            ))}
          </select>
        </FormField>

        <FormField label={t('phone')}>
          <input
            type="tel"
            name="phone"
            className="form-input"
            placeholder={t('phone')}
            value={form.phone}
            onChange={handleChange}
          />
        </FormField>

        <FormField label={t('age') || 'العمر'}>
          <input
            type="number"
            name="age"
            className="form-input"
            placeholder={t('age') || 'العمر'}
            value={form.age || ''}
            onChange={handleChange}
            min="18"
            max="100"
          />
        </FormField>

        <FormField label={t('employmentStatus')}>
          <div className="form-toggle-group">
            <button
              type="button"
              className={`form-toggle ${form.status === 'active' ? 'form-toggle-active' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, status: 'active' }))}
            >
              {t('active')}
            </button>
            <button
              type="button"
              className={`form-toggle ${form.status === 'inactive' ? 'form-toggle-inactive' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, status: 'inactive' }))}
            >
              {t('inactive')}
            </button>
            <button
              type="button"
              className={`form-toggle ${form.status === 'resigned' ? 'form-toggle-resigned' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, status: 'resigned' }))}
            >
              {t('resigned')}
            </button>
          </div>
        </FormField>
      </div>
    </div>
  );
}
