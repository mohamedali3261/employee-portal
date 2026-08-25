import { X, Plus } from 'lucide-react';

export default function Certifications({ certifications, onChange, t }) {
  const handleAdd = () => {
    onChange([...certifications, '']);
  };

  const handleRemove = (index) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  const handleChange = (index, value) => {
    const updated = [...certifications];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="form-card">
      <h3 className="form-card-title">{t('certifications')}</h3>
      <div className="certifications-list">
        {certifications.map((cert, index) => (
          <div key={index} className="certification-row">
            <input
              type="text"
              className="form-input"
              value={cert}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={t('certificationName')}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleRemove(index)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleAdd}
        >
          <Plus size={16} />
          {t('addCertification')}
        </button>
      </div>
    </div>
  );
}
