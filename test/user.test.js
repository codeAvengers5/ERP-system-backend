const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  generateConfirmationCode,
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
describe("RegisterSiteUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a site user and return a success message", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      cookie: jest.fn(),
    };
    const next = jest.fn();
    hashPassword.mockResolvedValue("hashedPassword");
    User.findOne.mockResolvedValue(null);
    const generateConfirmationCodeMock = jest.fn().mockReturnValue("testcode");
    generateToken.mockResolvedValue("testtoken");
    await RegisterSiteUser(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("ConfirmEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should confirm the email and return a success message", async () => {
    // Mock the request object
    const req = {
      body: {
        confirmationCode: "testcode",
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
      email: "testuser@example.com",
      username: "testuser",
      save: jest.fn().mockResolvedValue(),
    });
    sendWelcomeEmail.mockResolvedValue();

    // Call the ConfirmEmail function
    await ConfirmEmail(req, res, next);

    // Assert that the necessary functions were called with the correct arguments
    expect(User.findOne).toHaveBeenCalledWith({ confirmationCode: "testcode" });
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      "testuser@example.com",
      "testuser"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Your account has been confirmed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // Add more test cases to cover different scenarios, such as invalid confirmation code, etc.
});
describe("LoginSiteUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should login a site user and return a token", async () => {
    // Mock the request object
    const req = {
      body: {
        email: "testuser@example.com",
        password: "password123",
        rememberMe: false,
      },
      session: {},
      secure: false,
      headers: {
        "x-forwarded-proto": "http",
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
      password: await bcrypt.hash("password123", 10),
    });

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert the response
    expect(res.cookie).toHaveBeenCalledWith("jwt", expect.any(String), {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: expect.any(String),
      msg: "LoggedIn",
    });
  });

  it("should return an error if email or password is missing", async () => {
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
      Error: "Email and Password can not be Empty",
    });
  });

  it("should return an error if the email or password is invalid", async () => {
    // Mock the request object
    const req = {
      body: {
        email: "invalid@example.com",
        password: "password123",
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
      message: "Invalid Email or Password",
    });
  });

  it("should return an error if the password is invalid", async () => {
    // Mock the request object
    const req = {
      body: {
        email: "testuser@example.com",
        password: "invalidpassword",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User.findOne function to return a user with a different password
    User.findOne.mockResolvedValue({
      password: await bcrypt.hash("password123", 10),
    });

    // Mock the bcrypt.compareSync function
    bcrypt.compareSync = jest.fn().mockReturnValue(false);

    // Call the LoginSiteUser function
    await LoginSiteUser(req, res);

    // Assert that the necessary functions were called with the correct arguments
    expect(User.findOne).toHaveBeenCalledWith({
      email: "testuser@example.com",
    });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      "invalidpassword",
      expect.any(String)
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid Email or Password",
    });
  });
});

describe("ForgotPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset the password for a valid user", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "valid-id",
        token: "valid-token",
      },
      body: {
        password: "new-password",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the jwt.verify function to call the callback with no error
    jest.spyOn(jwt, "verify").mockImplementation((token, key, callback) => {
      callback(null, {});
    });

    // Mock the User.findOneAndUpdate function to return a user
    User.findOneAndUpdate.mockResolvedValue({});

    // Call the ResetPassword function
    await ResetPassword(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password has been reset successfully",
    });
  });

  it("should return an error if the user does not exist", async () => {
    // Mock the request object
    const req = {
      body: {
        email: "invalid@example.com",
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
      error: "User with this email does not exist",
    });
  });

  // Add more test cases to cover different scenarios, such as error handling, token generation failure, etc.
});

describe("ResetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset the password for a valid user", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "testuserid",
        token: "testtoken",
      },
      body: {
        password: "newpassword123",
      },
    };

    // Mock the response object
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock the jwt.verify function to call the callback with no error
    jwt.verify.mockImplementation((token, key, callback) => {
      callback(null, {});
    });

    // Mock the User.findOneAndUpdate function to return the updated user
    User.findOneAndUpdate.mockResolvedValue({});

    // Call the ResetPassword function
    await ResetPassword(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password has been reset successfully",
    });
  });

  it("should return an error if the token is invalid", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "testuserid",
        token: "invalidtoken",
      },
      body: {
        password: "new-password",
      },
    };

    const res = {
      json: jest.fn(),
    };
    jwt.verify.mockImplementation((token, key, callback) => {
      callback(new Error("Invalid token"));
    });
    await ResetPassword(req, res);
    expect(res.json).toHaveBeenCalledWith({ Status: "Error with token" });
  });

  it("should return an error if the user is not found", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "testuserid",
        token: "testtoken",
      },
      body: {
        password: "newpassword123",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the jwt.verify function to call the callback with no error
    jwt.verify.mockImplementation((token, key, callback) => {
      callback(null, {});
    });

    // Mock the User.findOneAndUpdate function to return null
    User.findOneAndUpdate.mockResolvedValue(null);

    // Call the ResetPassword function
    await ResetPassword(req, res);

    // Assert the response
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  // Add more test cases to cover different scenarios, such as error handling, etc.
});

describe("UpdatePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update the password for a valid user", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "valid-id",
      },
      body: {
        oldPassword: "correct-old-password",
        newPassword: "new-password",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the Employee.findById and Employee.save functions
    const mockEmployee = {
      _id: "valid-id",
      password: "correct-old-password",
      save: jest.fn().mockResolvedValue(),
    };
    User.findById.mockResolvedValue(mockEmployee);

    // Call the UpdatePassword function
    await UpdatePassword(req, res, jest.fn());

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400); // Expecting status 400 for incorrect old password
    expect(res.json).toHaveBeenCalledWith({
      error: "Old password is incorrect",
    });

    // Verify that Employee.findById was called with the correct arguments
    expect(User.findById).toHaveBeenCalledWith("valid-id");

    // Verify that the employee's password was not updated
    expect(mockEmployee.password).toBe("correct-old-password");

    // Verify that the employee's save function was not called
    expect(mockEmployee.save).not.toHaveBeenCalled();
  });

  it("should return an error if employee is not found", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "nonexistent-id",
      },
      body: {
        oldPassword: "old-password",
        newPassword: "new-password",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the Employee.findById function to return null (employee not found)
    User.findById.mockResolvedValue(null);

    // Call the UpdatePassword function
    await UpdatePassword(req, res, jest.fn());

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should return an error if old password is incorrect", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "valid-id",
      },
      body: {
        oldPassword: "incorrect-password",
        newPassword: "new-password",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User.findById function to return an employee
    const mockEmployee = {
      _id: "valid-id",
      password: "old-password",
    };
    User.findById.mockResolvedValue(mockEmployee);

    // Call the UpdatePassword function
    await UpdatePassword(req, res, jest.fn());

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Old password is incorrect",
    });
  });

  it("should return an error if an internal server error occurs", async () => {
    // Mock the request object
    const req = {
      params: {
        id: "valid-id",
      },
      body: {
        oldPassword: "old-password",
        newPassword: "new-password",
      },
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the Employee.findById function to throw an error
    User.findById.mockRejectedValue(new Error("Database error"));

    // Call the UpdatePassword function
    await UpdatePassword(req, res, jest.fn());

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
