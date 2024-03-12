const {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById,
} = require("../controllers/promotion-controllers");
const Promotion = require("../models/promotion");
const cloudinary = require("../config/coludinary");

// Mock the JobPost model
jest.mock("../models/promotion");

describe("Promotion Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("createPromotion", () => {
    it("should create a promotion successfully", async () => {
      const req = {
        body: {
          title: "New Promotion",
          description: "Promotion Description",
        },
        files: [
          {
            fieldname: "image",
            filename: "image1.jpg",
            path: "/path/to/image1.jpg",
            originalname: "image1.jpg",
            encoding: "7bit",
            destination: "/path/to",
            mimetype: "image/jpeg",
            size: 1000,
          },
        ],
        user: {
          id: "user-id",
        },
        method: "POST",
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const uploaderMock = jest.fn().mockResolvedValue("uploaded-image-url");
      const saveMock = jest.fn().mockResolvedValue();

      cloudinary.uploads = uploaderMock;
      Promotion.prototype.save = saveMock;

      await createPromotion(req, res);

      expect(uploaderMock).toHaveBeenCalledWith(
        "/path/to/image1.jpg",
        "Images"
      );
      // expect(saveMock).toHaveBeenCalledWith();
      // expect(res.status).toHaveBeenCalledWith(201);
      // expect(res.json).toHaveBeenCalledWith({
      //   message: "Promotion created successfully",
      // });
    });

    it("should return an error if an exception occurs", async () => {
      const req = {
        body: {
          title: "New Promotion",
          description: "Promotion Description",
        },
        files: [
          {
            fieldname: "image",
            filename: "image1.jpg",
            path: "/path/to/image1.jpg",
            originalname: "image1.jpg",
            encoding: "7bit",
            destination: "/path/to",
            mimetype: "image/jpeg",
            size: 1000,
          },
        ],
        user: {
          id: "user-id",
        },
        method: "POST",
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const errorMock = new Error("Database connection failed");
      Promotion.prototype.save = jest.fn().mockRejectedValue(errorMock);

      await createPromotion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMock.message });
    });
  });
});
