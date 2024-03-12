// const RegisterAdminUser = require('../controllers/adminuser-controllers'); // Update with the correct path

// describe('RegisterAdminUser', () => {
//   it('should create an employee account and return a success message', async () => {
//     // Mock the required dependencies and request objects
//     const req = {
//       body: {
//         full_name: 'John Doe',
//         email: 'johndoe@example.com',
//         password: 'password123',
//         position: 'Manager',
//         role_name: 'Admin',
//         start_date: '2022-01-01',
//         salary: 50000,
//         gender: 'Male',
//       },
    
//         files: [
//           {
//             fieldname: 'file',
//             originalname: 'example.jpg',
//             encoding: '7bit',
//             mimetype: 'image/jpeg',
//             destination: '/path/to/files',
//             filename: 'example.jpg',
//             path: '/path/to/files/example.jpg',
//             size: 1024,
//             buffer: Buffer.from('file content', 'utf-8'),
//           },
//           // Add more mock files if needed
//         ],
//         // Mock the uploaded files here
  
//       method: 'POST',
//     };

//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//       cookie: jest.fn(),
//     };

//     const next = jest.fn();

//     // Mock the required models and functions
//     const Employee = {
//       findOne: jest.fn().mockResolvedValue(null),
//       create: jest.fn().mockResolvedValue({ _id: 'employeeId' }),
//     };

//     const Role = {
//       create: jest.fn().mockResolvedValue({ _id: 'roleId' }),
//     };

//     const EmployeeInfo = {
//       create: jest.fn().mockResolvedValue({}),
//     };

//     const hashPassword = jest.fn().mockResolvedValue('hashedPassword');

//     const generateToken = jest.fn().mockResolvedValue('token');

//     const cloudinary = {
//       uploads: jest.fn().mockResolvedValue('uploadedImageUrl'),
//     };

//     const fs = {
//       unlinkSync: jest.fn(),
//     };

//       // Call the RegisterAdminUser function
//       await RegisterAdminUser.RegisterAdminUser(req, res, next);
    
//       // Assert that the necessary functions were called with the correct arguments
//       expect(res.status).toHaveBeenCalledWith(201);
//       expect(res.json).toHaveBeenCalledTimes(1);
//       expect(res.cookie).toHaveBeenCalledTimes(1);
//       expect(Employee.findOne).toHaveBeenCalledTimes(1);
//       expect(Employee.create).toHaveBeenCalledTimes(1);
//       expect(Role.create).toHaveBeenCalledTimes(1);
//       expect(EmployeeInfo.create).toHaveBeenCalledTimes(1);
//       expect(hashPassword).toHaveBeenCalledTimes(1);
//       expect(generateToken).toHaveBeenCalledTimes(1);
//       expect(cloudinary.uploads).toHaveBeenCalledTimes(1);
//       expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
//     });

//   // Add more test cases to cover different scenarios, such as validation errors, existing user, etc.
// });
const joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  generateConfirmationCode
} = require("../helpers/generateConfirmationCode");
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
 
} = require("../helpers/sendConfirmationEmail");
const hashPassword = require("../middleware/hashPassword");
const User = require("../models/user");
const generateToken = require("../middleware/generateToken");
const {
  RegisterSiteUser,
  ConfirmEmail,
  LoginSiteUser,
  ForgotPassword,
  ResetPassword,
  UpdatePassword,
} = require("../controllers/siteuser-contollers"); // Update with the correct module path

jest.mock("../models/user");
jest.mock("../helpers/sendConfirmationEmail");
jest.mock("../middleware/generateToken");
jest.mock("../middleware/hashPassword");

