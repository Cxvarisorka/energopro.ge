import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../api';

const EXAM_STATUS_ROW_CLASS = {
  expired: 'bg-red-50',
  upcoming: 'bg-orange-50',
  none: '',
  ok: '',
};

const EXAM_STATUS_BADGE = {
  expired: 'bg-red-100 text-red-700',
  upcoming: 'bg-orange-100 text-orange-700',
  none: 'bg-gray-100 text-gray-500',
  ok: 'bg-green-100 text-green-700',
};

const EXAM_STATUS_LABEL = {
  expired: 'გამოცდა ვადაგასული',
  upcoming: 'გამოცდა მალე',
  none: 'გამოცდები არ აქვს',
  ok: 'გამოცდები OK',
};

const WORKPLACE_STRUCTURE = [
  {
    category: 'სათაო',
    children: ['მაღალი ძაბვა', 'სადისპეტჩერო', 'აღრიცხვა', 'აუდიტი', 'საპროექტო', 'დაბალი ძაბვა', 'კომერციული'],
  },
  {
    category: 'ჰესები',
    children: [
      'ორთაჭალჰესი', 'ზაჰესი', 'ჩითახევჰესი', 'სიონჰესი', 'საცხენჰესი',
      'მარტყოფჰესი', 'რიონჰესი', 'გუნათჰესი', 'ლაჯანურჰესი', 'აწჰესი',
      'კინკიშა ჰესი', 'ჩხორჰესი', 'შაურჰესი', 'ძევრულჰესი',
    ],
  },
  {
    category: 'ფილიალები',
    children: [],
  },
  {
    category: 'შრომის დაცვა',
    children: [],
  },
];

const QUALIFICATION_GROUPS = ['I', 'II', 'III', 'IV', 'V'];

export default function EmployeeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [qualificationGroup, setQualificationGroup] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [departments, setDepartments] = useState([]);
  const debounceRef = useRef(null);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    api.get('/employees/departments').then((res) => setDepartments(res.data)).catch(() => {});
  }, []);

  const fetchEmployees = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await api.get('/employees', { params });
      setEmployees(res.data.employees);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = { page, limit: 15, sortBy, sortOrder };
    if (search.trim()) params.search = search.trim();
    if (department) params.department = department;
    if (workplace) params.workplace = workplace;
    if (qualificationGroup) params.qualificationGroup = qualificationGroup;
    fetchEmployees(params);
  }, [page, sortBy, sortOrder, department, workplace, qualificationGroup, fetchEmployees]);

  // Debounced search - triggers on typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = { page: 1, limit: 15, sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (department) params.department = department;
      if (workplace) params.workplace = workplace;
      if (qualificationGroup) params.qualificationGroup = qualificationGroup;
      if (page !== 1) {
        setSearchParams({ page: 1 });
      } else {
        fetchEmployees(params);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />;
  };

  const filteredEmployees = examStatusFilter
    ? employees.filter((emp) => {
        if (examStatusFilter === 'ok') return emp.examStatus !== 'expired' && emp.examStatus !== 'upcoming' && emp.examStatus !== 'none';
        return emp.examStatus === examStatusFilter;
      })
    : employees;

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">თანამშრომლები</h2>
        <Link
          to="/employees/new"
          className="flex shrink-0 items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          დამატება
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ძიება სახელით, ID, დეპარტამენტით..."
          className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass}>
          <option value="">დეპარტამენტი: ყველა</option>
          {departments.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

        <select value={workplace} onChange={(e) => setWorkplace(e.target.value)} className={inputClass}>
          <option value="">სამუშაო ადგილი: ყველა</option>
          {WORKPLACE_STRUCTURE.map((g) =>
            g.children.length === 0 ? (
              <option key={g.category} value={g.category}>{g.category}</option>
            ) : (
              <optgroup key={g.category} label={g.category}>
                {g.children.map((child) => (
                  <option key={child} value={`${g.category} - ${child}`}>{child}</option>
                ))}
              </optgroup>
            )
          )}
        </select>

        <select value={qualificationGroup} onChange={(e) => setQualificationGroup(e.target.value)} className={inputClass}>
          <option value="">კვალიფიკაცია: ყველა</option>
          {QUALIFICATION_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={examStatusFilter} onChange={(e) => setExamStatusFilter(e.target.value)} className={inputClass}>
          <option value="">გამოცდის სტატუსი: ყველა</option>
          <option value="expired">გამოცდა ვადაგასული</option>
          <option value="upcoming">გამოცდა მალე</option>
          <option value="ok">გამოცდები OK</option>
          <option value="none">გამოცდები არ აქვს</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">იტვირთება...</p>
      ) : filteredEmployees.length === 0 ? (
        <p className="text-sm text-gray-500">შედეგები არ მოიძებნა</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="cursor-pointer px-4 py-3 font-medium text-gray-600 select-none" onClick={() => handleSort('personalId')}>
                    პირადი ნომერი <SortIcon field="personalId" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 font-medium text-gray-600 select-none" onClick={() => handleSort('fullName')}>
                    სახელი და გვარი <SortIcon field="fullName" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 font-medium text-gray-600 select-none" onClick={() => handleSort('department')}>
                    დეპარტამენტი <SortIcon field="department" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 font-medium text-gray-600 select-none" onClick={() => handleSort('position')}>
                    თანამდებობა <SortIcon field="position" />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    კვალიფიკაცია
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    გამოცდის სტატუსი
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className={`hover:bg-gray-50 ${EXAM_STATUS_ROW_CLASS[emp.examStatus] || ''}`}>
                    <td className="px-4 py-3">
                      <Link to={`/employees/${emp._id}`} className="font-medium text-blue-600 hover:underline">
                        {emp.personalId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{emp.fullName}</td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">{emp.position}</td>
                    <td className="px-4 py-3">{emp.qualificationGroup}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EXAM_STATUS_BADGE[emp.examStatus] || EXAM_STATUS_BADGE.ok}`}>
                        {EXAM_STATUS_LABEL[emp.examStatus] || EXAM_STATUS_LABEL.ok}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {filteredEmployees.map((emp) => (
              <Link
                key={emp._id}
                to={`/employees/${emp._id}`}
                className={`block rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 ${EXAM_STATUS_ROW_CLASS[emp.examStatus] || ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{emp.fullName}</p>
                    <p className="text-xs text-blue-600">{emp.personalId}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight ${EXAM_STATUS_BADGE[emp.examStatus] || EXAM_STATUS_BADGE.ok}`}>
                    {EXAM_STATUS_LABEL[emp.examStatus] || EXAM_STATUS_LABEL.ok}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-0.5 text-xs text-gray-500">
                  <span>დეპარტამენტი: <span className="text-gray-700">{emp.department}</span></span>
                  <span>თანამდებობა: <span className="text-gray-700">{emp.position}</span></span>
                  {emp.qualificationGroup && (
                    <span>კვალიფიკაცია: <span className="text-gray-700">{emp.qualificationGroup}</span></span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>გვერდი {page} / {pages} ({total})</span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setSearchParams({ page: page - 1 })}
                  className="rounded border border-gray-300 p-1 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setSearchParams({ page: page + 1 })}
                  className="rounded border border-gray-300 p-1 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
