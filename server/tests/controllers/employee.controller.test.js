jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

jest.mock('../../utils/cache.util', () => ({
  cache: { get: jest.fn(), set: jest.fn(), del: jest.fn(), keys: jest.fn().mockReturnValue([]), flushAll: jest.fn() },
  cacheMiddleware: () => (req, res, next) => next(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn(),
}));

jest.mock('../../configs/cloudinary.config', () => ({
  upload: { single: () => (req, res, next) => next() },
  removeFromCloudinary: jest.fn().mockResolvedValue(undefined),
}));

// Mock Employee model
const mockEmployeeFind = jest.fn();
const mockEmployeeCountDocuments = jest.fn();
const mockEmployeeDistinct = jest.fn();
const mockEmployeeFindOne = jest.fn();
const mockEmployeeFindById = jest.fn();
const mockEmployeeCreate = jest.fn();
const mockEmployeeFindByIdAndUpdate = jest.fn();

const makeChain = (data) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(data),
});

jest.mock('../../models/employee.model', () => ({
  find: (...args) => { mockEmployeeFind(...args); return makeChain(mockEmployeeFind._data || []); },
  countDocuments: (...args) => mockEmployeeCountDocuments(...args),
  distinct: (...args) => mockEmployeeDistinct(...args),
  findOne: (...args) => { mockEmployeeFindOne(...args); return makeChain(mockEmployeeFindOne._data || null); },
  findById: (...args) => { mockEmployeeFindById(...args); return makeChain(mockEmployeeFindById._data || null); },
  create: (...args) => mockEmployeeCreate(...args),
  findByIdAndUpdate: (...args) => mockEmployeeFindByIdAndUpdate(...args),
}));

// Mock Exam model
const mockExamAggregate = jest.fn().mockResolvedValue([]);
const mockExamDistinct = jest.fn().mockResolvedValue([]);
const mockExamDeleteMany = jest.fn().mockResolvedValue({});

jest.mock('../../models/exam.model', () => ({
  aggregate: (...args) => mockExamAggregate(...args),
  distinct: (...args) => mockExamDistinct(...args),
  deleteMany: (...args) => mockExamDeleteMany(...args),
}));

const employeeController = require('../../controllers/employee.controller');
const { invalidate } = require('../../utils/cache.util');