describe('RegisterSiteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a site user and return a success message', async () => {
    // Mock the request object
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
      },
    };
  
    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      cookie: jest.fn(),
    };
  
    // Mock the next function
    const next = jest.fn();
    const generateConfirmationCodeSpy = jest.spyOn(
      require("../helpers/generateConfirmationCode"), // Replace with the correct module containing the generateConfirmationCode function
      'generateConfirmationCode'
    ).mockReturnValue('testcode');
  
    // Mock the dependencies
    hashPassword.mockResolvedValue('hashedPassword');
    User.findOne.mockResolvedValue({});
    sendConfirmationEmail.mockResolvedValue();
    generateToken.mockResolvedValue('testtoken');
  
    // Assign the email value before calling RegisterSiteUser
    req.body.email = 'testuser@example.com';
  
    // Call the RegisterSiteUser function
    await RegisterSiteUser(req, res, next);
    console.log('User.findOne calls:', User.findOne.mock.calls);
  
    // Assert that the necessary functions were called with the correct arguments
    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(User.findOne).toHaveBeenCalledWith('testuser@example.com');
    expect(generateConfirmationCodeSpy).toHaveBeenCalledTimes(1);
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      'testuser@example.com',
      'testcode',
      'testuser'
    );
    expect(generateToken).toHaveBeenCalledWith({ id: expect.any(String) });
    expect(res.cookie).toHaveBeenCalledWith('jwt', 'testtoken', {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      siteUser: expect.any(Object),
      message: 'Please confirm/verify your email.',
    });
    expect(next).not.toHaveBeenCalled();
  });
  // Add more test cases to cover different scenarios, such as validation errors, existing user, etc.
});

