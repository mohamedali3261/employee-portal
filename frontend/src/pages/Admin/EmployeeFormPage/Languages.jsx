import { X } from 'lucide-react';
import { availableLanguages, proficiencyLevels } from './constants';

export default function Languages({ form, handleAddLanguage, handleRemoveLanguage, handleLanguageChange, t }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">{t('languages')}</h3>
      <div className="languages-section">
        {form.languages.map((lang, index) => (
          <div key={index} className="language-row">
            <div className="language-fields">
              <div className="form-group">
                <label className="form-label">{t('selectLanguage')}</label>
                <select
                  className="form-input form-select"
                  value={lang.language}
                  onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                >
                  <option value="">{t('selectLanguage')}</option>
                  {availableLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nameEn})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('proficiencyLevel')}</label>
                <select
                  className="form-input form-select"
                  value={lang.proficiency}
                  onChange={(e) => handleLanguageChange(index, 'proficiency', e.target.value)}
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {t(level.label)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleRemoveLanguage(index)}
              >
                <X size={16} />
                {t('removeLanguage')}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleAddLanguage}
        >
          {t('addLanguage')}
        </button>
      </div>
    </div>
  );
}
