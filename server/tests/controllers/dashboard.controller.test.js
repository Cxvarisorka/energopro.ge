jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

const mockEmployeeCountDocuments = jest.fn();
const mockEmployeeAggregate = jest.fn();
const mockExamCountDocuments = jest.fn();
const mockExamAggregate = jest.fn();

jest.mock('../../models/employee.model', () => ({
  countDocuments: (...args) => mockEmployeeCountDocuments(...args),
  aggregate: (...args) => mockEmployeeAggregate(...args),
}));

jest.mock('../../models/exam.model', () => ({
  countDocuments: (...args) => mockExamCountDocuments(...args),
  aggregate: (...args) => mockExamAggregate(...args),
  find: () => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  }),
}));

const dashboardController = require('../../controllers/dashboard.controller');

describe('Dashboard Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return stats with correct structure', async () => {
    mockEmployeeCountDocuments.mockResolvedValue(3500);
    mockExamCountDocuments.mockResolvedValue(42);
    mockEmployeeAggregate
      .mockResolvedValueOnce([{ _id: 'Engineering', count: 1500 }]) // employeesByDepartment
      .mockResolvedValueOnce([{ _id: 'III', count: 800 }]);         // qualificationDistribution
    mockExamAggregate
      .mockResolvedValueOnce([{ _id: 'passed', count: 200 }])       // examsByStatus
      .mockResolvedValueOnce([{ totalWithExams: 3000, fullyCompliant: 2500, withExpired: 500 }]); // compliance

    const req = { query: {} };
    let responseData;
    const next = jest.fn((err) => {
      if (err) throw err; // surface errors
    });
    const res = { json: (data) => { responseData = data; } };

    await dashboardController.getStats(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(responseData).toBeDefined();
    expect(responseData.totalEmployees).toBe(3500);
    expect(responseData.employeesByDepartment).toBeDefined();
    expect(responseData.examsByStatus).toBeDefined();
    expect(responseData.expiredCount).toBe(42);
    expect(responseData.upcomingExams).toBeDefined();
    expect(responseData.expiredExams).toBeDefined();
    expect(responseData.qualificationDistribution).toBeDefined();
    expect(responseData.compliance).toBeDefined();
    expect(responseData.compliance.complianceRate).toBe(83);
  });

  it('should handle zero compliance data', async () => {
    mockEmployeeCountDocuments.mockResolvedValue(0);
    mockExamCountDocuments.mockResolvedValue(0);
    mockEmployeeAggregate.mockResolvedValue([]);
    mockExamAggregate
      .mockResolvedValueOnce([])  // examsByStatus
      .mockResolvedValueOnce([]); // compliance

    const req = { query: {} };
    let responseData;
    const next = jest.fn((err) => {
      if (err) throw err;
    });
    const res = { json: (data) => { responseData = data; } };

    await dashboardController.getStats(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(responseData.compliance.complianceRate).toBe(0);
    expect(responseData.compliance.totalWithExams).toBe(0);
  });
});
