const Exam = require('../models/exam.model');
const Employee = require('../models/employee.model');
const AppError = require('../utils/appError.util');
const catchAsync = require('../utils/catchAsync.util');

exports.addExam = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id).lean();
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const { discipline, examDate, nextExamDate, reason, grade, status, notes } = req.body;
  const exam = await Exam.create({
    discipline, examDate, nextExamDate, reason, grade, status, notes,
    employee: req.params.id,
  });

  res.status(201).json(exam);
});

exports.getExams = catchAsync(async (req, res) => {
  const { discipline, startDate, endDate, status } = req.query;
  const filter = { employee: req.params.id };

  if (discipline) filter.discipline = discipline;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.examDate = {};
    if (startDate) filter.examDate.$gte = new Date(startDate);
    if (endDate) filter.examDate.$lte = new Date(endDate);
  }

  const exams = await Exam.find(filter).sort({ examDate: -1 }).lean();
  res.json(exams);
});

exports.updateExam = catchAsync(async (req, res) => {
  const { discipline, examDate, nextExamDate, reason, grade, status, notes } = req.body;
  const updateData = {};
  if (discipline !== undefined) updateData.discipline = discipline;
  if (examDate !== undefined) updateData.examDate = examDate;
  if (nextExamDate !== undefined) updateData.nextExamDate = nextExamDate;
  if (reason !== undefined) updateData.reason = reason;
  if (grade !== undefined) updateData.grade = grade;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.examId, employee: req.params.id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  res.json(exam);
});

exports.deleteExam = catchAsync(async (req, res) => {
  const exam = await Exam.findOneAndDelete({
    _id: req.params.examId,
    employee: req.params.id,
  });

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  res.json({ message: 'Exam deleted' });
});
