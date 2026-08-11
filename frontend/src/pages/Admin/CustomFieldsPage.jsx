import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertTriangle, FileInput, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCustomFields, createCustomField, updateCustomField, deleteCustomField, getProfileSections
} from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown'];

function typeLabel(t, type) {
  switch (type) {
    case 'number': return t('customFieldTypeNumber');
    case 'date': return t('customFieldTypeDate');
    case 'textarea': return t('customFieldTypeTextarea');
    case 'dropdown': return t('customFieldTypeSelect');
    default: return t('customFieldTypeText');
  }
}

function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon modal-icon-warning">
          <AlertTriangle size={32} />
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>{t('cancel')}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{t('delete')}</button>
        </div>
      </div>
    </div>
  );
}

function EditDialog({ field, sections, isOpen, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name_en: '', name_ar: '', type: 'text', options: '', section_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (field) {
      setForm({
        name_en: field.name_en || '',
        name_ar: field.name_ar || '',
        type: field.type || 'text',
        options: (field.options || '').split(',').map(s => s.trim()).filter(Boolean).join(', '),
        section_id: field.section_id || '',
      });
    }
  }, [field]);

  if (!isOpen || !field) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name_en.trim() || !form.name_ar.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        options: form.type === 'dropdown' ? form.options : '',
        section_id: form.section_id || null,
      });
      toast.success(t('success'));
      onClose();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{t('editCustomField')}</h3>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t('fieldNameEn')}</label>
              <input
                type="text"
                className="form-input"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                placeholder={t('fieldNameEnPlaceholder')}
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('fieldNameAr')}</label>
              <input
                type="text"
                className="form-input"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                placeholder={t('fieldNameArPlaceholder')}
                dir="rtl"
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('customFieldType')}</label>
              <select
                className="form-input form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={saving}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>{typeLabel(t, type)}</option>
                ))}
              </select>
            </div>
            {form.type === 'dropdown' && (
              <div className="form-group">
                <label className="form-label">{t('fieldOptions')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder={t('fieldOptionsPlaceholder')}
                  disabled={saving}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{t('customFieldSection')}</label>
              <select
                className="form-input form-select"
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                disabled={saving}
              >
                <option value="">{t('sectionCustom')}</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name_ar && form.name_ar ? `${section.name_ar} (${section.name_en})` : section.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-medium"></div></td>
      <td><div className="skeleton-line skeleton-line-medium"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
    </tr>
  );
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, field: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, field: null });

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('customFields'));

  const fetchFields = async () => {
    setLoading(true);
    try {
      const [fieldsRes, sectionsRes] = await Promise.all([
        getCustomFields(),
        getProfileSections(),
      ]);
      setFields(fieldsRes.data || []);
      setSections(sectionsRes.data || []);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setAdding(true);
    try {
      await createCustomField({
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        type,
        options: type === 'dropdown' ? options : '',
        section_id: sectionId || null,
      });
      toast.success(t('success'));
      setNameEn('');
      setNameAr('');
      setOptions('');
      setSectionId('');
      fetchFields();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setAdding(false);
    }
  };

  const handleEditSave = async (data) => {
    await updateCustomField(editDialog.field.id, data);
    fetchFields();
  };

  const handleDelete = async () => {
    if (!deleteDialog.field) return;
    try {
      await deleteCustomField(deleteDialog.field.id);
      toast.success(t('success'));
      setDeleteDialog({ open: false, field: null });
      fetchFields();
    } catch (error) {
      toast.error(error.message || t('error'));
      setDeleteDialog({ open: false, field: null });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Navbar variant="admin" onLogout={handleLogout} />
        <div className="admin-content">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">{t('customFields')}</h1>
              <p className="page-subtitle">{t('customFieldsSubtitle')}</p>
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: 24 }}>
            <div style={{ padding: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>{t('addCustomField')}</h3>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('fieldNameEn')}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder={t('fieldNameEnPlaceholder')}
                    disabled={adding}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('fieldNameAr')}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder={t('fieldNameArPlaceholder')}
                    dir="rtl"
                    disabled={adding}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('customFieldType')}
                  </label>
                  <select
                    className="form-input form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={adding}
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{typeLabel(t, ft)}</option>
                    ))}
                  </select>
                </div>
                {type === 'dropdown' && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      {t('fieldOptions')}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={options}
                      onChange={(e) => setOptions(e.target.value)}
                      placeholder={t('fieldOptionsPlaceholder')}
                      disabled={adding}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('customFieldSection')}
                  </label>
                  <select
                    className="form-input form-select"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    disabled={adding}
                  >
                    <option value="">{t('sectionCustom')}</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name_ar} ({section.name_en})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={adding} style={{ height: 42 }}>
                  {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                  {t('add')}
                </button>
              </form>
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('fieldNameEn')}</th>
                    <th>{t('fieldNameAr')}</th>
                    <th>{t('customFieldType')}</th>
                    <th>{t('customFieldSection')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : fields.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <FileInput size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <p>{t('noCustomFields')}</p>
                      </td>
                    </tr>
                  ) : (
                    fields.map((field, index) => {
                      const section = sections.find((s) => Number(s.id) === Number(field.section_id));
                      return (
                      <tr key={field.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{field.name_en}</td>
                        <td style={{ fontWeight: 500, direction: 'rtl' }}>{field.name_ar}</td>
                        <td>
                          <span className="status-badge status-active">{typeLabel(t, field.type)}</span>
                        </td>
                        <td>
                          {section ? (
                            <span className="status-badge status-info">{section.name_ar} ({section.name_en})</span>
                          ) : (
                            <span className="status-badge status-muted">{t('sectionCustom')}</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => setEditDialog({ open: true, field })}
                              title={t('edit')}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => setDeleteDialog({ open: true, field })}
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EditDialog
        field={editDialog.field}
        sections={sections}
        isOpen={editDialog.open}
        onClose={() => setEditDialog({ open: false, field: null })}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, field: null })}
        title={t('confirmDelete')}
        message={t('deleteCustomFieldConfirm')}
      />
    </div>
  );
}
