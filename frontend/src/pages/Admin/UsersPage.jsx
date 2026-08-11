import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, RotateCcw, Trash2, Loader2, AlertTriangle, Users, KeyRound, Shield, CheckCircle, User, UserPlus, X, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminUsers, createAdminUser, updateAdminUser, resetAdminPassword, deleteAdminUser } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);

  // Edit User Modal State
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [editUsername, setEditUsername] = useState('');
  const [updating, setUpdating] = useState(false);

  // Reset Password Dialog State
  const [resetDialog, setResetDialog] = useState({ open: false, user: null });
  const [resetting, setResetting] = useState(false);

  // Delete User Dialog State
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const { t, language } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('users'));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAdminUsers();
      setUsers(response.data || []);
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add User (Username only, default password 123456)
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setCreating(true);
    try {
      await createAdminUser({ username: newUsername.trim(), role: newRole });
      toast.success(t('createSuccess'));
      setNewUsername('');
      setNewRole('user');
      setShowAddModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit User Name
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUsername.trim() || !editModal.user) return;

    setUpdating(true);
    try {
      await updateAdminUser(editModal.user.id, { username: editUsername.trim() });
      toast.success(t('updateSuccess'));
      setEditModal({ open: false, user: null });
      setEditUsername('');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setUpdating(false);
    }
  };

  // Handle Reset Password to 123456
  const handleResetPassword = async () => {
    if (!resetDialog.user) return;
    setResetting(true);
    try {
      await resetAdminPassword(resetDialog.user.id);
      toast.success(t('resetPasswordSuccess'));
      setResetDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setResetting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteDialog.user.id);
      toast.success(t('deleteSuccess'));
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setDeleting(false);
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
          {/* Header */}
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title">{t('users')}</h1>
              <p className="page-subtitle">{t('manageUsers')}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontWeight: 600 }}>
              <Plus size={18} />
              <span>{t('addUser')}</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="table-card" style={{ marginTop: 20 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('username')}</th>
                    <th>{t('role')}</th>
                    <th>{t('passwordStatus')}</th>
                    <th>{t('createdAt')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td><div className="skeleton-line skeleton-line-short" /></td>
                        <td><div className="skeleton-line skeleton-line-medium" /></td>
                        <td><div className="skeleton-line skeleton-line-short" /></td>
                        <td><div className="skeleton-line skeleton-line-short" /></td>
                        <td><div className="skeleton-line skeleton-line-medium" /></td>
                        <td><div className="skeleton-line skeleton-line-short" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <Users size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <p>{t('noUsers')}</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</td>
                        <td>
                          <span className={`badge ${user.role === 'super_admin' ? 'badge-primary' : 'badge-info'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                            <Shield size={12} />
                            {user.role === 'super_admin' ? t('superAdmin') : t('adminUser')}
                          </span>
                        </td>
                        <td>
                          {user.must_change_password === 1 ? (
                            <span style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <KeyRound size={13} />
                              {t('defaultPasswordBadge')}
                            </span>
                          ) : (
                            <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle size={13} />
                              {t('updatedPasswordBadge')}
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US') : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => { setEditModal({ open: true, user }); setEditUsername(user.username); }}
                              title={t('editUsername')}
                              style={{ padding: 8 }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => setResetDialog({ open: true, user })}
                              title={t('resetPasswordDefault')}
                              style={{ padding: 8, color: '#eab308', borderColor: 'rgba(234, 179, 8, 0.3)', background: 'rgba(234, 179, 8, 0.08)' }}
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => setDeleteDialog({ open: true, user })}
                              title={t('delete')}
                              style={{ padding: 8 }}
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

      {/* Enhanced Add User Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
          style={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'var(--card-bg, #ffffff)',
              animation: 'modalSlideUp 0.25s ease-out'
            }}
          >
            {/* Header with Icon and Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                }}>
                  <UserPlus size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {t('addNewUser')}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {t('manageUsers')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              {/* Username Input Field */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {t('username')}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', [language === 'ar' ? 'right' : 'left']: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('enterUsernamePlaceholder')}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: language === 'ar' ? '12px 42px 12px 14px' : '12px 14px 12px 42px',
                      borderRadius: 12,
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      fontSize: 14,
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {t('selectRole')}
                </label>
                <select
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--border-color, #e2e8f0)',
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: 'var(--input-bg, #fff)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="user">{t('userRole')}</option>
                  <option value="admin">{t('adminRole')}</option>
                </select>
              </div>

              {/* Styled Default Password Notice Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 24,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary, #3b82f6)',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <KeyRound size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t('defaultPasswordInfoTitle')}
                    </span>
                    <span style={{
                      background: 'var(--primary, #3b82f6)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1
                    }}>
                      123456
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {t('defaultPasswordInfoDesc')}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 600 }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  style={{
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {creating ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                  <span>{t('addUser')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Username Modal */}
      {editModal.open && (
        <div className="modal-overlay" onClick={() => setEditModal({ open: false, user: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450, borderRadius: 16, padding: 24 }}>
            <div className="modal-header" style={{ marginBottom: 16 }}>
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={20} className="text-primary" />
                <span>{t('editUsername')}</span>
              </h3>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {t('newUsername')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('enterUsernamePlaceholder')}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditModal({ open: false, user: null })} disabled={updating}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? <Loader2 size={16} className="spin" /> : <Edit2 size={16} />}
                  <span>{t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {resetDialog.open && (
        <div className="modal-overlay" onClick={() => setResetDialog({ open: false, user: null })}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ borderRadius: 16, padding: 24 }}>
            <div className="modal-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <RotateCcw size={32} />
            </div>
            <h3 className="modal-title">{t('resetPasswordConfirmTitle')}</h3>
            <p className="modal-message">
              {t('resetPasswordConfirmMessage', { username: resetDialog.user?.username })}
              <br />
              <small style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)' }}>
                {t('resetPasswordSubtext')}
              </small>
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setResetDialog({ open: false, user: null })} disabled={resetting}>
                {t('cancel')}
              </button>
              <button className="btn" style={{ background: '#eab308', color: '#fff', fontWeight: 600 }} onClick={handleResetPassword} disabled={resetting}>
                {resetting ? <Loader2 size={16} className="spin" /> : <RotateCcw size={16} />}
                <span>{t('resetPasswordDefault')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      {deleteDialog.open && (
        <div className="modal-overlay" onClick={() => setDeleteDialog({ open: false, user: null })}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ borderRadius: 16, padding: 24 }}>
            <div className="modal-icon modal-icon-warning">
              <AlertTriangle size={32} />
            </div>
            <h3 className="modal-title">{t('confirmDelete')}</h3>
            <p className="modal-message">
              {t('deleteUserConfirm', { username: deleteDialog.user?.username })}
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteDialog({ open: false, user: null })} disabled={deleting}>
                {t('cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUser} disabled={deleting}>
                {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>{t('delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
