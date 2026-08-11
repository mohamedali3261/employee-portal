import { Briefcase } from 'lucide-react';
import FormField from './FormField';

export default function AdditionalInfo({ form, handleChange, calculateExperience, t }) {
  const experience = calculateExperience(form.employmentStart);

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <Briefcase size={18} />
        {t('employmentInfo')}
      </h3>

      <div className="form-grid">
        <FormField label={t('education') || 'Education'}>
          <input
            type="text"
            name="education"
            className="form-input"
            placeholder={t('education') || 'Education'}
            value={form.education}
            onChange={handleChange}
          />
        </FormField>

        <FormField label={t('employmentStartDate')}>
          <input
            type="date"
            name="employmentStart"
            className="form-input"
            value={form.employmentStart}
            onChange={handleChange}
          />
        </FormField>

        {experience && (
          <div className="form-group">
            <label className="form-label">{t('experience')}</label>
            <div className="experience-display">
              <span className="experience-value">{experience.years}</span>
              <span className="experience-unit">{t('years')}</span>
              {experience.months > 0 && (
                <>
                  <span className="experience-value">{experience.months}</span>
                  <span className="experience-unit">{t('months')}</span>
                </>
              )}
              {experience.days > 0 && (
                <>
                  <span className="experience-value">{experience.days}</span>
                  <span className="experience-unit">{t('days')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
