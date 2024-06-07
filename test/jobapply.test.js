const {
    ViewJob,
    JobApply,
    ViewJobSummary,
    StatusChange,
  } = require('../controllers/jobapply-contollers');
  const JobPost = require("../models/jobPost");
  const JobSummary = require('../models/jobSummary');
  const cloudinary = require("cloudinary").v2;
  const Role = require('../models/role');
  const Notification = require('../models/notification');
  const SiteUserNotification = require('../models/siteuserNotification'); // Import the SiteUserNotification model
  const fs = require('fs');

  jest.mock('../models/siteuserNotification');
  jest.mock('../models/jobPost');
  jest.mock('../models/jobSummary');
  jest.mock('../models/notification');
  jest.mock('../models/role');
  jest.mock('fs');
  jest.mock('cloudinary');
  describe('Job apply Controller', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  describe('ViewJob', () => {
    it('should return all job vacancies', async () => {
      const mockJobVacancies = [{ title: 'Software Engineer' }, { title: 'Data Analyst' }];
      JobPost.find.mockResolvedValue(mockJobVacancies);
      const res = {
        json: jest.fn(),
      };
      await ViewJob({}, res);
      expect(res.json).toHaveBeenCalledWith(mockJobVacancies);
    });
  
    it('should handle errors when fetching job vacancies', async () => {
      const errorMessage = 'Error fetching job vacancies';
      JobPost.find.mockRejectedValue(new Error(errorMessage));
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await ViewJob({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
  
  describe('JobApply', () => {
  //  Add test cases for JobApply function
    it('should return 403 if user is not logged in', async () => {
        const req = {
          params: { id: 'job_id' },
          user: {},
          body: {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone_no: '123456',
            cv: { path: 'cv_path' }
          }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await JobApply(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "you should be logged in first" });
      });
    it('should return 404 if job does not exist', async () => {
        const req = {
          params: { id: 'job_id' },
          user: { id: 'user_id' },
          body: {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone_no: '123456',
            cv: { path: 'cv_path' }
          }
        };
        JobPost.findOne.mockResolvedValue(null);
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await JobApply(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ status: "fail", message: "Job does not exist" });
      });
    it('should return 400 if validation fails', async () => {
        const req = { params: { id: 'job_id' }, user: { id: 'user_id' },
         body: { full_name: 'John Doe', email: 'john@example.com', phone_no: '123456', cv: null } };
        const error = new Error('Validation error');
        error.details = [{ message: 'Validation error message' }];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        JobPost.findOne.mockResolvedValue({});
        await JobApply(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "\"cv\" is required" });
      });
    it('should handle cloudinary upload error', async () => {
        const req = {
          params: { id: 'job_id' },
          user: { id: 'user_id' },
          body: { full_name: 'John Doe', email: 'john@example.com', phone_no: '123456' },
          file: {
            fieldname: 'cv',
            originalname: 'cv.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            destination: 'uploads/',
            filename: 'cv_path',
            path: 'cv_path',
            size: 1024
          }
        };
      
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          send: jest.fn()
        };
      
        JobPost.findOne.mockResolvedValue({});
        JobSummary.findOne.mockResolvedValue(null);
      
        cloudinary.uploader.upload = jest.fn((path, options, callback) => {
          callback(new Error('Cloudinary upload error'));
        });
      
        await JobApply(req, res);
      
        expect(res.send).toHaveBeenCalledWith("File format is wrong! Only pdf files are supported.");
      });
    it('should return 409 if user has already applied to the job', async () => {
       
        const req = { params: { id: 'job_id' }, user: { id: 'user_id' }, 
        body: { 
            full_name: 'John Doe', 
            email: 'john@example.com', 
            phone_no: '123456', 
          } ,
          file: {
            fieldname: 'cv',
            originalname: 'cv.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            destination: 'uploads/',
            filename: 'cv_path',
            path: 'cv_path',
            size: 1024
          }
        };
        const existingApplication = { _id: 'existing_application_id' };
        JobPost.findOne.mockResolvedValueOnce({});
        JobSummary.findOne.mockResolvedValueOnce(existingApplication);
        const res = { status: jest.fn(), json: jest.fn() };
        res.status.mockReturnThis(); 
        await JobApply(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: "You have already applied to this job", value: { appliedUser: existingApplication } });
      });
  });
  
  describe('ViewJobSummary', () => {
    
    it('should return job summary when retrieval is successful', async () => {
      const mockJobSummary = [{ _id: '1', title: 'Job 1' }, { _id: '2', title: 'Job 2' }];
      JobSummary.find.mockResolvedValueOnce(mockJobSummary);
      const req = {};
      const res = { json: jest.fn() };
      await ViewJobSummary(req, res);
      expect(JobSummary.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockJobSummary);
    });
  
    it('should handle internal server error', async () => {
    const errorMessage = 'Internal Server Error';
    JobSummary.find.mockRejectedValueOnce(new Error(errorMessage));
     const req = {};
      const res = { status: jest.fn(), json: jest.fn() };
      res.status.mockReturnThis(); 
      await ViewJobSummary(req, res);
      expect(JobSummary.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
  
  describe('StatusChange', () => {
    it('should update job summary status successfully', async () => {
        const req = { params: { id: 'job_summary_id' }, body: { status: 'approved' } };
        const mockJobSummary = { _id: 'job_summary_id', user_id: 'user_id', status: 'pending', createdAt: new Date() };
        JobSummary.findById.mockResolvedValueOnce(mockJobSummary);
        mockJobSummary.save = jest.fn().mockResolvedValueOnce();
        SiteUserNotification.prototype.save = jest.fn().mockResolvedValueOnce();
        const res = { status: jest.fn(), json: jest.fn() };
        res.status.mockReturnThis(); 
        await StatusChange(req, res);
        expect(JobSummary.findById).toHaveBeenCalledWith('job_summary_id');
        expect(mockJobSummary.status).toBe('approved');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockJobSummary);
        expect(mockJobSummary.save).toHaveBeenCalled();
        expect(SiteUserNotification.prototype.save).toHaveBeenCalled();
      });
    
      it('should handle "job summary not found" error', async () => {
        const req = { params: { id: 'job_summary_id' }, body: { status: 'approved' } };
        JobSummary.findById.mockResolvedValueOnce(null);
        const res = { status: jest.fn(), json: jest.fn() };
        res.status.mockReturnThis();
        await StatusChange(req, res);
        expect(JobSummary.findById).toHaveBeenCalledWith('job_summary_id');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Leave application not found' });
      });
  });
});