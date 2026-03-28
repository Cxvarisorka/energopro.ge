const bcrypt = require('bcryptjs');

// Test the model schema and logic without a database
describe('User Model Schema', () => {
  let User;

  beforeAll(() => {
    // Require after mongoose may have been set up
    User = require('../../models/user.model');
  });

  it('should have required schema fields', () => {
    const schema = User.schema.obj;
    expect(schema.email).toBeDefined();
    expect(schema.email.required).toBeTruthy();
    expect(schema.email.unique).toBe(true);
    expect(schema.password).toBeDefined();
    expect(schema.password.required).toBeTruthy();
    expect(schema.fullName).toBeDefined();
    expect(schema.fullName.required).toBeTruthy();
  });

  it('should have role enum with valid values', () => {
    const schema = User.schema.obj;
    expect(schema.role.enum).toEqual(['admin', 'director', 'viewer']);
    expect(schema.role.default).toBe('viewer');
  });

  it('should enforce minimum password length', () => {
    const schema = User.schema.obj;
    expect(schema.password.minlength).toBe(6);
  });

  it('should have password select set to false', () => {
    const schema = User.schema.obj;
    expect(schema.password.select).toBe(false);
  });

  it('should have email set to lowercase', () => {
    const schema = User.schema.obj;
    expect(schema.email.lowercase).toBe(true);
  });

  it('should have timestamps enabled', () => {
    expect(User.schema.options.timestamps).toBe(true);
  });

  it('should have a pre-save hook for password hashing', () => {
    const hooks = User.schema.s.hooks._pres.get('save');
    expect(hooks).toBeDefined();
    expect(hooks.length).toBeGreaterThan(0);
  });

  it('should have comparePassword method', () => {
    expect(User.schema.methods.comparePassword).toBeDefined();
    expect(typeof User.schema.methods.comparePassword).toBe('function');
  });

  it('should have toJSON method', () => {
    expect(User.schema.methods.toJSON).toBeDefined();
    expect(typeof User.schema.methods.toJSON).toBe('function');
  });
});

describe('Password Hashing', () => {
  it('bcrypt should hash and compare correctly', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrongPassword', hash)).toBe(false);
  });
});
