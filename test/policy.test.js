
  const policyController = require('../controllers/policy-controller');
const Policy = require('../models/policy');
const mongoose = require('mongoose');

jest.mock('../models/policy');

describe('Policy Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPolicy', () => {
    it('should create a new policy successfully', async () => {
      const req = {
        body: {
          date: '2023-06-01',
          title: 'Test Policy',
          content: 'This is a test policy.'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const policy = {
        save: jest.fn().mockResolvedValue(true)
      };
      Policy.mockImplementation(() => policy);

      await policyController.createPolicy(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Policy created successfully',
        policy: policy
      });
    });

    it('should return a 400 error if the input is invalid', async () => {
      const req = {
        body: {
          date: 'invalid-date',
          title: '',
          content: ''
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      const mockValidator = {
        validate: jest.fn().mockReturnValue({
          error: {
            details: [
              { message: '"date" must be a valid date' },
              { message: '"title" is required' },
              { message: '"content" is required' }
            ]
          }
        })
      };
    
      await policyController.createPolicy(req, res, mockValidator);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: '"date" must be a valid date'
      });
    });
    it('should return a 500 error if there is an error creating the policy', async () => {
      const req = {
        body: {
          date: '2023-06-01',
          title: 'Test Policy',
          content: 'This is a test policy.'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const error = new Error('Failed to create policy');
      Policy.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error)
      }));

      await policyController.createPolicy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create policy'
      });
    });
  });
  describe('getAllPolicies', () => {
    it('should return all policies successfully', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockPolicies = [
        { _id: '1', date: '2023-06-01', title: 'Policy 1', content: 'Content 1' },
        { _id: '2', date: '2023-06-02', title: 'Policy 2', content: 'Content 2' }
      ];
      Policy.find = jest.fn().mockResolvedValue(mockPolicies);

      await policyController.getAllPolicies({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPolicies);
    });

    it('should return a 500 error if there is an error fetching policies', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const error = new Error('Failed to fetch policies');
      Policy.find = jest.fn().mockRejectedValue(error);

      await policyController.getAllPolicies({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch policies' });
    });
  });

  describe('getPolicyById', () => {
    it('should return a policy by ID successfully', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        json: jest.fn()
      };

      const mockPolicy = { _id: '1', date: '2023-06-01', title: 'Policy 1', content: 'Content 1' };
      Policy.findById = jest.fn().mockResolvedValue(mockPolicy);

      await policyController.getPolicyById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPolicy);
    });

    it('should return a 404 error if the policy is not found', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Policy.findById = jest.fn().mockResolvedValue(null);

      await policyController.getPolicyById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Policy not found' });
    });

    it('should return a 500 error if there is an error fetching the policy', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const error = new Error('Failed to fetch policy');
      Policy.findById = jest.fn().mockRejectedValue(error);

      await policyController.getPolicyById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch policy' });
    });
  });

  describe('updatePolicyById', () => {
    it('should update a policy successfully', async () => {
      const req = {
        params: {
          id: '1'
        },
        body: {
          date: '2023-06-01',
          title: 'Updated Policy',
          content: 'Updated content'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockPolicy = { _id: '1', date: '2023-06-01', title: 'Updated Policy', content: 'Updated content' };
      Policy.findByIdAndUpdate = jest.fn().mockResolvedValue(mockPolicy);

      await policyController.updatePolicyById(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Policy updated successfully', policy: mockPolicy });
    });

    it('should return a 400 error if the input is invalid', async () => {
      const req = {
        params: {
          id: '1'
        },
        body: {
          date: 'invalid-date',
          title: '',
          content: ''
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockValidator = {
        validate: jest.fn().mockReturnValue({
          error: {
            details: [
              { message: '"date" must be a valid date' },
              { message: '"title" is required' },
              { message: '"content" is required' }
            ]
          }
        })
      };

      await policyController.updatePolicyById(req, res, mockValidator);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: '"date" must be a valid date' });
    });

    it('should return a 404 error if the policy is not found', async () => {
      const req = {
        params: {
          id: '1'
        },
        body: {
          date: '2023-06-01',
          title: 'Updated Policy',
          content: 'Updated content'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Policy.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await policyController.updatePolicyById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Policy not found' });
    });

    it('should return a 500 error if there is an error updating the policy', async () => {
      const req = {
        params: {
          id: '1'
        },
        body: {
          date: '2023-06-01',
          title: 'Updated Policy',
          content: 'Updated content'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const error = new Error('Failed to update policy');
      Policy.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

      await policyController.updatePolicyById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update policy' });
    });
  });
  describe('deletePolicyById', () => {
    it('should delete a policy successfully', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        json: jest.fn()
      };

      const mockPolicy = { _id: '1', date: '2023-06-01', title: 'Policy 1', content: 'Content 1' };
      Policy.findByIdAndDelete = jest.fn().mockResolvedValue(mockPolicy);

      await policyController.deletePolicyById(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Policy deleted successfully' });
    });
    it('should return a 404 error if the policy is not found', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      Policy.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    
      await policyController.deletePolicyById(req, res);
    
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Policy not found' });
    });
    
    it('should return a 500 error if there is an error deleting the policy', async () => {
      const req = {
        params: {
          id: '1'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      const error = new Error('Database error');
      Policy.findByIdAndDelete = jest.fn().mockRejectedValue(error);
    
      await policyController.deletePolicyById(req, res);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete policy' });
    });
  // Test cases for other controller functions (getAllPolicies, getPolicyById, updatePolicyById, deletePolicyById) can be added in a similar way.
  });
});