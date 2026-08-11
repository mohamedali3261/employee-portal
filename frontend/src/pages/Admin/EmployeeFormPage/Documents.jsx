import { X, ExternalLink } from 'lucide-react';

export default function Documents({ form, handleAddDocument, handleRemoveDocument, handleDocumentChange, handleDocumentFileChange, t }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">{t('documents')}</h3>
      <p className="form-hint">{t('supportedFormats')}</p>
      <div className="documents-section">
        {form.documents.map((doc, index) => {
          const fileUrl = doc.file instanceof File ? URL.createObjectURL(doc.file) : doc.file || doc.fileUrl || null;
          return (
            <div key={index} className="document-row">
              <div className="document-fields">
                <div className="form-group">
                  <label className="form-label">{t('documentName')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doc.name}
                    onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                    placeholder={t('documentName')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('uploadDocument')}</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => handleDocumentFileChange(index, e.target.files[0])}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp"
                  />
                </div>
                <div className="document-actions">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <ExternalLink size={16} />
                      {t('viewDocument')}
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleRemoveDocument(index)}
                  >
                    <X size={16} />
                    {t('removeDocument')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleAddDocument}
        >
          {t('addDocument')}
        </button>
      </div>
    </div>
  );
}
