const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    personalId: {
      type: String,
      required: [true, 'Personal ID number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    workplace: {
      type: String,
      required: [true, 'Workplace is required'],
      enum: [
        'სათაო - მაღალი ძაბვა',
        'სათაო - სადისპეტჩერო',
        'სათაო - აღრიცხვა',
        'სათაო - აუდიტი',
        'სათაო - საპროექტო',
        'სათაო - დაბალი ძაბვა',
        'სათაო - კომერციული',
        'ჰესები - ორთაჭალჰესი',
        'ჰესები - ზაჰესი',
        'ჰესები - ჩითახევჰესი',
        'ჰესები - სიონჰესი',
        'ჰესები - საცხენჰესი',
        'ჰესები - მარტყოფჰესი',
        'ჰესები - რიონჰესი',
        'ჰესები - გუნათჰესი',
        'ჰესები - ლაჯანურჰესი',
        'ჰესები - აწჰესი',
        'ჰესები - კინკიშა ჰესი',
        'ჰესები - ჩხორჰესი',
        'ჰესები - შაურჰესი',
        'ჰესები - ძევრულჰესი',
        'ფილიალები',
        'შრომის დაცვა',
      ],
    },
    qualificationGroup: {
      type: String,
      required: [true, 'Qualification group is required'],
      enum: ['I', 'II', 'III', 'IV', 'V'],
    },
    specialPermissions: [
      {
        type: String,
        trim: true,
      },
    ],
    birthDate: {
      type: Date,
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('exams', {
  ref: 'Exam',
  localField: '_id',
  foreignField: 'employee',
});

employeeSchema.index({ fullName: 'text', department: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
