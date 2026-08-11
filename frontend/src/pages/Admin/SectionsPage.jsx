import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertTriangle, FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSections, createSection, deleteSection } from '../../services/api';
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
          <button className="btn btn-outline" onClick={onCancel}>
            {('cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {('delete')}
          </button>
        </div>
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
    </tr>
  );
}

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, section: null });

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('sections'));

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await getSections();
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
      await createSection(nameEn.trim(), nameAr.trim());
      toast.success(t('success'));
      setNameEn('');
      setNameAr('');
      fetchSections();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.section) return;
    try {
      await deleteSection(deleteDialog.section.id);
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
              <h1 className="page-title">{t('sections')}</h1>
              <p className="page-subtitle">{t('sectionsSubtitle')}</p>
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: 24 }}>
            <div style={{ padding: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>{t('addSection')}</h3>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
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
                <div style={{ flex: 1, minWidth: 200 }}>
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
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : sections.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <FolderOpen size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <p>{t('noSections')}</p>
                      </td>
                    </tr>
                  ) : (
                    sections.map((section, index) => (
                      <tr key={section.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{section.name_en}</td>
                        <td style={{ fontWeight: 500, direction: 'rtl' }}>{section.name_ar}</td>
                        <td>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => setDeleteDialog({ open: true, section })}
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </button>
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

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, section: null })}
        title={t('confirmDelete')}
        message={t('deleteSectionConfirm')}
      />
    </div>
  );
}
