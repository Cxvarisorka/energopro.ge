const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    discipline: {
      type: String,
      required: [true, 'Discipline is required'],
      trim: true,
      // Predefined options, but accepts any string for future extensibility
      // Common: UTS, TEJ, SUJ, PSDJ, Special Work, Medical Check
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    nextExamDate: {
      type: Date,
      required: [true, 'Next exam date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for exam is required'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade/result is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'pending', 'expired'],
      default: 'passed',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ discipline: 1, examDate: -1 });
examSchema.index({ nextExamDate: 1 });

module.exports = mongoose.model('Exam', examSchema);
