import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';

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

const getCategoryFromWorkplace = (workplace) => {
  if (!workplace) return '';
  for (const { category, children } of WORKPLACE_STRUCTURE) {
    if (children.length === 0 && workplace === category) return category;
    if (children.some((child) => workplace === `${category} - ${child}`)) return category;
  }
  return '';
};

const getSubFromWorkplace = (workplace) => {
  if (!workplace) return '';
  const dashIndex = workplace.indexOf(' - ');
  return dashIndex !== -1 ? workplace.slice(dashIndex + 3) : '';
};

const QUALIFICATION_GROUPS = ['I', 'II', 'III', 'IV', 'V'];

const SPECIAL_PERMISSIONS = [
  { key: 'Working at height', label: 'სიმაღლეზე მუშაობა' },
  { key: 'Working on voltage node', label: 'ძაბვის კვანძზე მუშაობა' },
  { key: 'Working on SIP wire under voltage', label: 'SIP სადენზე ძაბვის ქვეშ მუშაობა' },
  { key: 'High voltage testing', label: 'მაღალი ძაბვის ტესტირება' },
];

const PERMISSION_LABELS = Object.fromEntries(SPECIAL_PERMISSIONS.map((p) => [p.key, p.label]));

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    personalId: '',
    fullName: '',
    department: '',
    position: '',
    workplace: '',
    qualificationGroup: 'I',
    specialPermissions: [],
    birthDate: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPermission, setCustomPermission] = useState('');
  const [workplaceCategory, setWorkplaceCategory] = useState('');
  const [workplaceSub, setWorkplaceSub] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/employees/${id}`).then((res) => {
      const { personalId, fullName, department, position, workplace, qualificationGroup, specialPermissions, birthDate } = res.data;
      setForm({ personalId, fullName, department, position, workplace, qualificationGroup, specialPermissions: specialPermissions || [], birthDate: birthDate ? birthDate.slice(0, 10) : '' });
      setWorkplaceCategory(getCategoryFromWorkplace(workplace));
      setWorkplaceSub(getSubFromWorkplace(workplace));
    });
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      specialPermissions: prev.specialPermissions.includes(perm)
        ? prev.specialPermissions.filter((p) => p !== perm)
        : [...prev.specialPermissions, perm],
    }));
  };

  const addCustomPermission = () => {
    const trimmed = customPermission.trim();
    if (trimmed && !form.specialPermissions.includes(trimmed)) {
      setForm((prev) => ({ ...prev, specialPermissions: [...prev.specialPermissions, trimmed] }));
    }
    setCustomPermission('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'specialPermissions') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    if (photo) formData.append('photo', photo);

    try {
      if (isEdit) {
        await api.put(`/employees/${id}`, formData);
        toast.success('თანამშრომელი განახლებულია');
      } else {
        await api.post('/employees', formData);
        toast.success('თანამშრომელი დამატებულია');
      }
      navigate('/employees');
    } catch (err) {
      toast.error(err.response?.data?.message || 'შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        {isEdit ? 'რედაქტირება' : 'დამატება'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">პირადი ნომერი</label>
            <input name="personalId" value={form.personalId} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">სახელი და გვარი</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">დეპარტამენტი</label>
            <input name="department" value={form.department} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">თანამდებობა</label>
            <input name="position" value={form.position} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">სამუშაო ადგილი</label>
            <select
              value={workplaceCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setWorkplaceCategory(cat);
                const group = WORKPLACE_STRUCTURE.find((g) => g.category === cat);
                if (!group || group.children.length === 0) {
                  setWorkplaceSub('');
                  setForm((prev) => ({ ...prev, workplace: cat }));
                } else {
                  const firstChild = group.children[0];
                  setWorkplaceSub(firstChild);
                  setForm((prev) => ({ ...prev, workplace: `${cat} - ${firstChild}` }));
                }
              }}
              className={inputClass}
            >
              <option value="">აირჩიეთ სამუშაო ადგილი</option>
              {WORKPLACE_STRUCTURE.map((g) => (
                <option key={g.category} value={g.category}>{g.category}</option>
              ))}
            </select>
            {workplaceCategory && WORKPLACE_STRUCTURE.find((g) => g.category === workplaceCategory)?.children.length > 0 && (
              <select
                value={workplaceSub}
                onChange={(e) => {
                  const sub = e.target.value;
                  setWorkplaceSub(sub);
                  setForm((prev) => ({ ...prev, workplace: `${workplaceCategory} - ${sub}` }));
                }}
                className={`${inputClass} mt-2`}
              >
                {WORKPLACE_STRUCTURE.find((g) => g.category === workplaceCategory).children.map((child) => (
                  <option key={child} value={child}>{child}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">კვალიფიკაციის ჯგუფი</label>
            <select name="qualificationGroup" value={form.qualificationGroup} onChange={handleChange} className={inputClass}>
              {QUALIFICATION_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">დაბადების თარიღი</label>
            <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">სპეციალური ნებართვები</label>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_PERMISSIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePermission(key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  form.specialPermissions.includes(key)
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
            {form.specialPermissions
              .filter((p) => !SPECIAL_PERMISSIONS.some((sp) => sp.key === p))
              .map((perm) => (
                <button
                  key={perm}
                  type="button"
                  onClick={() => togglePermission(perm)}
                  className="rounded-full border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors"
                >
                  {perm} ×
                </button>
              ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={customPermission}
              onChange={(e) => setCustomPermission(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomPermission(); } }}
              placeholder="დაამატეთ ნებართვა..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={addCustomPermission}
              className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ფოტო</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : 'შენახვა'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            გაუქმება
          </button>
        </div>
      </form>
    </div>
  );
}
