const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const catchAsync = require('../utils/catchAsync.util');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

exports.getStats = catchAsync(async (req, res) => {
  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + THIRTY_DAYS_MS);

  const upcomingLimit = Math.min(Math.max(Number(req.query.upcomingLimit) || 50, 1), 200);
  const expiredLimit = Math.min(Math.max(Number(req.query.expiredLimit) || 50, 1), 200);

  const [
    totalEmployees,
    employeesByDepartment,
    examsByStatus,
    expiredCount,
    upcomingExams,
    expiredExams,
    qualificationDistribution,
    complianceStats,
  ] = await Promise.all([
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
      .populate('employee', 'fullName personalId department workplace')
      .sort({ nextExamDate: 1 })
      .limit(upcomingLimit)
      .lean(),

    Exam.find({ nextExamDate: { $lt: now } })
      .populate('employee', 'fullName personalId department workplace')
      .sort({ nextExamDate: -1 })
      .limit(expiredLimit)
      .lean(),

    Employee.aggregate([
      { $group: { _id: '$qualificationGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // Compliance: employees with at least one non-expired exam vs total
    Exam.aggregate([
      {
        $group: {
          _id: '$employee',
          hasExpired: { $max: { $cond: [{ $lt: ['$nextExamDate', now] }, 1, 0] } },
          hasValid: { $max: { $cond: [{ $gte: ['$nextExamDate', now] }, 1, 0] } },
        },
      },
      {
        $group: {
          _id: null,
          totalWithExams: { $sum: 1 },
          fullyCompliant: { $sum: { $cond: [{ $and: [{ $eq: ['$hasExpired', 0] }, { $eq: ['$hasValid', 1] }] }, 1, 0] } },
          withExpired: { $sum: '$hasExpired' },
        },
      },
    ]),
  ]);

  const compliance = complianceStats[0] || { totalWithExams: 0, fullyCompliant: 0, withExpired: 0 };

  res.json({
    totalEmployees,
    employeesByDepartment,
    examsByStatus,
    expiredCount,
    upcomingExams,
    expiredExams,
    qualificationDistribution,
    compliance: {
      totalWithExams: compliance.totalWithExams,
      fullyCompliant: compliance.fullyCompliant,
      withExpired: compliance.withExpired,
      complianceRate: compliance.totalWithExams > 0
        ? Math.round((compliance.fullyCompliant / compliance.totalWithExams) * 100)
        : 0,
    },
  });
});
