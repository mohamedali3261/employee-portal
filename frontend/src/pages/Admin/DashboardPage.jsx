import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Building2,
  Download, TrendingUp, Loader2, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { getDashboardStats } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/common/Sidebar';
import Navbar from '../../components/common/Navbar';
import LoadingScreen from '../../components/common/LoadingScreen';
import usePageTitle from '../../hooks/usePageTitle';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
const DONUT_COLORS = ['#22c55e', '#ef4444'];

function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      text: style.getPropertyValue('--text').trim() || '#0F172A',
      textSecondary: style.getPropertyValue('--text-secondary').trim() || '#64748B',
      grid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      tooltipBg: theme === 'dark' ? '#1E293B' : '#fff',
      tooltipText: theme === 'dark' ? '#F1F5F9' : '#0F172A',
      tooltipBorder: theme === 'dark' ? '#334155' : '#E2E8F0',
    };
  }, [theme]);
}

function AnimatedCounter({ value, duration = 1500 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className={`stat-card stat-card-${color}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-icon">
        <Icon size={24} />
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-value">
          <AnimatedCounter value={value} />
        </h3>
        <p className="stat-card-label">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card skeleton">
      <div className="skeleton-icon"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-line-short"></div>
        <div className="skeleton-line skeleton-line-long"></div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="chart-card skeleton-chart">
      <div className="skeleton-line skeleton-line-medium"></div>
      <div className="skeleton-chart-area"></div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const { t } = useLanguage();
  usePageTitle(t('dashboard'));
  const navigate = useNavigate();
  const chartColors = useChartColors();

  useEffect(() => {
    fetchStats();
    const timer = setTimeout(() => setPageLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      if (stats?.departmentStats?.length) {
        const deptWs = XLSX.utils.json_to_sheet(stats.departmentStats.map((d) => ({
          Department: d.department,
          Count: d.count
        })));
        const deptRange = XLSX.utils.decode_range(deptWs['!ref']);
        const deptStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'EA580C' } } };
        for (let C = deptRange.s.c; C <= deptRange.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: 0, c: C });
          if (deptWs[addr]) deptWs[addr].s = deptStyle;
        }
        deptWs['!cols'] = [{ wch: 30 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, deptWs, 'Departments');
      }

      XLSX.writeFile(wb, 'dashboard-report.xlsx');
      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('exportFailed'));
    }
  };

  const departmentData = stats?.departmentStats?.map((d) => ({
    name: d.department,
    count: d.count
  })) || [];

  const statusData = [
    { name: t('active'), value: stats?.activeCount || 0 },
    { name: t('inactive'), value: stats?.inactiveCount || 0 }
  ];

  return (
    <div className="admin-layout">
      {pageLoading && <LoadingScreen />}
      <Sidebar />
      <div className="admin-main">
        <Navbar variant="admin" onLogout={handleLogout} />
        <div className="admin-content" id="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">{t('dashboard')}</h1>
              <p className="page-subtitle">{t('overview')}</p>
            </div>
            <div className="dashboard-actions">
              <button className="btn btn-outline" onClick={fetchStats} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                {t('refresh')}
              </button>
              <button className="btn btn-outline" onClick={exportToExcel}>
                <Download size={16} />
                {t('export')}
              </button>
            </div>
          </div>

          {loading ? (
            <>
              <div className="stats-grid">
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
              <div className="charts-grid">
                {[...Array(3)].map((_, i) => <SkeletonChart key={i} />)}
              </div>
            </>
          ) : (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={Users}
                  label={t('totalEmployees')}
                  value={stats?.totalEmployees || 0}
                  color="primary"
                  delay={0}
                />
                <StatCard
                  icon={UserCheck}
                  label={t('activeEmployees')}
                  value={stats?.activeCount || 0}
                  color="success"
                  delay={100}
                />
                <StatCard
                  icon={UserX}
                  label={t('inactiveEmployees')}
                  value={stats?.inactiveCount || 0}
                  color="warning"
                  delay={200}
                />
                <StatCard
                  icon={Building2}
                  label={t('departments')}
                  value={stats?.totalDepartments || 0}
                  color="info"
                  delay={300}
                />
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">
                    <TrendingUp size={18} />
                    {t('employeesByDepartment')}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartColors.textSecondary }} />
                      <YAxis tick={{ fill: chartColors.textSecondary }} />
                      <Tooltip
                        contentStyle={{
                          background: chartColors.tooltipBg,
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: 8,
                          color: chartColors.tooltipText
                        }}
                      />
                      <Legend wrapperStyle={{ color: chartColors.text }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        {departmentData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">
                    <UserCheck size={18} />
                    {t('active')} vs {t('inactive')}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={index} fill={DONUT_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: chartColors.tooltipBg,
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: 8,
                          color: chartColors.tooltipText
                        }}
                      />
                      <Legend wrapperStyle={{ color: chartColors.text }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
