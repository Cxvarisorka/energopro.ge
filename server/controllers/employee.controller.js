const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const AppError = require('../utils/appError.util');
const catchAsync = require('../utils/catchAsync.util');
const { removeFromCloudinary } = require('../configs/cloudinary.config');

exports.getDepartments = catchAsync(async (req, res) => {
  const departments = await Employee.distinct('department');
  res.json(departments.filter(Boolean).sort());
});

exports.createEmployee = catchAsync(async (req, res) => {
  const { personalId, fullName, department, position, workplace, qualificationGroup, specialPermissions, birthDate } = req.body;
  const employeeData = { personalId, fullName, department, position, workplace, qualificationGroup, birthDate };

  if (req.file) {
    employeeData.photo = req.file.path;
  }

  if (typeof specialPermissions === 'string') {
    try {
      employeeData.specialPermissions = JSON.parse(specialPermissions);
    } catch {
      throw new AppError('Invalid specialPermissions format', 400);
    }
  } else if (Array.isArray(specialPermissions)) {
    employeeData.specialPermissions = specialPermissions;
  }

  const employee = await Employee.create(employeeData);
  res.status(201).json(employee);
});

exports.getEmployees = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, department, workplace, qualificationGroup, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const sanitizedPage = Math.max(1, Math.floor(Number(page)) || 1);
  const sanitizedLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 20));

  const allowedSortFields = ['personalId', 'fullName', 'department', 'position', 'createdAt'];
  const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const filter = {};

  if (department) filter.department = String(department);
  if (workplace) filter.workplace = String(workplace);
  if (qualificationGroup) filter.qualificationGroup = String(qualificationGroup);

  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { personalId: regex },
      { fullName: regex },
      { department: regex },
      { position: regex },
    ];
  }

  const skip = (sanitizedPage - 1) * sanitizedLimit;
  const sort = { [sanitizedSortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [employees, total] = await Promise.all([
    Employee.find(filter).sort(sort).skip(skip).limit(sanitizedLimit).lean(),
    Employee.countDocuments(filter),
  ]);

  // Aggregate exam status per employee in a single query
  const employeeIds = employees.map((e) => e._id);
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const examStatuses = await Exam.aggregate([
    { $match: { employee: { $in: employeeIds } } },
    {
      $group: {
        _id: '$employee',
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
      },
    },
  ]);

  const statusMap = {};
  for (const s of examStatuses) {
    statusMap[s._id.toString()] = s.hasExpired ? 'expired' : s.hasUpcoming ? 'upcoming' : 'ok';
  }

  const enriched = employees.map((emp) => ({
    ...emp,
    examStatus: statusMap[emp._id.toString()] || 'none',
  }));

  res.json({
    employees: enriched,
    total,
    page: sanitizedPage,
    pages: Math.ceil(total / sanitizedLimit),
  });
});

exports.searchByPersonalId = catchAsync(async (req, res) => {
  const { personalId } = req.query;
  if (!personalId || typeof personalId !== 'string') {
    throw new AppError('personalId query parameter is required', 400);
  }

  const employee = await Employee.findOne({ personalId: String(personalId).trim() }).populate('exams').lean();
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  res.json(employee);
});

exports.getEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('exams').lean();
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }
  res.json(employee);
});

exports.updateEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const { personalId, fullName, department, position, workplace, qualificationGroup, specialPermissions, birthDate } = req.body;
  const updateData = {};
  if (personalId !== undefined) updateData.personalId = personalId;
  if (fullName !== undefined) updateData.fullName = fullName;
  if (department !== undefined) updateData.department = department;
  if (position !== undefined) updateData.position = position;
  if (workplace !== undefined) updateData.workplace = workplace;
  if (qualificationGroup !== undefined) updateData.qualificationGroup = qualificationGroup;
  if (birthDate !== undefined) updateData.birthDate = birthDate;

  if (req.file) {
    await removeFromCloudinary(employee.photo);
    updateData.photo = req.file.path;
  }

  if (typeof specialPermissions === 'string') {
    try {
      updateData.specialPermissions = JSON.parse(specialPermissions);
    } catch {
      throw new AppError('Invalid specialPermissions format', 400);
    }
  } else if (Array.isArray(specialPermissions)) {
    updateData.specialPermissions = specialPermissions;
  }

  const updated = await Employee.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json(updated);
});

exports.deleteEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  await removeFromCloudinary(employee.photo);
  await Exam.deleteMany({ employee: employee._id });
  await employee.deleteOne();

  res.json({ message: 'Employee and related exams deleted' });
});
