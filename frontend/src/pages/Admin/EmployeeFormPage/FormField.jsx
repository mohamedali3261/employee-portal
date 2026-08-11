function FormField({ label, required, error, children }) {
  return (
    <div className={`form-group ${error ? 'form-group-error' : ''}`}>
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export default FormField;
