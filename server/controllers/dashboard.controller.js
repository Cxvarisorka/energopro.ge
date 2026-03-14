const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const catchAsync = require('../utils/catchAsync.util');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

exports.getStats = catchAsync(async (req, res) => {
  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + THIRTY_DAYS_MS);

  const [totalEmployees, employeesByDepartment, examsByStatus, expiredCount, upcomingExams, expiredExams] =
    await Promise.all([
      Employee.countDocuments(),

      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Exam.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Exam.countDocuments({ nextExamDate: { $lt: now } }),

      Exam.find({ nextExamDate: { $gte: now, $lte: thirtyDaysLater } })
        .populate('employee', 'fullName personalId department')
        .sort({ nextExamDate: 1 })
        .limit(20)
        .lean(),

      Exam.find({ nextExamDate: { $lt: now } })
        .populate('employee', 'fullName personalId department')
        .sort({ nextExamDate: -1 })
        .limit(20)
        .lean(),
    ]);

  res.json({
    totalEmployees,
    employeesByDepartment,
    examsByStatus,
    expiredCount,
    upcomingExams,
    expiredExams,
  });
});
