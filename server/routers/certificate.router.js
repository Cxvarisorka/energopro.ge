const express = require('express');
const Employee = require('../models/employee.model');
const Exam = require('../models/exam.model');
const { generateCertificatePDF } = require('../services/pdf.service');
const { protect } = require('../middleware/auth.middleware');
const AppError = require('../utils/appError.util');
const catchAsync = require('../utils/catchAsync.util');

const router = express.Router();

router.use(protect);

router.get('/:employeeId/:examId', catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.employeeId).lean();
  if (!employee) {
    throw new AppError('თანამშრომელი ვერ მოიძებნა', 404);
  }

  const exam = await Exam.findOne({
    _id: req.params.examId,
    employee: req.params.employeeId,
  }).lean();
  if (!exam) {
    throw new AppError('გამოცდა ვერ მოიძებნა', 404);
  }

  const pdfBuffer = await generateCertificatePDF(employee, exam, req.user);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=certificate-${employee.personalId}.pdf`,
    'Content-Length': pdfBuffer.length,
  });

  res.send(pdfBuffer);
}));

module.exports = router;
