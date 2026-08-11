import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertTriangle, LayoutGrid, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getProfileSections, createProfileSection, updateProfileSection, deleteProfileSection
} from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

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

function EditDialog({ section, isOpen, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name_en: '', name_ar: '', sort_order: 0, column_no: 2 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setForm({
        name_en: section.name_en || '',
        name_ar: section.name_ar || '',
        sort_order: section.sort_order || 0,
        column_no: Number(section.column_no) === 1 ? 1 : 2,
      });
    }
  }, [section]);

  if (!isOpen || !section) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name_en.trim() || !form.name_ar.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form });
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
        <h3 className="modal-title">{t('editProfileSection')}</h3>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t('sectionNameEn')}</label>
              <input
                type="text"
                className="form-input"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                placeholder={t('sectionNameEnPlaceholder')}
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('sectionNameAr')}</label>
              <input
                type="text"
                className="form-input"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                placeholder={t('sectionNameArPlaceholder')}
                dir="rtl"
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('sectionSortOrder')}</label>
              <input
                type="number"
                className="form-input"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('sectionColumn')}</label>
              <select
                className="form-input form-select"
                value={form.column_no}
                onChange={(e) => setForm({ ...form, column_no: Number(e.target.value) })}
                disabled={saving}
              >
                <option value={1}>{t('sectionColumnLeft')}</option>
                <option value={2}>{t('sectionColumnRight')}</option>
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
    </tr>
  );
}

export default function ProfileSectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [columnNo, setColumnNo] = useState(2);
  const [editDialog, setEditDialog] = useState({ open: false, section: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, section: null });

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('profileSections'));

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await getProfileSections();
      setSections(response.data || []);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setAdding(true);
    try {
      await createProfileSection({
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        column_no: columnNo,
      });
      toast.success(t('success'));
      setNameEn('');
      setNameAr('');
      setColumnNo(2);
      fetchSections();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setAdding(false);
    }
  };

  const handleEditSave = async (data) => {
    await updateProfileSection(editDialog.section.id, data);
    fetchSections();
  };

  const handleDelete = async () => {
    if (!deleteDialog.section) return;
    try {
      await deleteProfileSection(deleteDialog.section.id);
      toast.success(t('success'));
      setDeleteDialog({ open: false, section: null });
      fetchSections();
    } catch (error) {
      toast.error(error.message || t('error'));
      setDeleteDialog({ open: false, section: null });
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
              <h1 className="page-title">{t('profileSections')}</h1>
              <p className="page-subtitle">{t('profileSectionsSubtitle')}</p>
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: 24 }}>
            <div style={{ padding: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>{t('addProfileSection')}</h3>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('sectionNameEn')}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder={t('sectionNameEnPlaceholder')}
                    disabled={adding}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('sectionNameAr')}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder={t('sectionNameArPlaceholder')}
                    dir="rtl"
                    disabled={adding}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('sectionColumn')}
                  </label>
                  <select
                    className="form-input form-select"
                    value={columnNo}
                    onChange={(e) => setColumnNo(Number(e.target.value))}
                    disabled={adding}
                  >
                    <option value={1}>{t('sectionColumnLeft')}</option>
                    <option value={2}>{t('sectionColumnRight')}</option>
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
                    <th>{t('sectionNameEn')}</th>
                    <th>{t('sectionNameAr')}</th>
                    <th>{t('sectionColumn')}</th>
                    <th>{t('sectionSortOrder')}</th>
                    <th>{t('sectionType')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : sections.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <LayoutGrid size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <p>{t('noProfileSections')}</p>
                      </td>
                    </tr>
                  ) : (
                    sections.map((section, index) => (
                      <tr key={section.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{section.name_en}</td>
                        <td style={{ fontWeight: 500, direction: 'rtl' }}>{section.name_ar}</td>
                        <td>
                          <span className="status-badge status-active">
                            {Number(section.column_no) === 1 ? t('sectionColumnLeft') : t('sectionColumnRight')}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{section.sort_order}</td>
                        <td>
                          <span className={`status-badge ${Number(section.is_builtin) === 1 ? 'status-active' : 'status-warning'}`}>
                            {Number(section.is_builtin) === 1 ? t('sectionBuiltin') : t('sectionCustom')}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => setEditDialog({ open: true, section })}
                              title={t('edit')}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => {
                                if (Number(section.is_builtin) === 1) {
                                  toast.error(t('sectionBuiltinDeleteError'));
                                  return;
                                }
                                setDeleteDialog({ open: true, section });
                              }}
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EditDialog
        section={editDialog.section}
        isOpen={editDialog.open}
        onClose={() => setEditDialog({ open: false, section: null })}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, section: null })}
        title={t('confirmDelete')}
        message={t('deleteProfileSectionConfirm')}
      />
    </div>
  );
}
