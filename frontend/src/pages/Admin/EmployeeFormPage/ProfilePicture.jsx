import { useState } from 'react';
import { Upload, X, Link, Camera } from 'lucide-react';

export default function ProfilePicture({ imagePreview, handleImageChange, handleImageUrl, removeImage, t }) {
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      handleImageUrl(urlValue.trim());
      setUrlMode(false);
    }
  };

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <Camera size={18} />
        {t('profilePicture')}
      </h3>
      <div className="image-upload-section">
        {imagePreview ? (
          <div className="image-preview-wrapper">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="image-remove-btn"
              onClick={() => { removeImage(); setUrlValue(''); }}
            >
              <X size={16} />
            </button>
          </div>
        ) : urlMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" onClick={handleUrlSubmit} style={{ flex: 1 }}>
                {t('save')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setUrlMode(false)} style={{ flex: 1 }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <label className="image-upload-area" style={{ flex: 1 }}>
              <Upload size={32} className="upload-icon" />
              <span className="upload-text">{t('upload')}</span>
              <span className="upload-hint">PNG, JPG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />
            </label>
            <button
              type="button"
              className="image-upload-area"
              style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onClick={() => setUrlMode(true)}
            >
              <Link size={32} className="upload-icon" />
              <span className="upload-text">{t('fromUrl') || 'From URL'}</span>
              <span className="upload-hint">https://...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
