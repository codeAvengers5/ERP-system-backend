const {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPostById,
  deleteJobPostById,
} = require('../controllers/jobpost-contollers');

const JobPost = require('../models/jobPost');
const User = require('../models/user');
const SiteUserNotification = require('../models/siteuserNotification');

jest.mock('../models/jobPost');
jest.mock('../models/user');
jest.mock('../models/siteuserNotification');

describe('Job Posts Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJobPost', () => {
    it('should create a new job post', async () => {
      const req = {
        body: {
          title: 'Job Title',
          description: 'Job Description',
          requirement: 'Job Requirement',
          responsibility: 'Job Responsibility',
          salary: 50000,
          closingDate: '2024-12-31',
        },
        user: {
          id: 'hr-admin-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the save function of the JobPost model
      const saveMock = jest.fn().mockResolvedValue(req.body);

      // Mock the JobPost constructor
      JobPost.mockImplementationOnce(() => ({
        save: saveMock,
      }));

      // Mock the find function of the User model
      User.find.mockResolvedValue([{ _id: 'user1' }, { _id: 'user2' }]);

      // Mock the save function of the SiteUserNotification model
      SiteUserNotification.prototype.save = jest.fn().mockResolvedValue();

      await createJobPost(req, res);

      expect(JobPost).toHaveBeenCalledWith({
        title: 'Job Title',
        description: 'Job Description',
        requirement: 'Job Requirement',
        responsibility: 'Job Responsibility',
        salary: 50000,
        closingDate: '2024-12-31',
      });

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Job post created successfully',
        jobPost: expect.any(Object),
      });
    });

    it('should return an error if validation fails', async () => {
      const req = {
        body: {
          title: 'Job Title',
          description: 'Job Description',
          requirement: '',
          responsibility: 'Job Responsibility',
          salary: 50000,
          closingDate: '2024-12-31',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createJobPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: '"requirement" is not allowed to be empty',
      });
    });

    it('should handle errors and return 500 status', async () => {
      const req = {
        body: {
          title: 'Job Title',
          description: 'Job Description',
          requirement: 'Job Requirement',
          responsibility: 'Job Responsibility',
          salary: 50000,
          closingDate: '2024-12-31',
        },
        user: {
          id: 'hr-admin-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the save function of the JobPost model to throw an error
      const saveMock = jest.fn().mockRejectedValue(new Error('Database error'));

      // Mock the JobPost constructor
      JobPost.mockImplementationOnce(() => ({
        save: saveMock,
      }));

      await createJobPost(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create job post' });
    });
  });
  
    describe('getAllJobPosts', () => {
      it('should get all job posts', async () => {
        const jobPosts = [
          {
            _id: 'job-post-id-1',
            title: 'Job Title 1',
            description: 'Job Description 1',
            requirement: 'Job Requirement 1',
            responsibility: 'Job Responsibility 1',
            salary: 50000,
          },
          {
            _id: 'job-post-id-2',
            title: 'Job Title 2',
            description: 'Job Description 2',
            requirement: 'Job Requirement 2',
            responsibility: 'Job Responsibility 2',
            salary: 60000,
          },
        ];
  
        const req = {};
        const res = {
          json: jest.fn(),
        };
  
        // Mock the find function of the JobPost model
        const findMock = jest.fn().mockResolvedValue(jobPosts);
  
        // Mock the JobPost model
        JobPost.find = findMock;
  
        await getAllJobPosts(req, res);
  
        expect(res.json).toHaveBeenCalledWith(jobPosts);
      });
  
      it('should handle errors and return 500 status', async () => {
        const req = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        // Mock the find function of the JobPost model to throw an error
        const findMock = jest.fn().mockRejectedValue(new Error('Database error'));
  
        // Mock the JobPost model
        JobPost.find = findMock;
  
        await getAllJobPosts(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch job posts' });
      });
    });
  
    describe('getJobPostById', () => {
      it('should get a specific job post by ID', async () => {
        const jobPost = {
          _id: 'job-post-id',
          title: 'Job Title',
          description: 'Job Description',
          requirement: 'Job Requirement',
          responsibility: 'Job Responsibility',
          salary: 50000,
        };
  
        const req = {
          params: {
            id: 'job-post-id',
          },
        };
  
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        };
  
        // Mock the findById function of the JobPost model
        const findByIdMock = jest.fn().mockResolvedValue(jobPost);
  
        // Mock the JobPost model
        JobPost.findById = findByIdMock;
  
        await getJobPostById(req, res);
  
        expect(findByIdMock).toHaveBeenCalledWith('job-post-id');
        expect(res.json).toHaveBeenCalledWith(jobPost);
      });
  
      it('should return an error if job post is not found', async () => {
        const req = {
          params: {
            id: 'invalid-id',
          },
        };
  
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        // Mock the findById function of the JobPost model
        const findByIdMock = jest.fn().mockResolvedValue(null);
  
        // Mock the JobPost model
        JobPost.findById = findByIdMock;
  
        await getJobPostById(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Job post not found' });
      });
  
      it('should handle errors and return 500 status', async () => {
        const req = {
          params: {
            id: 'job-post-id',
          },
        };
  
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        // Mock the findById function of the JobPost model to throw an error
        const findByIdMock = jest.fn().mockRejectedValue(new Error('Database error'));
  
        // Mock the JobPost model
        JobPost.findById = findByIdMock;
  
        await getJobPostById(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch job post' });
      });
    });
  
    describe('updateJobPostById', () => {
      it('should update a specific job post by ID', async () => {
        const jobPost = {
          _id: 'job-post-id',
          title: 'Job Title',
          description: 'Job Description',
          requirement: 'Job Requirement',
          responsibility: 'Job Responsibility',
          salary: 50000,
        };
  
        const req = {
          params: {
            id: 'job-post-id',
          },
          body: {
            title: 'Updated Job Title',
            description: 'Updated Job Description',
            requirement: 'Updated Job Requirement',
            responsibility: 'Updated Job Responsibility',
            salary: 60000,
          },
        };
  
        const res = {
          json: jest.fn(),
        };
  
        // Mock the findByIdAndUpdate function of the JobPost model
        const findByIdAndUpdateMock = jest.fn().mockResolvedValue(jobPost);
  
        // Mock the JobPost model
        JobPost.findByIdAndUpdate = findByIdAndUpdateMock;
  
        await updateJobPostById(req, res);
  
        expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
          'job-post-id',
          {
            title: 'Updated Job Title',
            description: 'Updated Job Description',
            requirement: 'Updated Job Requirement',
            responsibility: 'Updated Job Responsibility',
            salary: 60000,
          },
          { new: true }
        );
        expect(res.json).toHaveBeenCalledWith({
          message: 'Job post updated successfully',
          jobPost: jobPost,
        });
      });
  
      it('should return an error if job post is not found', async () => {
        const req = {
          params: {
            id: 'invalid-id',
          },
          body: {
            title: 'Updated Job Title',
            description: 'Updated Job Description',
            requirement: 'Updated Job Requirement',
            responsibility: 'Updated Job Responsibility',
            salary: 60000,
          },
        };
  
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
  
        // Mock the findByIdAndUpdate function of the JobPost model
        const findByIdAndUpdateMock = jest.fn().mockResolvedValue(null);
  
        // Mock the JobPost model
        JobPost.findByIdAndUpdate = findByIdAndUpdateMock;
  
        await updateJobPostById(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Job post not found' });
      });
  
    });
});