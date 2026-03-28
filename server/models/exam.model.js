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
      required: [true, 'დისციპლინა აუცილებელია'],
      trim: true,
      // Predefined options, but accepts any string for future extensibility
      // Common: UTS, TEJ, SUJ, PSDJ, Special Work, Medical Check
    },
    examDate: {
      type: Date,
      required: [true, 'გამოცდის თარიღი აუცილებელია'],
    },
    nextExamDate: {
      type: Date,
      required: [true, 'შემდეგი გამოცდის თარიღი აუცილებელია'],
    },
    reason: {
      type: String,
      required: [true, 'გამოცდის მიზეზი აუცილებელია'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'შეფასება აუცილებელია'],
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
