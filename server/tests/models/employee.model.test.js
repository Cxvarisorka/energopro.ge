describe('Employee Model Schema', () => {
  let Employee;

  beforeAll(() => {
    Employee = require('../../models/employee.model');
  });

  it('should have required schema fields', () => {
    const schema = Employee.schema.obj;
    expect(schema.personalId.required[0]).toBe(true);
    expect(schema.personalId.unique).toBe(true);
    expect(schema.fullName.required[0]).toBe(true);
    expect(schema.department.required[0]).toBe(true);
    expect(schema.position.required[0]).toBe(true);
    expect(schema.workplace.required[0]).toBe(true);
    expect(schema.qualificationGroup.required[0]).toBe(true);
  });

  it('should have valid qualification group enum', () => {
    const schema = Employee.schema.obj;
    expect(schema.qualificationGroup.enum).toEqual(['I', 'II', 'III', 'IV', 'V']);
  });

  it('should have workplace enum with all locations', () => {
    const schema = Employee.schema.obj;
    expect(schema.workplace.enum).toBeDefined();
    expect(schema.workplace.enum.length).toBe(23);
    expect(schema.workplace.enum).toContain('სათაო - მაღალი ძაბვა');
    expect(schema.workplace.enum).toContain('ჰესები - ზაჰესი');
    expect(schema.workplace.enum).toContain('ფილიალები');
    expect(schema.workplace.enum).toContain('შრომის დაცვა');
  });

  it('should have specialPermissions as array of strings', () => {
    const schema = Employee.schema.obj;
    expect(Array.isArray(schema.specialPermissions)).toBe(true);
    expect(schema.specialPermissions[0].type).toBe(String);
  });

  it('should have photo field with null default', () => {
    const schema = Employee.schema.obj;
    expect(schema.photo).toBeDefined();
    expect(schema.photo.default).toBeNull();
  });

  it('should have birthDate field with null default', () => {
    const schema = Employee.schema.obj;
    expect(schema.birthDate.default).toBeNull();
  });

  it('should have timestamps enabled', () => {
    expect(Employee.schema.options.timestamps).toBe(true);
  });

  it('should have virtuals for JSON and Object', () => {
    expect(Employee.schema.options.toJSON.virtuals).toBe(true);
    expect(Employee.schema.options.toObject.virtuals).toBe(true);
  });

  it('should have exams virtual field', () => {
    const virtuals = Employee.schema.virtuals;
    expect(virtuals.exams).toBeDefined();
  });

  it('should have text index on fullName and department', () => {
    const indexes = Employee.schema.indexes();
    const textIndex = indexes.find((idx) =>
      idx[0].fullName === 'text' && idx[0].department === 'text'
    );
    expect(textIndex).toBeDefined();
  });

  it('should have unique index on personalId', () => {
    const schema = Employee.schema.obj;
    expect(schema.personalId.index).toBe(true);
    expect(schema.personalId.unique).toBe(true);
  });
});
