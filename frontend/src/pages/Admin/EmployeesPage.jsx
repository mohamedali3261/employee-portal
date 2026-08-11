import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Edit, Trash2, Eye,
  Download, Upload, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, X, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, deleteEmployee, importEmployees, getSections, getCustomFields, getSectionFields } from '../../services/api';
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
            {t('cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {t('delete')}
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
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
      <td><div className="skeleton-line skeleton-line-short"></div></td>
    </tr>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [importing, setImporting] = useState(false);
  const [sections, setSections] = useState([]);
  const limit = 10;

  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('employees'));

  const fetchSections = async () => {
    try {
      const response = await getSections();
      setSections(response.data || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (department) params.department = department;
      if (status) params.status = status;

      const response = await getEmployees(params);
      setEmployees(response.data.employees || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalEmployees(response.data.total || 0);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, department, status, t]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setPage(1);
  }, [search, department, status]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const handleDelete = async () => {
    if (!deleteDialog.employee) return;
    try {
      await deleteEmployee(deleteDialog.employee._id);
      toast.success(t('deleteSuccess'));
      setDeleteDialog({ open: false, employee: null });
      fetchEmployees();
    } catch (error) {
      toast.error(t('deleteFailed'));
    }
  };

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const [res, customFieldsRes, sectionFieldsRes] = await Promise.all([
        getEmployees({ limit: 10000 }),
        getCustomFields(),
        getSectionFields()
      ]);
      const allEmployees = res.data.employees || [];
      const customDefs = customFieldsRes.data || [];
      const sectionDefs = sectionFieldsRes.data || [];

      const statusMap = { active: 'Active', inactive: 'Inactive', resigned: 'Resigned' };

      // Create a mapping of field_key to field definition for section fields
      const sectionFieldMap = {};
      sectionDefs.forEach(field => {
        sectionFieldMap[field.field_key] = field;
      });

      const data = allEmployees.map((emp, i) => {
        const row = {
          '#': i + 1,
          'ID': emp.employeeId,
          'Arabic Name': emp.arabicName,
          'English Name': emp.englishName,
          'Job Title': emp.jobTitle || '',
          'Job Title (AR)': emp.jobTitleAr || '',
          'Job Title (EN)': emp.jobTitleEn || '',
          'Department': emp.department,
          'Sector': emp.sector || '',
          'Education': emp.education || '',
          'Graduation Year': emp.graduationYear || '',
          'Email': emp.email || '',
          'Phone': emp.phone,
          'Hire Date': emp.hireDate || '',
          'Start Date': emp.employmentStart || '',
          'Address': emp.address || '',
          'Status': statusMap[emp.status] || emp.status,
          'Languages': emp.languages ? emp.languages.map(l => l.language).filter(Boolean).join(', ') : '',
          'Notes': emp.notes || '',
        };

        // Add section fields (built-in fields configured in section_fields)
        sectionDefs.forEach((field) => {
          const fieldKey = field.field_key;
          let value = '';
          
          // Map frontend field names to backend employee object
          const fieldMapping = {
            'employeeId': 'employeeId',
            'arabicName': 'arabicName',
            'englishName': 'englishName',
            'jobTitleAr': 'jobTitleAr',
            'jobTitleEn': 'jobTitleEn',
            'department': 'department',
            'email': 'email',
            'sector': 'sector',
            'hireDate': 'hireDate',
            'address': 'address',
            'phone': 'phone',
            'status': 'status',
            'notes': 'notes',
            'insuranceNumber': 'insuranceNumber',
            'bank': 'bank',
            'bankAccount': 'bankAccount',
            'attendanceBase': 'attendanceBase',
            'route': 'route',
            'education': 'education',
            'graduationYear': 'graduationYear',
            'employmentStart': 'employmentStart',
            'age': 'age',
          };
          
          if (fieldMapping[fieldKey] && emp[fieldMapping[fieldKey]] !== undefined) {
            value = String(emp[fieldMapping[fieldKey]]);
          }
          
          row[field.name_en] = value;
        });

        // Add custom fields
        customDefs.forEach((field) => {
          const val = emp.customFields?.[field.field_key];
          row[field.name_en] = val !== undefined && val !== null ? String(val) : '';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 22 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
        { wch: 16 }, { wch: 16 }, { wch: 25 }, { wch: 16 },
        { wch: 14 }, { wch: 14 },
        { wch: 22 }, { wch: 14 },
        { wch: 30 },
        ...sectionDefs.map(() => ({ wch: 18 })),
        ...customDefs.map(() => ({ wch: 20 })),
      ];

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) {
          ws[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
            fill: { fgColor: { rgb: 'EA580C' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'CC4400' } },
              bottom: { style: 'thin', color: { rgb: 'CC4400' } },
              left: { style: 'thin', color: { rgb: 'CC4400' } },
              right: { style: 'thin', color: { rgb: 'CC4400' } }
            }
          };
        }
      }

      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[addr]) {
            ws[addr].s = {
              font: { sz: 10, name: 'Calibri', color: { rgb: '333333' } },
              fill: R % 2 === 0 ? { fgColor: { rgb: 'FFF9F5' } } : undefined,
              alignment: { vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'E8E0D8' } },
                bottom: { style: 'thin', color: { rgb: 'E8E0D8' } },
                left: { style: 'thin', color: { rgb: 'E8E0D8' } },
                right: { style: 'thin', color: { rgb: 'E8E0D8' } }
              }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, 'employees.xlsx');
      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('exportFailed'));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      let customDefs = [];
      let sectionDefs = [];
      try {
        const [customFieldsRes, sectionFieldsRes] = await Promise.all([
          getCustomFields(),
          getSectionFields()
        ]);
        customDefs = customFieldsRes.data || [];
        sectionDefs = sectionFieldsRes.data || [];
      } catch { customDefs = []; sectionDefs = []; }

      // Create mapping for section fields
      const sectionFieldMapping = {};
      sectionDefs.forEach(field => {
        sectionFieldMapping[field.name_en] = field.field_key;
        if (field.name_ar) {
          sectionFieldMapping[field.name_ar] = field.field_key;
        }
      });

      const mapped = jsonData.map((row) => {
        const custom_fields = {};
        
        // Handle custom fields
        customDefs.forEach((field) => {
          const col = row[field.name_en] !== undefined ? field.name_en : field.name_ar;
          if (row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
            custom_fields[field.field_key] = String(row[col]);
          }
        });

        // Handle section fields (built-in fields from section_fields table)
        const sectionFieldsData = {};
        sectionDefs.forEach((field) => {
          const col = row[field.name_en] !== undefined ? field.name_en : field.name_ar;
          if (row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
            sectionFieldsData[field.field_key] = row[col];
          }
        });

        // Handle Languages field - convert comma-separated string to array
        let languages = [];
        const languagesStr = row['Languages'] || row['languages'] || '';
        if (languagesStr && String(languagesStr).trim() !== '') {
          languages = String(languagesStr).split(',').map(lang => ({
            language: lang.trim(),
            proficiency: 'beginner'
          })).filter(l => l.language);
        }

        return {
          employee_id: String(row['ID'] || row['employeeId'] || ''),
          name_ar: row['Arabic Name'] || row['arabicName'] || '',
          name_en: row['English Name'] || row['englishName'] || '',
          job_title: row['Job Title'] || row['jobTitle'] || '',
          job_title_ar: row['Job Title (AR)'] || row['jobTitleAr'] || '',
          job_title_en: row['Job Title (EN)'] || row['jobTitleEn'] || '',
          department: row['Department'] || row['department'] || '',
          sector: row['Sector'] || row['sector'] || '',
          education: row['Education'] || row['education'] || '',
          graduation_year: row['Graduation Year'] || row['graduationYear'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          hire_date: row['Hire Date'] || row['hireDate'] || '',
          employment_start: row['Start Date'] || row['employmentStart'] || '',
          address: row['Address'] || row['address'] || '',
          status: (row['Status'] || row['status'] || 'active').toLowerCase(),
          notes: row['Notes'] || row['notes'] || '',
          // Map section fields to their backend field names
          insurance_number: sectionFieldsData['insuranceNumber'] || '',
          bank: sectionFieldsData['bank'] || '',
          bank_account: sectionFieldsData['bankAccount'] || '',
          attendance_base: sectionFieldsData['attendanceBase'] || '',
          route: sectionFieldsData['route'] || '',
          age: sectionFieldsData['age'] || '',
          languages,
          custom_fields,
        };
      });

      const res = await importEmployees(mapped);
      const importedCount = res?.data?.imported || 0;
      const skippedCount = res?.data?.skipped || 0;
      const hadErrors = res?.data?.errors?.length > 0;
      toast.success(`${t('importSuccess')} — ${importedCount} imported, ${skippedCount} skipped`);
      if (hadErrors) {
        toast.error(res.data.errors.slice(0, 3).join('\n'));
      }
      fetchEmployees();
    } catch (error) {
      toast.error(t('importFailed'));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Navbar variant="admin" onLogout={handleLogout} />
        <div className="admin-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">{t('employees')}</h1>
              <p className="page-subtitle">
                {t('showing')} {totalEmployees} {t('employees')}
              </p>
            </div>
            <div className="page-actions">
              <button className="btn btn-outline" onClick={handleExport}>
                <Download size={16} />
                {t('export')}
              </button>
              <label className="btn btn-outline" htmlFor="import-file">
                <Upload size={16} />
                {importing ? t('loading') : t('import')}
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  className="hidden-input"
                  disabled={importing}
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/employees/new')}
              >
                <Plus size={16} />
                {t('addEmployee')}
              </button>
            </div>
          </div>

          <div className="filters-bar">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="filter-group">
              <Filter size={16} />
              <select
                className="filter-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">{t('all')} {t('departments')}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name_en}>{s.name_en}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{t('all')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('employeeId')}</th>
                    <th>{t('fullName')}</th>
                    <th>{t('department')}</th>
                    <th>{t('employmentStatus')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <FileSpreadsheet size={48} className="empty-icon" />
                        <p>{t('noData')}</p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/admin/employees/new')}
                        >
                          <Plus size={14} />
                          {t('addEmployee')}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp._id}>
                        <td className="td-id">{emp.employeeId}</td>
                        <td>
                          <div className="employee-name-cell">
                            {emp.profileImage ? (
                              <img
                                src={emp.profileImage}
                                alt={emp.englishName}
                                className="employee-avatar-sm employee-avatar-img"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div className="employee-avatar-sm" style={emp.profileImage ? { display: 'none' } : {}}>
                              {emp.englishName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <span className="employee-name">{emp.englishName}</span>
                              <span className="employee-name-ar">{emp.arabicName}</span>
                            </div>
                          </div>
                        </td>
                        <td>{emp.department}</td>
                        <td>
                          <span className={`status-badge status-${emp.status?.toLowerCase()}`}>
                            {emp.status === 'active' ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn action-btn-view"
                              onClick={() => navigate(`/employee/${emp.employeeId}`)}
                              title={t('viewDetails')}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => navigate(`/admin/employees/edit/${emp._id}`)}
                              title={t('edit')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => setDeleteDialog({ open: true, employee: emp })}
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

            {/* Mobile card layout */}
            <div className="mobile-employee-list">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="mobile-employee-card skeleton">
                    <div className="skeleton-icon" style={{ width: 44, height: 44, borderRadius: '50%' }}></div>
                    <div className="skeleton-content" style={{ flex: 1 }}>
                      <div className="skeleton-line skeleton-line-medium"></div>
                      <div className="skeleton-line skeleton-line-short"></div>
                    </div>
                  </div>
                ))
              ) : employees.length === 0 ? (
                <div className="empty-state">
                  <FileSpreadsheet size={48} className="empty-icon" />
                  <p>{t('noData')}</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/admin/employees/new')}
                  >
                    <Plus size={14} />
                    {t('addEmployee')}
                  </button>
                </div>
              ) : (
                employees.map((emp) => (
                  <div key={emp._id} className="mobile-employee-card">
                    <div className="mobile-card-top">
                      <div className="employee-name-cell">
                        {emp.profileImage ? (
                          <img
                            src={emp.profileImage}
                            alt={emp.englishName}
                            className="employee-avatar-sm employee-avatar-img"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="employee-avatar-sm" style={emp.profileImage ? { display: 'none' } : {}}>
                          {emp.englishName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="employee-name">{emp.englishName}</span>
                          <span className="employee-name-ar">{emp.arabicName}</span>
                        </div>
                      </div>
                      <span className={`status-badge status-${emp.status?.toLowerCase()}`}>
                        {emp.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <div className="mobile-card-details">
                      <div className="mobile-card-detail">
                        <span className="mobile-card-label">{t('employeeId')}</span>
                        <span className="td-id">{emp.employeeId}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-label">{t('department')}</span>
                        <span>{emp.department}</span>
                      </div>
                    </div>
                    <div className="mobile-card-actions">
                      <button
                        className="action-btn action-btn-view"
                        onClick={() => navigate(`/employee/${emp.employeeId}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => navigate(`/admin/employees/edit/${emp._id}`)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={() => setDeleteDialog({ open: true, employee: emp })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                  {t('previous')}
                </button>
                <div className="pagination-info">
                  {t('page')} {page} {t('of')} {totalPages}
                </div>
                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, employee: null })}
        title={t('confirmDelete')}
        message={t('deleteConfirmMessage')}
      />
    </div>
  );
}