describe('ConfirmEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should confirm the email and return a success message', async () => {
    // Mock the request object
    const req = {
      body: {
        confirmationCode: 'testcode',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the next function
    const next = jest.fn();

    // Mock the dependencies
    User.findOne.mockResolvedValue({
      email: 'testuser@example.com',
      username: 'testuser',
      save: jest.fn().mockResolvedValue(),
    });
    sendWelcomeEmail.mockResolvedValue();

    // Call the ConfirmEmail function
    await ConfirmEmail(req, res, next);

    // Assert that the necessary functions were called with the correct arguments
    expect(User.findOne).toHaveBeenCalledWith({ confirmationCode: 'testcode' });
    expect(sendWelcomeEmail).toHaveBeenCalledWith('testuser@example.com', 'testuser');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Your account has been confirmed',
    });
    expect(next).not.toHaveBeenCalled();
  });

  // Add more test cases to cover different scenarios, such as invalid confirmation code, etc.
});
describe('LoginSiteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login a site user and return a token', async () => {
    // Mock the request object
    const req = {
      body: {
        email: 'testuser@example.com',
        password: 'password123',
        rememberMe: false,
      },
      session: {},
      secure: false,
      headers: {
        'x-forwarded-proto': 'http',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    // Mock the User.findOne function to return a user with a valid password
    User.findOne.mockResolvedValue({
      password: await bcrypt.hash('password123', 10),
    });

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert the response
    expect(res.cookie).toHaveBeenCalledWith('jwt', expect.any(String), {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: expect.any(String),
      msg: 'LoggedIn',
    });
  });

  it('should return an error if email or password is missing', async () => {
    // Mock the request object with missing email and password
    const req = {
      body: {},
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      Error: 'Email and Password can not be Empty',
    });
  });

  it('should return an error if the email or password is invalid', async () => {
    // Mock the request object
    const req = {
      body: {
        email: 'invalid@example.com',
        password: 'password123',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User.findOne function to return null
    User.findOne.mockResolvedValue(null);

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      Error: 'Invalid Email or Password',
    });
  });

  it('should return an error if the password is invalid', async () => {
    // Mock the request object
    const req = {
      body: {
        email: 'testuser@example.com',
        password: 'invalidpassword',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Mock the User.findOne function to return a user with a different password
    User.findOne.mockResolvedValue({
      password: await bcrypt.hash('password123', 10),
    });

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({ auth: false, token: null });
  });

  // Add more test cases to cover different scenarios, such as rememberMe option, error handling, etc.
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset the password for a valid user', async () => {
    // Mock the request object
    const req = {
      params: {
        id: 'valid-id',
        token: 'valid-token',
      },
      body: {
        password: 'new-password',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the jwt.verify function to call the callback with no error
    jest.spyOn(jwt, 'verify').mockImplementation((token, key, callback) => {
      callback(null, {});
    });

    // Mock the User.findOneAndUpdate function to return a user
    User.findOneAndUpdate.mockResolvedValue({});

    // Call the ResetPassword function
    await ResetPassword(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({  msg: "Password has been reset successfully"});
  });


  it('should return an error if the user does not exist', async () => {
    // Mock the request object
    const req = {
      body: {
        email: 'invalid@example.com',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User.findOne function to return null
    User.findOne.mockResolvedValue(null);

    // Call the ForgotPassword function
    await ForgotPassword(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User with this email does not exist',
    });
  });

  // Add more test cases to cover different scenarios, such as error handling, token generation failure, etc.
});

// describe('ResetPassword', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should reset the password for a valid user', async () => {
//     // Mock the request object
//     const req = {
//       params: {
//         id: 'testuserid',
//         token: 'testtoken',
//       },
//       body: {
//         password: 'newpassword123',
//       },
//     };

//     // Mock the response object
//     const res = {
//       json: jest.fn(),
//       status: jest.fn().mockReturnThis(),
//     };

//     // Mock the jwt.verify function to call the callback with no error
//     jwt.verify.mockImplementation((token, key, callback) => {
//       callback(null, {});
//     });

//     // Mock the User.findOneAndUpdate function to return the updated user
//     User.findOneAndUpdate.mockResolvedValue({});

//     // Call the ResetPassword function
//     await ResetPassword(req, res);

//     // Assert the response
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.json).toHaveBeenCalledWith({
//       mgs: 'Password has been reset successfully',
//     });
//   });

//   it('should return an error if the token is invalid', async () => {
//     // Mock the request object
//     const req = {
//       params: {
//         id: 'testuserid',
//         token: 'invalidtoken',
//       },
//     };

//     // Mock the response object
//     const res = {
//       json: jest.fn(),
//     };

//     // Mock the jwt.verify function to call the callback with an error
//     jwt.verify.mockImplementation((token, key, callback) => {
//       callback(new Error('Invalid token'));
//     });

//     // Call the ResetPassword function
//     await ResetPassword(req, res);

//     // Assert the response
//     expect(res.json).toHaveBeenCalledWith({ Status: 'Error with token' });
//   });

//   it('should return an error if the user is not found', async () => {
//     // Mock the request object
//     const req = {
//       params: {
//         id: 'testuserid',
//         token: 'testtoken',
//       },
//       body: {
//         password: 'newpassword123',
//       },
//     };

//     // Mock the response object
//     const res = {
//       json: jest.fn(),
//     };

//     // Mock the jwt.verify function to call the callback with no error
//     jwt.verify.mockImplementation((token, key, callback) => {
//       callback(null, {});
//     });

//     // Mock the User.findOneAndUpdate function to return null
//     User.findOneAndUpdate.mockResolvedValue(null);

//     // Call the ResetPassword function
//     await ResetPassword(req, res);

//     // Assert the response
//     expect(res.json).toHaveBeenCalledWith(new Error('Employee not found'));
//   });

//   // Add more test cases to cover different scenarios, such as error handling, etc.
// });

describe('UpdatePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the password for a valid user', async () => {
    // Mock the request object
    const req = {
      params: {
        id: 'valid-id',
      },
      body: {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User.findById and User.save functions to return a user
    User.findById.mockResolvedValue({
      _id: 'valid-id',
      password: 'old-password',
      save: jest.fn(),
    });

    // Call the UpdatePassword function
    await UpdatePassword(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password updated successfully' });
  });

});