describe('Employee Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmployeeFind._data = [];
    mockEmployeeFindById._data = null;
    mockEmployeeFindOne._data = null;
    mockEmployeeCountDocuments.mockResolvedValue(0);
    mockExamAggregate.mockResolvedValue([]);
    mockExamDistinct.mockResolvedValue([]);
  });

  describe('getEmployees', () => {
    it('should return paginated results', async () => {
      mockEmployeeFind._data = [{ _id: 'e1' }, { _id: 'e2' }];
      mockEmployeeCountDocuments.mockResolvedValue(50);

      const req = { query: { page: '1', limit: '15' } };
      let responseData;
      const res = { json: (data) => { responseData = data; } };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(responseData.total).toBe(50);
      expect(responseData.page).toBe(1);
      expect(responseData.pages).toBe(4);
    });

    it('should sanitize page to minimum 1', async () => {
      mockEmployeeFind._data = [];
      mockEmployeeCountDocuments.mockResolvedValue(10);

      const req = { query: { page: '-5', limit: '15' } };
      let responseData;
      const res = { json: (data) => { responseData = data; } };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(responseData.page).toBe(1);
    });

    it('should apply department filter', async () => {
      mockEmployeeFind._data = [];
      mockEmployeeCountDocuments.mockResolvedValue(5);

      const req = { query: { department: 'Engineering' } };
      const res = { json: jest.fn() };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(mockEmployeeFind).toHaveBeenCalledWith(expect.objectContaining({
        department: 'Engineering',
      }));
    });

    it('should apply search filter', async () => {
      mockEmployeeFind._data = [];
      mockEmployeeCountDocuments.mockResolvedValue(1);

      const req = { query: { search: 'John' } };
      const res = { json: jest.fn() };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(mockEmployeeFind).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.any(Array),
      }));
    });

    it('should apply server-side examStatus filter for none', async () => {
      mockExamDistinct.mockResolvedValue(['id1', 'id2']);
      mockEmployeeFind._data = [];
      mockEmployeeCountDocuments.mockResolvedValue(3);

      const req = { query: { examStatus: 'none' } };
      const res = { json: jest.fn() };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(mockExamDistinct).toHaveBeenCalledWith('employee');
    });

    it('should enrich with exam status', async () => {
      mockEmployeeFind._data = [
        { _id: 'emp1', fullName: 'A' },
        { _id: 'emp2', fullName: 'B' },
      ];
      mockEmployeeCountDocuments.mockResolvedValue(2);
      mockExamAggregate.mockResolvedValue([
        { _id: 'emp1', hasExpired: 1, hasUpcoming: 0 },
      ]);

      const req = { query: {} };
      let responseData;
      const res = { json: (data) => { responseData = data; } };

      await employeeController.getEmployees(req, res, jest.fn());

      expect(responseData.employees[0].examStatus).toBe('expired');
      expect(responseData.employees[1].examStatus).toBe('none');
    });
  });

  describe('getDepartments', () => {
    it('should return sorted unique departments', async () => {
      mockEmployeeDistinct.mockResolvedValue(['Zulu', 'Alpha', null, 'Beta']);

      let responseData;
      const res = { json: (data) => { responseData = data; } };

      await employeeController.getDepartments({}, res, jest.fn());

      expect(responseData).toEqual(['Alpha', 'Beta', 'Zulu']);
    });
  });

  describe('createEmployee', () => {
    it('should create employee and invalidate cache', async () => {
      mockEmployeeCreate.mockResolvedValue({ _id: 'new1', fullName: 'Worker' });

      const req = {
        body: {
          personalId: 'P001', fullName: 'Worker',
          department: 'Ops', position: 'Tech',
          workplace: 'ფილიალები', qualificationGroup: 'II',
        },
      };
      let statusCode;
      let responseData;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { responseData = data; },
      };

      await employeeController.createEmployee(req, res, jest.fn());

      expect(mockEmployeeCreate).toHaveBeenCalled();
      expect(statusCode).toBe(201);
      expect(invalidate).toHaveBeenCalledWith('dashboard:stats');
      expect(invalidate).toHaveBeenCalledWith('departments');
    });

    it('should handle photo upload', async () => {
      mockEmployeeCreate.mockResolvedValue({ _id: 'p1' });

      const req = {
        body: { personalId: 'P002', fullName: 'Photo', department: 'D', position: 'P', workplace: 'ფილიალები', qualificationGroup: 'I' },
        file: { path: 'https://cloudinary.com/photo.jpg' },
      };
      const res = { status: () => res, json: jest.fn() };

      await employeeController.createEmployee(req, res, jest.fn());

      expect(mockEmployeeCreate).toHaveBeenCalledWith(expect.objectContaining({
        photo: 'https://cloudinary.com/photo.jpg',
      }));
    });

    it('should parse JSON specialPermissions', async () => {
      mockEmployeeCreate.mockResolvedValue({ _id: 'sp1' });

      const req = {
        body: {
          personalId: 'P003', fullName: 'Perms',
          department: 'D', position: 'P', workplace: 'ფილიალები', qualificationGroup: 'I',
          specialPermissions: '["Working at height"]',
        },
      };
      const res = { status: () => res, json: jest.fn() };

      await employeeController.createEmployee(req, res, jest.fn());

      expect(mockEmployeeCreate).toHaveBeenCalledWith(expect.objectContaining({
        specialPermissions: ['Working at height'],
      }));
    });
  });

  describe('searchByPersonalId', () => {
    it('should throw 400 if personalId not provided', async () => {
      const req = { query: {} };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await employeeController.searchByPersonalId(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
      }));
    });
  });
});
