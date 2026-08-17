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
    <div className="form-card profile-sidebar-card">
      <h3 className="form-card-title">
        <Camera size={18} />
        {t('profilePicture')}
      </h3>

      <div className="profile-sidebar-content">
        {imagePreview ? (
          <div className="profile-preview-circle">
            <img src={imagePreview} alt="Preview" />
            <button
              type="button"
              className="profile-remove-btn"
              onClick={() => { removeImage(); setUrlValue(''); }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="profile-placeholder">
            <Camera size={40} />
          </div>
        )}

        {urlMode ? (
          <div className="profile-sidebar-actions">
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleUrlSubmit} style={{ flex: 1 }}>
                {t('save')}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setUrlMode(false)} style={{ flex: 1 }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-sidebar-actions">
            <label className="profile-upload-btn">
              <Upload size={16} />
              <span>{t('upload')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />
            </label>
            <button
              type="button"
              className="profile-url-btn"
              onClick={() => setUrlMode(true)}
            >
              <Link size={16} />
              <span>{t('fromUrl') || 'From URL'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
