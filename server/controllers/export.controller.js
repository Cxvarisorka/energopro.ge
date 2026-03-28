const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const catchAsync = require('../utils/catchAsync.util');

const escapeCSV = (value) => {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
    'Personal ID',
    'Full Name',
    'Department',
    'Position',
    'Workplace',
    'Qualification Group',
    'Birth Date',
    'Special Permissions',
    'Exam Status',
    'Total Exams',
    'Passed Exams',
    'Nearest Exam Date',
  ];

  const rows = employees.map((emp) => {
    const status = statusMap[emp._id.toString()] || { totalExams: 0, passedExams: 0, examStatus: 'none', nearestExamDate: null };
    return [
      emp.personalId,
      emp.fullName,
      emp.department,
      emp.position,
      emp.workplace,
      emp.qualificationGroup,
      emp.birthDate ? new Date(emp.birthDate).toISOString().slice(0, 10) : '',
      (emp.specialPermissions || []).join('; '),
      status.examStatus,
      status.totalExams,
      status.passedExams,
      status.nearestExamDate ? new Date(status.nearestExamDate).toISOString().slice(0, 10) : '',
    ].map(escapeCSV).join(',');
  });

  const csv = BOM + headers.join(',') + '\n' + rows.join('\n');

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename=employees-${new Date().toISOString().slice(0, 10)}.csv`,
  });

  res.send(csv);
});
