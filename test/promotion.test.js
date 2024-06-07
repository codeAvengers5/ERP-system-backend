const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Promotion = require('../models/promotion');
const User = require('../models/user');
const SiteUserNotification = require('../models/siteuserNotification');
const { createPromotion, getAllPromotions, getPromotionById, updatePromotionById, deletePromotionById } = require("../controllers/promotion-controllers");
const cloudinary = require("../config/coludinary");
const mockFs = require('mock-fs');

// Mock the necessary modules
jest.mock('../models/promotion');
jest.mock('../models/user');
jest.mock('../models/siteuserNotification');
jest.mock("../config/coludinary");

const app = express();
app.use(express.json());

describe('Promotion Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockFs.restore();
  });

  describe('createPromotion', () => {
    it('should create a new promotion and return status 201', async () => {
      // Mock the file system
      mockFs({
        'ERP-system-backend/uploads/file.jpg': Buffer.from('mock file content')
      });

      // Mock request and response objects
      const req = {
        method: 'POST',
        body: { title: 'Test Promotion', description: 'Test Description' },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'ERP-system-backend/uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockResolvedValue({ url: 'http://example.com/image.jpg' });
      Promotion.prototype.save = jest.fn().mockResolvedValue({});
      User.find = jest.fn().mockResolvedValue([{ _id: '123' }]);
      SiteUserNotification.prototype.save = jest.fn().mockResolvedValue({});

      await createPromotion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Promotion created successfully' });
    });
    it('should return 400 if validation fails', async () => {
      const req = {
        body: { title: '', description: '' },
        files: []
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createPromotion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 500 if there is an error', async () => {
      // Mock the file system
      mockFs({
        'ERP-system-backend/uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'POST',
        body: { title: 'Test Promotion', description: 'Test Description' },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'ERP-system-backend/uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      cloudinary.uploads.mockRejectedValue(new Error('Upload error'));

      await createPromotion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Upload error' }));
    });
  
  });
 });

  describe('getAllPromotions', () => {
    it('should return all promotions with status 200', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.find = jest.fn().mockResolvedValue([{ title: 'Test Promotion' }]);

      await getAllPromotions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ title: 'Test Promotion' }]);
    });

    it('should return 500 if there is an error', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.find = jest.fn().mockRejectedValue(new Error('Database error'));

      await getAllPromotions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch promotions' });
    });
  });

  describe('getPromotionById', () => {
    it('should return a promotion by ID with status 200', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findById = jest.fn().mockResolvedValue({ title: 'Test Promotion' });

      await getPromotionById(req, res);

      expect(res.json).toHaveBeenCalledWith({ title: 'Test Promotion' });
    });

    it('should return 404 if promotion not found', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findById = jest.fn().mockResolvedValue(null);

      await getPromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Promotion not found' });
    });

    it('should return 500 if there is an error', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await getPromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch promotion' });
    });
  });

  describe('updatePromotionById', () => {
    it('should update the promotion and return status 200', async () => {
      // Mock the file system
      mockFs({
        'ERP-system-backend/uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'PUT',
        params: { id: '123' },
        body: { title: 'Updated Promotion', description: 'Updated Description' },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'ERP-system-backend/uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockResolvedValue({ url: 'http://example.com/image.jpg' });
      Promotion.findByIdAndUpdate.mockResolvedValue({
        _id: '123',
        title: 'Updated Promotion',
        description: 'Updated Description',
        images: ['http://example.com/image.jpg']
      });

      await updatePromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Promotion updated successfully',
        promotion: {
          _id: '123',
          title: 'Updated Promotion',
          description: 'Updated Description',
          images: ['http://example.com/image.jpg']
        }
      });
    });

    it('should return 400 if validation fails', async () => {
      const req = {
        method: 'PUT',
        params: { id: '123' },
        body: { title: '', description: '' },
        files: []
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updatePromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
    it('should return 500 if there is an error', async () => {
      // Mock the file system
      mockFs({
        'ERP-system-backend/uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'PUT',
        params: { id: '123' },
        body: { title: 'Updated Promotion', description: 'Updated Description' },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'ERP-system-backend/uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockRejectedValue(new Error('Upload error'));
      Promotion.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Database error');
      });

      await updatePromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to update promotion' }));
    });
  });

  describe('deletePromotionById', () => {
    it('should delete a promotion by ID and return status 200', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findByIdAndDelete = jest.fn().mockResolvedValue({ title: 'Deleted Promotion' });

      await deletePromotionById(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Promotion deleted successfully' });
    });

    it('should return 404 if promotion not found', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await deletePromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Promotion not found' });
    });

    it('should return 500 if there is an error', async () => {
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Promotion.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));

      await deletePromotionById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete promotion' });
    });
  });

