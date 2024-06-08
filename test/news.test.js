const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Employee = require('../models/employee');
const News = require('../models/news');
const User = require('../models/user');
const SiteUserNotification = require('../models/siteuserNotification');
const Notification = require('../models/notification');
const {
  createNews,
  updateNewsById,
  getNewsById,
  getAllNews,
  searchNews,
  deleteNewsById
} = require('../controllers/news-controller');

const cloudinary = require("../config/coludinary");
const mockFs = require('mock-fs');

// Mock the necessary modules
jest.mock('../models/promotion');
jest.mock('../models/user');
jest.mock('../models/siteuserNotification');
jest.mock('../models/notification');
jest.mock("../config/coludinary");
jest.mock('../models/news');
jest.mock('../models/employee');

const app = express();
app.use(express.json());
describe('News Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // mockFs.restore();
  });

  describe('createNews', () => {
    it('should create news and return status 201', async () => {
      // Mock file system
      mockFs({
        'ERP-system-backend/uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'POST',
        body: { title: 'Test News', description: 'Test Description', for_all: true },
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
      News.prototype.save = jest.fn().mockResolvedValue({});
      
      await createNews(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'News created successfully' });
    });

    it('should return 400 if validation fails', async () => {
      const req = {
        method: 'POST',
        body: { title: '', description: '', for_all: true },
        files: []
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createNews(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 500 if there is an error', async () => {
      // Mock file system
      mockFs({
        'uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'POST',
        body: { title: 'Test News', description: 'Test Description', for_all: true },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockRejectedValue(new Error('Upload error'));

      await createNews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('updateNewsById', () => {
    it('should update news and return status 200', async () => {
      // Mock file system
      mockFs({
        'uploads/file.jpg': Buffer.from('mock file content')
      });
      const req = {
        method: 'PUT',
        params: { id: '123' },
        body: { title: 'Updated News', description: 'Updated Description', for_all: true },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockResolvedValue({ url: 'http://example.com/image.jpg' });
      News.findByIdAndUpdate.mockResolvedValue({
        _id: '123',
        title: 'Updated News',
        description: 'Updated Description',
        for_all: true,
        images: ['http://example.com/image.jpg']
      });

      await updateNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'News updated successfully',
        news: {
          _id: '123',
          title: 'Updated News',
          description: 'Updated Description',
          for_all: true,
          images: ['http://example.com/image.jpg']
        }
      });
    });

  
    it('should return 500 if there is an error', async () => {
      // Mock file system
      mockFs({
        'uploads/file.jpg': Buffer.from('mock file content')
      });

      const req = {
        method: 'PUT',
        params: { id: '123' },
        body: { title: 'Updated News', description: 'Updated Description', for_all: true },
        files: [{
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: 'uploads/',
          filename: 'test.jpg',
          path: 'uploads/file.jpg',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock functions
      cloudinary.uploads.mockRejectedValue(new Error('Upload error'));

      await updateNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('getAllNews', () => {
    it('should get all news items', async () => {
      const newsItems = [
        {
          _id: 'news-id-1',
          title: 'News Title 1',
          description: 'News Description 1',
          for_all: true,
        },
        {
          _id: 'news-id-2',
          title: 'News Title 2',
          description: 'News Description 2',
          for_all: true,
        },
      ];

      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const findMock = jest.fn().mockResolvedValue(newsItems);

      News.find = findMock;

      await getAllNews(req, res);

      expect(res.json).toHaveBeenCalledWith(newsItems);
    });

    it('should handle errors and return 500 status', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findMock = jest.fn().mockRejectedValue(new Error('Database error'));

      News.find = findMock;

      await getAllNews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch news' });
    });
  });

  describe('getNewsById', () => {
    it('should get a specific news item by ID', async () => {
      const newsItem = {
        _id: 'news-id',
        title: 'News Title',
        description: 'News Description',
        for_all: true,
      };

      const req = {
        params: {
          id: 'news-id',
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const findByIdMock = jest.fn().mockResolvedValue(newsItem);

      News.findById = findByIdMock;

      await getNewsById(req, res);

      expect(findByIdMock).toHaveBeenCalledWith('news-id');
      expect(res.json).toHaveBeenCalledWith(newsItem);
    });

    it('should return an error if news item is not found', async () => {
      const req = {
        params: {
          id: 'invalid-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findByIdMock = jest.fn().mockResolvedValue(null);

      News.findById = findByIdMock;

      await getNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'News not found' });
    });

    it('should handle errors and return 500 status', async () => {
      const req = {
        params: {
          id: 'news-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findByIdMock = jest.fn().mockRejectedValue(new Error('Database error'));

      News.findById = findByIdMock;

      await getNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch news' });
    });
  });


  describe('deleteNewsById', () => {
    it('should delete a specific news item by ID', async () => {
      const req = {
        params: {
          id: 'news-id',
        },
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const findByIdAndDeleteMock = jest.fn().mockResolvedValue({ _id: 'news-id' });

      News.findByIdAndDelete = findByIdAndDeleteMock;

      await deleteNewsById(req, res);

      expect(findByIdAndDeleteMock).toHaveBeenCalledWith('news-id');
      expect(res.json).toHaveBeenCalledWith({ message: 'News deleted successfully' });
    });

    it('should return an error if news item is not found', async () => {
      const req = {
        params: {
          id: 'invalid-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findByIdAndDeleteMock = jest.fn().mockResolvedValue(null);

      News.findByIdAndDelete = findByIdAndDeleteMock;

      await deleteNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'News not found' });
    });

    it('should handle errors and return 500 status', async () => {
      const req = {
        params: {
          id: 'news-id',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findByIdAndDeleteMock = jest.fn().mockRejectedValue(new Error('Database error'));

      News.findByIdAndDelete = findByIdAndDeleteMock;

      await deleteNewsById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete news' });
    });
  });
});
