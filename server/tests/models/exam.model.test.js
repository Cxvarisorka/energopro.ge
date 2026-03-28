const mongoose = require('mongoose');

describe('Exam Model Schema', () => {
  let Exam;

  beforeAll(() => {
    Exam = require('../../models/exam.model');
  });

  it('should have required schema fields', () => {
    const schema = Exam.schema.obj;
    expect(schema.employee.required).toBe(true);
    expect(schema.discipline.required[0]).toBe(true);
    expect(schema.examDate.required[0]).toBe(true);
    expect(schema.nextExamDate.required[0]).toBe(true);
    expect(schema.reason.required[0]).toBe(true);
    expect(schema.grade.required[0]).toBe(true);
  });

  it('should reference Employee model', () => {
    const schema = Exam.schema.obj;
    expect(schema.employee.ref).toBe('Employee');
    expect(schema.employee.type).toBe(mongoose.Schema.Types.ObjectId);
  });

  it('should have valid status enum', () => {
    const schema = Exam.schema.obj;
    expect(schema.status.enum).toEqual(['passed', 'failed', 'pending', 'expired']);
    expect(schema.status.default).toBe('passed');
  });

  it('should have employee field indexed', () => {
    const schema = Exam.schema.obj;
    expect(schema.employee.index).toBe(true);
  });

  it('should have compound index on discipline and examDate', () => {
    const indexes = Exam.schema.indexes();
    const compoundIndex = indexes.find((idx) =>
      idx[0].discipline === 1 && idx[0].examDate === -1
    );
    expect(compoundIndex).toBeDefined();
  });

  it('should have index on nextExamDate', () => {
    const indexes = Exam.schema.indexes();
    const dateIndex = indexes.find((idx) => idx[0].nextExamDate === 1);
    expect(dateIndex).toBeDefined();
  });

  it('should have optional notes field', () => {
    const schema = Exam.schema.obj;
    expect(schema.notes).toBeDefined();
    expect(schema.notes.required).toBeUndefined();
  });

  it('should have timestamps enabled', () => {
    expect(Exam.schema.options.timestamps).toBe(true);
  });
});
