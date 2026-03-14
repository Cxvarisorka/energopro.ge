import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, Trash2, Plus, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

const STATUS_COLORS = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
  passed: 'წარმატებული',
  failed: 'ჩაჭრილი',
  pending: 'მოლოდინში',
  expired: 'ვადაგასული',
};

const PERMISSION_LABELS = {
  'Working at height': 'სიმაღლეზე მუშაობა',
  'Working on voltage node': 'ძაბვის კვანძზე მუშაობა',
  'Working on SIP wire under voltage': 'SIP სადენზე ძაბვის ქვეშ მუშაობა',
  'High voltage testing': 'მაღალი ძაბვის ტესტირება',
};

function ExamForm({ employeeId, exam, onSave, onCancel }) {
  const [form, setForm] = useState(
    exam || { discipline: '', examDate: '', nextExamDate: '', reason: '', grade: '', status: 'passed', notes: '' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (exam?._id) {
        await api.put(`/employees/${employeeId}/exams/${exam._id}`, form);
        toast.success('გამოცდა განახლებულია');
      } else {
        await api.post(`/employees/${employeeId}/exams`, form);
        toast.success('გამოცდა დამატებულია');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-blue-200 bg-blue-50/50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">დისციპლინა</label>
          <input value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">მიზეზი</label>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">გამოცდის თარიღი</label>
          <input type="date" value={form.examDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, examDate: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">შემდეგი გამოცდის თარიღი</label>
          <input type="date" value={form.nextExamDate?.slice(0, 10)} onChange={(e) => setForm({ ...form, nextExamDate: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">შეფასება</label>
          <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">სტატუსი</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">შენიშვნა</label>
        <input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? '...' : 'შენახვა'}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          გაუქმება
        </button>
      </div>
    </form>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const fetchData = async () => {
    try {
      const [empRes, examsRes] = await Promise.all([
        api.get(`/employees/${id}`),
        api.get(`/employees/${id}/exams`),
      ]);
      setEmployee(empRes.data);
      setExams(examsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('ნამდვილად წაშალოთ?')) return;
    await api.delete(`/employees/${id}`);
    toast.success('თანამშრომელი წაშლილია');
    navigate('/employees');
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('ნამდვილად წაშალოთ?')) return;
    await api.delete(`/employees/${id}/exams/${examId}`);
    toast.success('გამოცდა წაშლილია');
    fetchData();
  };

  const handleDownloadCert = async (examId) => {
    const res = await api.get(`/certificates/${id}/${examId}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${examId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExamSaved = () => {
    setShowForm(false);
    setEditingExam(null);
    fetchData();
  };

  if (loading) return <p className="text-sm text-gray-500">იტვირთება...</p>;
  if (!employee) return <p className="text-sm text-gray-500">თანამშრომელი ვერ მოიძებნა</p>;

  return (
    <div className="space-y-6">
      {/* Employee Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {employee.photo && (
              <img src={employee.photo} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20" />
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">{employee.fullName}</h2>
              <p className="text-sm text-gray-500">{employee.personalId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/employees/${id}/edit`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              რედაქტირება
            </Link>
            <button
              onClick={handleDelete}
              className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              წაშლა
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><span className="text-gray-500">დეპარტამენტი:</span> <span className="font-medium">{employee.department}</span></div>
          <div><span className="text-gray-500">თანამდებობა:</span> <span className="font-medium">{employee.position}</span></div>
          <div><span className="text-gray-500">სამუშაო ადგილი:</span> <span className="font-medium">{employee.workplace}</span></div>
          <div><span className="text-gray-500">კვალიფიკაციის ჯგუფი:</span> <span className="font-medium">{employee.qualificationGroup}</span></div>
          {employee.birthDate && <div><span className="text-gray-500">დაბადების თარიღი:</span> <span className="font-medium">{new Date(employee.birthDate).toLocaleDateString()}</span></div>}
        </div>

        {employee.specialPermissions?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {employee.specialPermissions.map((p) => (
              <span key={p} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {PERMISSION_LABELS[p] || p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Exams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">გამოცდები / სერტიფიკატები</h3>
          <button
            onClick={() => { setShowForm(true); setEditingExam(null); }}
            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} />
            გამოცდის დამატება
          </button>
        </div>

        {(showForm || editingExam) && (
          <ExamForm
            employeeId={id}
            exam={editingExam}
            onSave={handleExamSaved}
            onCancel={() => { setShowForm(false); setEditingExam(null); }}
          />
        )}

        {exams.length === 0 ? (
          <p className="text-sm text-gray-500">შედეგები არ მოიძებნა</p>
        ) : (
          <>
            {/* Desktop exam table */}
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">დისციპლინა</th>
                    <th className="px-4 py-2 font-medium text-gray-600">გამოცდის თარიღი</th>
                    <th className="px-4 py-2 font-medium text-gray-600">შემდეგი გამოცდა</th>
                    <th className="px-4 py-2 font-medium text-gray-600">შეფასება</th>
                    <th className="px-4 py-2 font-medium text-gray-600">სტატუსი</th>
                    <th className="px-4 py-2 font-medium text-gray-600">მოქმედებები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{exam.discipline}</td>
                      <td className="px-4 py-2">{new Date(exam.examDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(exam.nextExamDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{exam.grade}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[exam.status]}`}>
                          {STATUS_LABELS[exam.status]}
                        </span>
                      </td>
                      <td className="flex gap-1 px-4 py-2">
                        <button onClick={() => { setEditingExam(exam); setShowForm(false); }} className="rounded p-1 text-gray-500 hover:bg-gray-100" title="რედაქტირება">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteExam(exam._id)} className="rounded p-1 text-red-500 hover:bg-red-50" title="წაშლა">
                          <Trash2 size={14} />
                        </button>
                        <button onClick={() => handleDownloadCert(exam._id)} className="rounded p-1 text-blue-500 hover:bg-blue-50" title="სერტიფიკატი">
                          <FileDown size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile exam cards */}
            <div className="space-y-3 md:hidden">
              {exams.map((exam) => (
                <div key={exam._id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{exam.discipline}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[exam.status]}`}>
                      {STATUS_LABELS[exam.status]}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-500">
                    <span>გამოცდის თარიღი: <span className="text-gray-700">{new Date(exam.examDate).toLocaleDateString()}</span></span>
                    <span>შემდეგი: <span className="text-gray-700">{new Date(exam.nextExamDate).toLocaleDateString()}</span></span>
                    <span>შეფასება: <span className="text-gray-700">{exam.grade}</span></span>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                    <button onClick={() => { setEditingExam(exam); setShowForm(false); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                      <Pencil size={12} /> რედაქტირება
                    </button>
                    <button onClick={() => handleDeleteExam(exam._id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                      <Trash2 size={12} /> წაშლა
                    </button>
                    <button onClick={() => handleDownloadCert(exam._id)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                      <FileDown size={12} /> სერტიფიკატი
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
