const express=require("express")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const hashPassword = require("../middleware/hashPassword");
const generateToken = require("../middleware/generateToken");
const Joi = require("joi")
const {
  generateConfirmationCode,
} = require("../helpers/generateConfirmationCode");
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendRestPasswordLink,
} = require("../helpers/sendConfirmationEmail");
const {
  RegisterSiteUser,
  ConfirmEmail,
  LoginSiteUser,
  ForgotPassword,
  ResetPassword,
} = require("../controllers/siteuser-contollers");

const app = express();
app.use(express.json());

app.post("/register", RegisterSiteUser);
jest.mock("jsonwebtoken");
jest.mock("bcryptjs");
jest.mock("../models/user");
jest.mock("../middleware/hashPassword");
jest.mock("../middleware/generateToken");
jest.mock("../helpers/generateConfirmationCode");
jest.mock("../helpers/sendConfirmationEmail");

describe("User Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      cookie: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      cookie: jest.fn()
    };
    next = jest.fn();
  });

  describe("RegisterSiteUser Controller", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully register a new user", async () => {
      const mockUser = {
        _id: "123",
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedpassword");
      generateToken.mockResolvedValue("generatedtoken");
      generateConfirmationCode.mockReturnValue("confirmationcode");
      sendConfirmationEmail.mockResolvedValue(true);

      req.body = {
        username: "testuser",
        email: "test@example.com",
        password: "Test1234!",
      };

      await RegisterSiteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(hashPassword).toHaveBeenCalledWith("Test1234!");
      expect(res.cookie).toHaveBeenCalledWith("jwt", "generatedtoken", {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

	it("should return validation errors", async () => {
		// Arrange
		const validationError = {
		  error: {
			details: [
			  {
				message: "Validation error message",
			  },
			],
		  },
		};
	  
		const validateMock = jest.spyOn(Joi, 'validate')
		  .mockReturnValue(validationError);
	  
		const req = {
		  body: {
			// sample request body
		  },
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		};
	  
		const next = jest.fn();
	  
		// Act
		await RegisterSiteUser(req, res, next);
	  
		// Assert
		expect(validateMock).toHaveBeenCalledWith(req.body, expect.any(Function));
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(validationError);
		expect(next).not.toHaveBeenCalled();
	  });
    it("should return error if email already exists", async () => {
      User.findOne.mockResolvedValue({ email: "test@example.com" });

      req.body = {
        username: "testuser",
        email: "test@example.com",
        password: "Test1234!",
      };

      await RegisterSiteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({error:"Email already exists"});
    });

	it("should return error if hashing password fails", async () => {
		// Arrange
		const hashPasswordMock = jest.spyOn(bcrypt, 'hash')
		  .mockImplementation(() => {
			throw new Error('Error hashing password');
		  });
	  
		const req = {
		  body: {
			// sample request body
		  },
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		};
	  
		const next = jest.fn();
	  
		// Act
		await RegisterSiteUser(req, res, next);
	  
		// Assert
		expect(hashPasswordMock).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Error hashing password' });
		expect(next).not.toHaveBeenCalled();
	  });
    it("should return error if token generation fails", async () => {
      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedpassword");
      generateToken.mockResolvedValue(null);

      req.body = {
        username: "testuser",
        email: "test@example.com",
        password: "Test1234!",
      };

      await RegisterSiteUser(req, res, next);

	  expect(res.status).toHaveBeenCalledWith(500);
	  expect(res.json).toHaveBeenCalledWith({ error: 'Error generating authentication token' });
		  });
  });
describe("ConfirmEmail", () => {
	let req, res, next;
  
	beforeEach(() => {
	  req = { body: { confirmationCode: "confirmationCode" } };
	  res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn(),
	  };
	  next = jest.fn();
	});
  
	it("should confirm a user's email", async () => {
	  const user = {
		email: "test@example.com",
		username: "testuser",
		isConfirmed: false,
		confirmationCode: "confirmationCode",
		save: jest.fn().mockResolvedValue(),
	  };
  
	  User.findOne.mockResolvedValue(user);
	  sendWelcomeEmail.mockResolvedValue();
  
	  await ConfirmEmail(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ confirmationCode: "confirmationCode" });
	  expect(user.isConfirmed).toBe(true);
	  expect(user.confirmationCode).toBe("Confirmed");
	  expect(user.save).toHaveBeenCalled();
	  expect(sendWelcomeEmail).toHaveBeenCalledWith("test@example.com", "testuser");
	  expect(res.status).toHaveBeenCalledWith(200);
	  expect(res.json).toHaveBeenCalledWith({ success: true, message: "Your account has been confirmed" });
	});
  
	it("should handle invalid confirmation code", async () => {
		// Arrange
		const findOneMock = jest.spyOn(User, 'findOne')
		  .mockReturnValue(null);
	  
		const req = {
		  body: {
			confirmationCode: "confirmationCode",
		  },
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		};
	  
		const next = jest.fn();
	  
		// Act
		await ConfirmEmail(req, res, next);
	  
		// Assert
		expect(findOneMock).toHaveBeenCalledWith({ confirmationCode: "confirmationCode" });
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid confirmation code/User not found" });
		expect(next).not.toHaveBeenCalled();
	  });
  
	  it("should handle errors gracefully", async () => {
		// Arrange
		const findOneMock = jest.spyOn(User, 'findOne')
		  .mockImplementation(() => {
			throw new Error('Some error occurred');
		  });
	  
		const req = {
		  body: {
			confirmationCode: "confirmationCode",
		  },
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		};
	  
		const next = jest.fn();
	  
		// Act
		await ConfirmEmail(req, res, next);
	  
		// Assert
		expect(findOneMock).toHaveBeenCalledWith({ confirmationCode: "confirmationCode" });
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
		expect(next).not.toHaveBeenCalled();
	  });
  });
  describe("LoginSiteUser", () => {
	let req, res, next;
  
	beforeEach(() => {
	  req = {
		body: {
		  email: "test@example.com",
		  password: "Password123!",
		  rememberMe: true,
		},
	  };
	  res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn(),
		cookie: jest.fn(),
	  };
	  next = jest.fn();
	});
  
	it("should login a user and return a token", async () => {
	  const account = {
		_id: "userId",
		email: "test@example.com",
		username: "testuser",
		password: "hashedPassword",
	  };
  
	  User.findOne.mockResolvedValue(account);
	  bcrypt.compareSync.mockReturnValue(true);
	  generateToken.mockResolvedValue("token");
  
	  await LoginSiteUser(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(bcrypt.compareSync).toHaveBeenCalledWith("Password123!", "hashedPassword");
	  expect(generateToken).toHaveBeenCalledWith({ id: "userId" });
	  expect(res.cookie).toHaveBeenCalledWith("jwt", "token", {
		httpOnly: true,
		secure: false,
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	  });
	  expect(res.status).toHaveBeenCalledWith(200);
	  expect(res.json).toHaveBeenCalledWith({
		siteuserInfo: { accountId: "userId", email: "test@example.com", username: "testuser" },
		message: "LoggedIn",
	  });
	});
  
	it("should return 400 if email or password is missing", async () => {
	  req.body = { email: "", password: "" };
  
	  await LoginSiteUser(req, res, next);
  
	  expect(res.status).toHaveBeenCalledWith(400);
	  expect(res.json).toHaveBeenCalledWith({ message: "Email and Password can not be Empty" });
	});
  
	it("should return 400 if email or password is invalid", async () => {
	  User.findOne.mockResolvedValue(null);
  
	  await LoginSiteUser(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(res.status).toHaveBeenCalledWith(400);
	  expect(res.json).toHaveBeenCalledWith({ message: "Invalid Email or Password" });
	});
  
	it("should return 400 if password is incorrect", async () => {
	  const account = {
		_id: "userId",
		email: "test@example.com",
		username: "testuser",
		password: "hashedPassword",
	  };
  
	  User.findOne.mockResolvedValue(account);
	  bcrypt.compareSync.mockReturnValue(false);
  
	  await LoginSiteUser(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(bcrypt.compareSync).toHaveBeenCalledWith("Password123!", "hashedPassword");
	  expect(res.status).toHaveBeenCalledWith(400);
	  expect(res.json).toHaveBeenCalledWith( {"message": "Invalid Email or Password"});
	});
  });

  describe("ForgotPassword", () => {
	it("should send a reset password link", async () => {
	  req.body = { email: "test@example.com" };
  
	  const user = { _id: "userId", email: "test@example.com" };
  
	  User.findOne.mockResolvedValue(user);
	  generateToken.mockResolvedValue("token");
	  sendRestPasswordLink.mockResolvedValue();
  
	  await ForgotPassword(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(generateToken).toHaveBeenCalledWith({ id: "userId" });
	  expect(sendRestPasswordLink).toHaveBeenCalledWith("test@example.com", "userId", "token");
	  expect(res.cookie).toHaveBeenCalledWith("jwt", "token", {
		httpOnly: true,
		secure: false,
		maxAge: 7 * 24 * 60 * 60 * 1000,
	  });
	  expect(res.status).toHaveBeenCalledWith(200);
	  expect(res.json).toHaveBeenCalledWith({   "mgs": "verfiy with the link", token: "token", id: "userId" });
	});
  
	it("should return 400 if user with provided email does not exist", async () => {
	  req.body = { email: "nonexistent@example.com" };
  
	  User.findOne.mockResolvedValue(null);
  
	  await ForgotPassword(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
	  expect(res.status).toHaveBeenCalledWith(400);
	  expect(res.json).toHaveBeenCalledWith({ error: "User with this email does not exist" });
	});
  
	it("should return 500 if token generation fails", async () => {
	  req.body = { email: "test@example.com" };
  
	  const user = { _id: "userId", email: "test@example.com" };
  
	  User.findOne.mockResolvedValue(user);
	  generateToken.mockResolvedValue(null); // Simulating token generation failure
  
	  await ForgotPassword(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(generateToken).toHaveBeenCalledWith({ id: "userId" });
	  expect(res.status).toHaveBeenCalledWith(500);
	  expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
  
	it("should return 500 if sending reset password link fails", async () => {
	  req.body = { email: "test@example.com" };
  
	  const user = { _id: "userId", email: "test@example.com" };
  
	  User.findOne.mockResolvedValue(user);
	  generateToken.mockResolvedValue("token");
	  sendRestPasswordLink.mockRejectedValue(new Error("Sending email failed")); // Simulating sending email failure
  
	  await ForgotPassword(req, res, next);
  
	  expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
	  expect(generateToken).toHaveBeenCalledWith({ id: "userId" });
	  expect(sendRestPasswordLink).toHaveBeenCalledWith("test@example.com", "userId", "token");
	  expect(res.status).toHaveBeenCalledWith(500);
	  expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
	});
  });
  

  describe("ResetPassword", () => {
    it("should reset a user's password", async () => {
      req.params = { id: "userId", token: "token" };
      req.body = { password: "NewPassword123!" };

      bcrypt.hash.mockResolvedValue("hashedPassword");
      jwt.verify.mockImplementation((token, key, callback) => {
        callback(null, { id: "userId" });
      });

      User.findOneAndUpdate.mockResolvedValue({});

      await ResetPassword(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "userId" },
        { $set: { password: "hashedPassword" } },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mgs: "Password has been reset successfully" });
    });
  });

//   describe("UpdatePassword", () => {
//     it("should update a user's password", async () => {
//       req.params = { id: "userId" };
//       req.body = { oldPassword: "OldPassword123!", newPassword: "NewPassword123!" };

//       const user = {
//         _id: "userId",
//         password: "hashedOldPassword",
//         save: jest.fn().mockResolvedValue(),
//       };

//       User.findById.mockResolvedValue(user);
//       bcrypt.compareSync.mockReturnValue(true);
//       bcrypt.hash.mockResolvedValue("hashedOldPassword");

//       await UpdatePassword(req, res, next);

//       expect(User.findById).toHaveBeenCalledWith("userId");
//       expect(bcrypt.compareSync).toHaveBeenCalledWith("OldPassword123!", "hashedOldPassword");
//       expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
//       expect(user.password).toBe("hashedOldPassword");
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({ success: true, message: "Password updated successfully" });
//     });
//   });
});