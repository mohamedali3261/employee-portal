import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertTriangle, Pencil, Eye, EyeOff, ListPlus, FileInput, ArrowUp, ArrowDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getProfileSections, getSectionFields, getBuiltinFieldCatalog, addBuiltinSectionField,
  updateSectionField, deleteSectionField, getCustomFields, createCustomField,
  updateCustomField, deleteCustomField
} from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown', 'status'];

function typeLabel(t, type) {
  switch (type) {
    case 'number': return t('customFieldTypeNumber');
    case 'date': return t('customFieldTypeDate');
    case 'textarea': return t('customFieldTypeTextarea');
    case 'dropdown': return t('customFieldTypeSelect');
    case 'status': return t('fieldTypeStatus');
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

function EditFieldDialog({ field, sections, isOpen, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name_en: '', name_ar: '', type: 'text', options: '', section_id: '', is_visible: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (field) {
      setForm({
        name_en: field.name_en || '',
        name_ar: field.name_ar || '',
        type: field.type || 'text',
        options: (field.options || '').split(',').map(s => s.trim()).filter(Boolean).join(', '),
        section_id: field.section_id || '',
        is_visible: Number(field.is_visible) !== 0,
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
        is_visible: form.is_visible,
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
        <h3 className="modal-title">{t('edit')}</h3>
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
                    {section.name_ar} ({section.name_en})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
              disabled={saving}
            />
            {t('fieldVisible')}
          </label>
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

function FieldRow({ field, builtin, canUp, canDown, onMoveUp, onMoveDown, onEdit, onDelete, onToggleVisible }) {
  const { t } = useLanguage();
  const visible = Number(field.is_visible) !== 0;
  return (
    <div className="section-field-row">
      <div className="section-field-info">
        <div className="section-field-name">
          <span>{field.name_ar} ({field.name_en})</span>
          {builtin && <span className="status-badge status-info" style={{ marginInlineStart: 8 }}>{t('builtinField')}</span>}
          {!visible && <span className="status-badge status-muted" style={{ marginInlineStart: 8 }}>{t('fieldHidden')}</span>}
        </div>
        <span className="section-field-key">{field.field_key}</span>
      </div>
      <div className="action-buttons">
        {builtin && (
          <>
            <button
              className="action-btn action-btn-edit"
              onClick={onMoveUp}
              title={t('moveUp')}
              disabled={!canUp}
            >
              <ArrowUp size={16} />
            </button>
            <button
              className="action-btn action-btn-edit"
              onClick={onMoveDown}
              title={t('moveDown')}
              disabled={!canDown}
            >
              <ArrowDown size={16} />
            </button>
          </>
        )}
        <button
          className="action-btn action-btn-edit"
          onClick={onToggleVisible}
          title={visible ? t('fieldHidden') : t('fieldVisible')}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button
          className="action-btn action-btn-edit"
          onClick={onEdit}
          title={t('edit')}
        >
          <Pencil size={16} />
        </button>
        <button
          className="action-btn action-btn-delete"
          onClick={onDelete}
          title={t('delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function SectionFieldsPage() {
  const [sections, setSections] = useState([]);
  const [sectionFields, setSectionFields] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingBuiltinSection, setAddingBuiltinSection] = useState({});
  const [selectedBuiltin, setSelectedBuiltin] = useState({});
  const [editDialog, setEditDialog] = useState({ open: false, field: null, builtin: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, field: null, builtin: false });

  // Add custom field form
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [sectionId, setSectionId] = useState('');

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('sectionFields'));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sectionsRes, fieldsRes, catalogRes, customRes] = await Promise.all([
        getProfileSections(),
        getSectionFields(),
        getBuiltinFieldCatalog(),
        getCustomFields(),
      ]);
      setSections(sectionsRes.data || []);
      setSectionFields(fieldsRes.data || []);
      setCatalog(catalogRes.data || []);
      setCustomFields(customRes.data || []);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const handleAddCustom = async (e) => {
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
      fetchAll();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setAdding(false);
    }
  };

  const handleAddBuiltin = async (section) => {
    const key = selectedBuiltin[section.id];
    if (!key) return;
    setAddingBuiltinSection((prev) => ({ ...prev, [section.id]: true }));
    try {
      await addBuiltinSectionField({ field_key: key, section_id: section.id });
      toast.success(t('success'));
      setSelectedBuiltin((prev) => ({ ...prev, [section.id]: '' }));
      fetchAll();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setAddingBuiltinSection((prev) => ({ ...prev, [section.id]: false }));
    }
  };

  const handleEditSave = async (data) => {
    if (editDialog.builtin) {
      await updateSectionField(editDialog.field.id, data);
    } else {
      await updateCustomField(editDialog.field.id, data);
    }
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteDialog.field) return;
    try {
      if (deleteDialog.builtin) {
        await deleteSectionField(deleteDialog.field.id);
      } else {
        await deleteCustomField(deleteDialog.field.id);
      }
      toast.success(t('success'));
      setDeleteDialog({ open: false, field: null, builtin: false });
      fetchAll();
    } catch (error) {
      toast.error(error.message || t('error'));
      setDeleteDialog({ open: false, field: null, builtin: false });
    }
  };

  const handleToggleVisible = async (field) => {
    try {
      await updateSectionField(field.id, {
        name_en: field.name_en,
        name_ar: field.name_ar,
        type: field.type,
        options: field.options || '',
        section_id: field.section_id,
        sort_order: field.sort_order,
        is_visible: Number(field.is_visible) === 0 ? 1 : 0,
      });
      toast.success(t('success'));
      fetchAll();
    } catch (error) {
      toast.error(error.message || t('error'));
    }
  };

  const handleMove = async (field, direction) => {
    const ordered = sectionFields
      .filter((f) => Number(f.section_id) === Number(field.section_id))
      .slice()
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));
    const index = ordered.findIndex((f) => f.id === field.id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ordered.length) return;
    const [moved] = ordered.splice(index, 1);
    ordered.splice(newIndex, 0, moved);
    try {
      for (let i = 0; i < ordered.length; i++) {
        const f = ordered[i];
        const newOrder = (i + 1) * 10;
        if (Number(f.sort_order) !== newOrder) {
          await updateSectionField(f.id, {
            name_en: f.name_en,
            name_ar: f.name_ar,
            type: f.type,
            options: f.options || '',
            section_id: f.section_id,
            sort_order: newOrder,
            is_visible: Number(f.is_visible),
          });
        }
      }
      toast.success(t('success'));
      fetchAll();
    } catch (error) {
      toast.error(error.message || t('error'));
    }
  };

  const sectionTitle = (section) => {
    const s = section.section_key === 'custom'
      ? { name_ar: t('sectionCustom'), name_en: t('customFields') }
      : section;
    return s.name_ar ? `${s.name_ar} (${s.name_en})` : s.name_en;
  };

  const sectionKey = (section) => section.section_key || `section-${section.id}`;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Navbar variant="admin" onLogout={handleLogout} />
        <div className="admin-content">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">{t('sectionFields')}</h1>
              <p className="page-subtitle">{t('sectionFieldsSubtitle')}</p>
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: 24 }}>
            <div style={{ padding: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>{t('addCustomField')}</h3>
              <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                    {FIELD_TYPES.filter((ft) => ft !== 'status').map((ft) => (
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

          {loading ? (
            <div className="form-loading">
              <Loader2 size={32} className="spin" />
              <p>{t('loading')}</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="table-card">
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <FileInput size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>{t('noProfileSections')}</p>
              </div>
            </div>
          ) : (
            sections.map((section) => {
              const available = catalog.filter((f) => !f.is_used);
              const customSection = sections.find((s) => s.section_key === 'custom');
              const builtinInSection = sectionFields.filter((f) => Number(f.section_id) === Number(section.id));
              const sectionCustomFields = customFields.filter((f) => {
                const sid = Number(f.section_id);
                if (section.section_key === 'custom') {
                  return !f.section_id || sid === Number(customSection?.id);
                }
                return sid === Number(section.id);
              });
              const fieldsInSection = [...builtinInSection, ...sectionCustomFields];
              const builtinOrdered = builtinInSection
                .slice()
                .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id));

              return (
                <div key={section.id} className="table-card" style={{ marginBottom: 16 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <h3 className="card-title" style={{ marginBottom: 0 }}>{sectionTitle(section)}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <select
                          className="form-input form-select"
                          style={{ minWidth: 200, height: 38 }}
                          value={selectedBuiltin[section.id] || ''}
                          onChange={(e) => setSelectedBuiltin((prev) => ({ ...prev, [section.id]: e.target.value }))}
                          disabled={available.length === 0}
                        >
                          <option value="">{t('addReadyFieldPlaceholder')}</option>
                          {available.map((f) => (
                            <option key={f.field_key} value={f.field_key}>{f.name_ar} ({f.name_en})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ height: 38 }}
                          disabled={!selectedBuiltin[section.id] || available.length === 0}
                          onClick={() => handleAddBuiltin(section)}
                        >
                          {addingBuiltinSection[section.id] ? <Loader2 size={16} className="spin" /> : <ListPlus size={16} />}
                          {t('add')}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 8 }}>
                    {fieldsInSection.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                        {t('noSectionFields')}
                      </div>
                    ) : (
                      fieldsInSection.map((field) => {
                        const isReadyField = Boolean(Number(field.is_builtin) === 1) && field.id !== undefined;
                        const builtinIndex = builtinOrdered.findIndex((f) => f.id === field.id);
                        const canUp = isReadyField && builtinIndex > 0;
                        const canDown = isReadyField && builtinIndex !== -1 && builtinIndex < builtinOrdered.length - 1;
                        return (
                          <FieldRow
                            key={isReadyField ? `r-${field.id}` : `c-${field.id}`}
                            field={field}
                            builtin={isReadyField}
                            canUp={canUp}
                            canDown={canDown}
                            onMoveUp={() => handleMove(field, -1)}
                            onMoveDown={() => handleMove(field, 1)}
                            onEdit={() => setEditDialog({ open: true, field, builtin: isReadyField })}
                            onDelete={() => setDeleteDialog({ open: true, field, builtin: isReadyField })}
                            onToggleVisible={isReadyField ? () => handleToggleVisible(field) : null}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <EditFieldDialog
        field={editDialog.field}
        sections={sections}
        isOpen={editDialog.open}
        onClose={() => setEditDialog({ open: false, field: null, builtin: false })}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, field: null, builtin: false })}
        title={t('confirmDelete')}
        message={t('deleteSectionFieldConfirm')}
      />
    </div>
  );
}
