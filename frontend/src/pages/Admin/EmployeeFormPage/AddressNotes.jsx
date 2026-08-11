import FormField from './FormField';

export default function AddressNotes({ form, handleChange, t }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">{t('notes')}</h3>
      <div className="form-grid">
        <FormField label={t('notes')}>
          <textarea
            name="notes"
            className="form-input form-textarea"
            placeholder={t('notes')}
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />
        </FormField>
      </div>
    </div>
  );
}
