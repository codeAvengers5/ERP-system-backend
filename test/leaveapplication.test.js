
const {
  createLeaveApplication,
  getLeaveApplication_forEmployee,
  getLeaveApplicationById_forEmployee,
  filterByStatus,
  updateLeaveApplication,
  updateStatus,
  deleteLeaveApplication,
  getAllLeaveApplications_forHR,
} = require('../controllers/leaveapplication-controller');

const LeaveApplication = require('../models/leaveApplication');
const EmployeeInfo = require('../models/employeeInfo');
const Role = require('../models/role');
const Notification = require('../models/notification');

jest.mock('../models/leaveApplication');
jest.mock('../models/employeeInfo');
jest.mock('../models/role');
jest.mock('../models/notification');

describe('Leave Application Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeaveApplication', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    const req = {
      body: {
        full_name: 'John Doe',
        duration: '5 days',
        leave_date: new Date(),
        detail: 'annual',
      },
      user: {
        id: 'employee-id',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    it('should create a new leave application successfully', async () => {
      LeaveApplication.findOne.mockResolvedValueOnce(null);
      EmployeeInfo.findOne.mockResolvedValueOnce({ position: 'Software Engineer' });
      LeaveApplication.prototype.save = jest.fn().mockResolvedValueOnce();
      Role.findOne.mockResolvedValueOnce({ employee_id: 'hr-admin-id' });
      Notification.prototype.save = jest.fn().mockResolvedValueOnce();
  
      await createLeaveApplication(req, res);
  
      expect(LeaveApplication.findOne).toHaveBeenCalledWith({
        employee_id: 'employee-id',
        status: 'pending',
      });
      expect(EmployeeInfo.findOne).toHaveBeenCalledWith({ employee_id: 'employee-id' });
      expect(LeaveApplication.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Leave application created successfully' });
      expect(Role.findOne).toHaveBeenCalledWith({ role_name: 'hradmin' });
      expect(Notification.prototype.save).toHaveBeenCalled();
    });
  
    it('should return an error if there is an existing pending leave application', async () => {
      LeaveApplication.findOne.mockResolvedValueOnce({});
  
      await createLeaveApplication(req, res);
  
      expect(LeaveApplication.findOne).toHaveBeenCalledWith({
        employee_id: 'employee-id',
        status: 'pending',
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'You already have a pending leave request' });
    });
  
    it('should return an error if employee information is not found', async () => {
      LeaveApplication.findOne.mockResolvedValueOnce(null);
      EmployeeInfo.findOne.mockResolvedValueOnce(null);
  
      await createLeaveApplication(req, res);
  
      expect(EmployeeInfo.findOne).toHaveBeenCalledWith({ employee_id: 'employee-id' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Employee information not found' });
    });
  
    it('should return an error if annual leave is already taken this year', async () => {
      const currentYear = new Date().getFullYear();
      LeaveApplication.findOne.mockResolvedValueOnce(null);
      LeaveApplication.findOne.mockResolvedValueOnce({
        employee_id: 'employee-id',
        detail: 'annual',
        status: 'approved',
        leave_date: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      });
      EmployeeInfo.findOne.mockResolvedValueOnce({ position: 'Software Engineer' });
  
      await createLeaveApplication(req, res);
  
      expect(LeaveApplication.findOne).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'You have already been granted annual leave this year' });
    });
  
    it('should handle internal server error', async () => {
      LeaveApplication.findOne.mockRejectedValueOnce(new Error('Database error'));
  
      await createLeaveApplication(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  
    it('should return an error if HR admin role is not found', async () => {
      LeaveApplication.findOne.mockResolvedValueOnce(null);
      EmployeeInfo.findOne.mockResolvedValueOnce({ position: 'Software Engineer' });
      LeaveApplication.prototype.save = jest.fn().mockResolvedValueOnce();
      Role.findOne.mockResolvedValueOnce(null);
  
      await createLeaveApplication(req, res);
  
      expect(Role.findOne).toHaveBeenCalledWith({ role_name: 'hradmin' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'HR admin role not found' });
    });
  });
})
  

describe('getLeaveApplicationById_forEmployee', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a leave application by ID', async () => {
    const req = { params: { id: 'leave-application-id' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    LeaveApplication.findById.mockResolvedValueOnce({ id: 'leave-application-id' });

    await getLeaveApplicationById_forEmployee(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 'leave-application-id' });
  });

  it('should return 404 if leave application not found', async () => {
    const req = { params: { id: 'leave-application-id' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    LeaveApplication.findById.mockResolvedValueOnce(null);

    await getLeaveApplicationById_forEmployee(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Leave application not found" });
  });

  it('should handle internal server error', async () => {
    const req = { params: { id: 'leave-application-id' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    LeaveApplication.findById.mockRejectedValueOnce(new Error('Database error'));

    await getLeaveApplicationById_forEmployee(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});


describe('getLeaveApplication_forEmployee', () => {
  it('should return leave applications for the employee', async () => {
    const req = {
      user: { id: 'employee-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockResolvedValueOnce([{ id: 'leave-application-id' }]);

    await getLeaveApplication_forEmployee(req, res);

    expect(LeaveApplication.find).toHaveBeenCalledWith({ employee_id: 'employee-id' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 'leave-application-id' }]);
  });

  it('should return 404 if no leave applications found', async () => {
    const req = {
      user: { id: 'employee-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockResolvedValueOnce(null);

    await getLeaveApplication_forEmployee(req, res);

    expect(LeaveApplication.find).toHaveBeenCalledWith({ employee_id: 'employee-id' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Leave application not found" });
  });

  it('should handle internal server error', async () => {
    const req = {
      user: { id: 'employee-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockRejectedValueOnce(new Error('Database error'));

    await getLeaveApplication_forEmployee(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
describe('getAllLeaveApplications_forHR', () => {
  it('should return all leave applications', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockResolvedValueOnce([{ id: 'leave-application-id' }]);

    await getAllLeaveApplications_forHR(req, res);

    expect(LeaveApplication.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 'leave-application-id' }]);
  });

  it('should handle internal server error', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockRejectedValueOnce(new Error('Database error'));

    await getAllLeaveApplications_forHR(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('updateLeaveApplication', () => {
  it('should update a leave application successfully', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: {
        full_name: 'John Doe',
        duration: '5 days',
        leave_date: new Date(),
        detail: 'annual',
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce({
      save: jest.fn().mockResolvedValueOnce(),
      status: 'pending',
    });

    await updateLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave application updated successfully' });
  });

  it('should return 404 if leave application not found', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: {
        full_name: 'John Doe',
        duration: '5 days',
        leave_date: new Date(),
        detail: 'annual',
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce(null);

    await updateLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave application not found' });
  });

  it('should return 400 if trying to update an approved leave application', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: {
        full_name: 'John Doe',
        duration: '5 days',
        leave_date: new Date(),
        detail: 'annual',
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce({
      status: 'approved',
    });

    await updateLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cannot update an approved leave application' });
  });

  it('should handle internal server error', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: {
        full_name: 'John Doe',
        duration: '5 days',
        leave_date: new Date(),
        detail: 'annual',
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockRejectedValueOnce(new Error('Database error'));

    await updateLeaveApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('updateStatus', () => {
  it('should update the status of a leave application', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: { status: 'approved' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce({
      save: jest.fn().mockResolvedValueOnce(),
      status: 'pending',
    });

    Notification.prototype.save = jest.fn().mockResolvedValueOnce();

    await updateStatus(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    expect(Notification.prototype.save).toHaveBeenCalled();
  });

  it('should return 404 if leave application not found', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: { status: 'approved' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce(null);

    await updateStatus(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave application not found' });
  });

  it('should handle internal server error', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      body: { status: 'approved' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockRejectedValueOnce(new Error('Database error'));

    await updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('deleteLeaveApplication', () => {
  it('should delete a pending leave application successfully', async () => {
    const req = {
      params: { id: 'leave-application-id' },
      user: { role: 'employee' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce({
      status: 'pending',
    });

    LeaveApplication.findByIdAndDelete.mockResolvedValueOnce();

    await deleteLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(LeaveApplication.findByIdAndDelete).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave application deleted successfully' });
  });

  it('should return 404 if leave application not found', async () => {
    const req = {
      params: { id: 'leave-application-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce(null);

    await deleteLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave application not found' });
  });

  it('should return 400 if trying to delete an approved leave application', async () => {
    const req = {
      params: { id: 'leave-application-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockResolvedValueOnce({
      status: 'approved',
    });

    await deleteLeaveApplication(req, res);

    expect(LeaveApplication.findById).toHaveBeenCalledWith('leave-application-id');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete an approved leave application' });
  });

  it('should handle internal server error', async () => {
    const req = {
      params: { id: 'leave-application-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.findById.mockRejectedValueOnce(new Error('Database error'));

    await deleteLeaveApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('filterByStatus', () => {
  it('should return leave applications filtered by status', async () => {
    const req = {
      query: { status: 'pending' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockResolvedValueOnce([{ id: 'leave-application-id', status: 'pending' }]);

    await filterByStatus(req, res);

    expect(LeaveApplication.find).toHaveBeenCalledWith({ status: 'pending' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 'leave-application-id', status: 'pending' }]);
  });

  it('should return all leave applications if no status is provided', async () => {
    const req = {
      query: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockResolvedValueOnce([{ id: 'leave-application-id', status: 'pending' }]);

    await filterByStatus(req, res);

    expect(LeaveApplication.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 'leave-application-id', status: 'pending' }]);
  });

  it('should return 400 for invalid status', async () => {
    const req = {
      query: { status: 'invalid' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await filterByStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' });
  });

  it('should handle internal server error', async () => {
    const req = {
      query: { status: 'pending' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LeaveApplication.find.mockRejectedValueOnce(new Error('Database error'));

    await filterByStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
