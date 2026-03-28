const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const catchAsync = require('../utils/catchAsync.util');

const escapeCSV = (value) => {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Force Excel to treat value as text (prevents numeric personalId from losing leading zeros)
const forceText = (value) => {
  if (value == null) return '';
  return `="${String(value)}"`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const STATUS_LABELS_GE = {
  expired: 'ვადაგასული',
  upcoming: 'მოახლოებული',
  ok: 'მოქმედი',
  none: 'გამოცდები არ აქვს',
};

exports.exportEmployeesCSV = catchAsync(async (req, res) => {
  const employees = await Employee.find().sort({ fullName: 1 }).lean();

  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Get exam statuses for all employees
  const examStatuses = await Exam.aggregate([
    {
      $group: {
        _id: '$employee',
        totalExams: { $sum: 1 },
        passedExams: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } },
        hasExpired: { $max: { $cond: [{ $lt: ['$nextExamDate', now] }, 1, 0] } },
        hasUpcoming: {
          $max: {
            $cond: [
              { $and: [{ $gte: ['$nextExamDate', now] }, { $lte: ['$nextExamDate', thirtyDaysFromNow] }] },
              1,
              0,
            ],
          },
        },
        nearestExamDate: { $min: { $cond: [{ $gte: ['$nextExamDate', now] }, '$nextExamDate', null] } },
      },
    },
  ]);

  const statusMap = {};
  for (const s of examStatuses) {
    statusMap[s._id.toString()] = {
      totalExams: s.totalExams,
      passedExams: s.passedExams,
      examStatus: s.hasExpired ? 'expired' : s.hasUpcoming ? 'upcoming' : 'ok',
      nearestExamDate: s.nearestExamDate,
    };
  }

  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  const headers = [
    'პირადი ნომერი',
    'სახელი და გვარი',
    'დეპარტამენტი',
    'თანამდებობა',
    'სამუშაო ადგილი',
    'კვალიფიკაციის ჯგუფი',
    'დაბადების თარიღი',
    'სპეციალური ნებართვები',
    'გამოცდის სტატუსი',
    'სულ გამოცდები',
    'წარმატებული გამოცდები',
    'უახლოესი გამოცდის თარიღი',
  ];

  const rows = employees.map((emp) => {
    const status = statusMap[emp._id.toString()] || { totalExams: 0, passedExams: 0, examStatus: 'none', nearestExamDate: null };
    return [
      forceText(emp.personalId),
      escapeCSV(emp.fullName),
      escapeCSV(emp.department),
      escapeCSV(emp.position),
      escapeCSV(emp.workplace),
      escapeCSV(emp.qualificationGroup),
      formatDate(emp.birthDate),
      escapeCSV((emp.specialPermissions || []).join('; ')),
      escapeCSV(STATUS_LABELS_GE[status.examStatus] || status.examStatus),
      status.totalExams,
      status.passedExams,
      formatDate(status.nearestExamDate),
    ].join(',');
  });

  const csv = BOM + headers.map(escapeCSV).join(',') + '\n' + rows.join('\n');

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename=employees-${new Date().toISOString().slice(0, 10)}.csv`,
  });

  res.send(csv);
});
