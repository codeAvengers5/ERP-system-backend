
const { createContactus, getContactUsInfo } = require('../controllers/contactus-controllers');
const Contact = require('../models/contact');

jest.mock('../models/contact');

describe('Contact Us Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContactus', () => {
    it('should create a new contact message', async () => {
      const req = {
        body: {
          full_name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const saveMock = jest.fn().mockResolvedValue(req.body);
      Contact.mockImplementationOnce(() => ({
        save: saveMock,
      }));

      await createContactus(req, res);
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return an error if validation fails', async () => {
      const req = {
        body: {
          full_name: '',
          email: 'john@example.com',
          message: '',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createContactus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Please fill all the fields' });
    });

    it('should handle errors and return 500 status', async () => {
      const req = {
        body: {
          full_name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const saveMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Contact.mockImplementationOnce(() => ({
        save: saveMock,
      }));

      await createContactus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send contact us form' });
    });
  });

  describe('getContactUsInfo', () => {
    it('should get all contact messages', async () => {
      const contactMessages = [
        {
          _id: 'contact-id-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
        },
        {
          _id: 'contact-id-2',
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Another test message.',
        },
      ];

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findMock = jest.fn().mockResolvedValue(contactMessages);
      Contact.find = findMock;

      await getContactUsInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ contactus: contactMessages });
    });

    it('should handle errors and return 500 status', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const findMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Contact.find = findMock;

      await getContactUsInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get contact us info' });
    });
  });
});

