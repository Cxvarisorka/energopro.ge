import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Download,
} from 'lucide-react';
import api from '../../api';

const cardStyles = [
  {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
    Icon: Users,
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-700',
    Icon: CheckCircle,
  },
  {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-700',
    Icon: XCircle,
  },
  {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-700',
    Icon: AlertTriangle,
  },
];

function StatCard({ label, value, style }) {
  const { bg, border, iconBg, iconColor, valueColor, Icon } = style;
  return (
    <div className={`rounded-xl border ${border} ${bg} p-3 sm:p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={18} className={`${iconColor} sm:hidden`} />
          <Icon size={20} className={`${iconColor} hidden sm:block`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-tight text-gray-500 sm:text-sm">{label}</p>
          <p className={`text-xl font-bold ${valueColor} sm:text-3xl`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ComplianceCard({ compliance }) {
  if (!compliance) return null;
  const { complianceRate, fullyCompliant, withExpired, totalWithExams } = compliance;

  const getColor = (rate) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (rate) => {
    if (rate >= 80) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">შესაბამისობის მაჩვენებელი</h3>
      </div>
      <div className="flex items-end gap-4">
        <span className={`text-4xl font-bold ${getColor(complianceRate)}`}>{complianceRate}%</span>
        <div className="flex-1 space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${getBarColor(complianceRate)} transition-all duration-500`}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>შესაბამისი: {fullyCompliant}</span>
            <span>ვადაგასული: {withExpired}</span>
            <span>სულ: {totalWithExams}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QualificationCard({ distribution, totalEmployees }) {
  if (!distribution?.length) return null;

  const colors = {
    I: 'bg-blue-500',
    II: 'bg-indigo-500',
    III: 'bg-purple-500',
    IV: 'bg-pink-500',
    V: 'bg-rose-500',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">კვალიფიკაციის მიხედვით</h3>
      </div>
      <div className="flex items-end gap-2">
        {distribution.map((d) => {
          const pct = totalEmployees > 0 ? (d.count / totalEmployees) * 100 : 0;
          return (
            <div key={d._id} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold text-gray-700">{d.count}</span>
              <div className="w-full overflow-hidden rounded-t bg-gray-100" style={{ height: '80px' }}>
                <div
                  className={`w-full ${colors[d._id] || 'bg-gray-400'} rounded-t transition-all duration-500`}
                  style={{ height: `${Math.max(pct, 5)}%`, marginTop: `${100 - Math.max(pct, 5)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500">{d._id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentCard({ departments }) {
  if (!departments?.length) return null;
  const maxCount = Math.max(...departments.map((d) => d.count));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Building2 size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">დეპარტამენტების მიხედვით</h3>
      </div>
      <div className="space-y-3">
        {departments.map((d) => {
          const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
          return (
            <div key={d._id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="min-w-0 truncate text-gray-700">{d._id}</span>
                <span className="shrink-0 pl-2 font-semibold text-gray-900">{d.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExamSection({ title, exams, variant }) {
  if (!exams?.length) return null;

  const isExpired = variant === 'expired';
  const accentColor = isExpired ? 'red' : 'amber';
  const badgeBg = isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  const IconComp = isExpired ? XCircle : CalendarClock;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className={`flex items-center gap-2 border-b border-gray-200 px-4 py-3 sm:px-5 bg-${accentColor}-50/50`}>
        <IconComp size={16} className={`text-${accentColor}-500`} />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
          {exams.length}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="px-5 py-2.5 font-medium text-gray-500">სახელი და გვარი</th>
              <th className="px-5 py-2.5 font-medium text-gray-500">პირადი ნომერი</th>
              <th className="px-5 py-2.5 font-medium text-gray-500">დისციპლინა</th>
              <th className="px-5 py-2.5 font-medium text-gray-500">შემდეგი გამოცდა</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((exam) => (
              <tr key={exam._id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-5 py-2.5 font-medium text-gray-900">{exam.employee?.fullName}</td>
                <td className="px-5 py-2.5 text-gray-600">{exam.employee?.personalId}</td>
                <td className="px-5 py-2.5 text-gray-600">{exam.discipline}</td>
                <td className="px-5 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                    {new Date(exam.nextExamDate).toLocaleDateString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {exams.map((exam) => (
          <div key={exam._id} className="px-4 py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 wrap-break-word min-w-0">{exam.employee?.fullName}</p>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                {new Date(exam.nextExamDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{exam.employee?.personalId}</span>
              <span className="text-gray-300">|</span>
              <span className="truncate">{exam.discipline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/export/employees/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // toast handled by interceptor
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertTriangle size={40} className="mb-2" />
        <p className="text-sm">მონაცემები არ მოიძებნა</p>
      </div>
    );
  }

  const statusMap = {};
  stats.examsByStatus?.forEach((s) => { statusMap[s._id] = s.count; });

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">მთავარი</h2>
          <p className="mt-1 text-sm text-gray-500">
            {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'director') && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? '...' : 'CSV ექსპორტი'}
            </button>
          )}
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Users size={16} />
            თანამშრომლები
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="სულ თანამშრომლები" value={stats.totalEmployees} style={cardStyles[0]} />
        <StatCard label="წარმატებული" value={statusMap.passed || 0} style={cardStyles[1]} />
        <StatCard label="ჩაჭრილი" value={statusMap.failed || 0} style={cardStyles[2]} />
        <StatCard label="ვადაგასული" value={stats.expiredCount || 0} style={cardStyles[3]} />
      </div>

      {/* Compliance + Qualification row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ComplianceCard compliance={stats.compliance} />
        <QualificationCard
          distribution={stats.qualificationDistribution}
          totalEmployees={stats.totalEmployees}
        />
      </div>

      {/* Middle row: Department breakdown */}
      <DepartmentCard
        departments={stats.employeesByDepartment}
        totalEmployees={stats.totalEmployees}
      />

      {/* Exam tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ExamSection title="მოახლოებული გამოცდები" exams={stats.upcomingExams} variant="upcoming" />
        <ExamSection title="ვადაგასული გამოცდები" exams={stats.expiredExams} variant="expired" />
      </div>
    </div>
  );
}
