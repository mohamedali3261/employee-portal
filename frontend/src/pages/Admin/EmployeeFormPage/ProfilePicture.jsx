import { Upload, X } from 'lucide-react';

export default function ProfilePicture({ imagePreview, handleImageChange, removeImage, t }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">{t('profilePicture')}</h3>
      <div className="image-upload-section">
        {imagePreview ? (
          <div className="image-preview-wrapper">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="image-remove-btn"
              onClick={removeImage}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="image-upload-area">
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
        )}
      </div>
    </div>
  );
}
