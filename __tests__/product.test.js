import mongoose from "mongoose";
import supertest from "supertest";
import createServer from "../ultils/server";
const Product = require("../models/product");
const User = require("../models/user");

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();
const userInput = {
  email: "test@example.com",
  password: "password",
  firstname: "John",
  lastname: "Doe",
  mobile: "123456729",
  role: "admin",
};
describe("Authentication", () => {
  let accessToken;
  let userId;

  beforeAll(async () => {
    // Tạo một người dùng mới để sử dụng trong các bài kiểm tra
    const newUser = await User.create(userInput);

    userId = newUser._id;

    // Đăng nhập người dùng và nhận accessToken để thực hiện các yêu cầu có đăng nhập
    const loginResponse = await supertest(app).post("/api/user/login").send({
      email: "test@example.com",
      password: "password",
    });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Xóa người dùng đã tạo sau khi hoàn thành các bài kiểm tra
    await User.findByIdAndDelete(userId);
  });

  describe("createProduct function", () => {
    it("should throw an error if required inputs are missing", async () => {
      const response = await supertest(app)
        .post("/api/product")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          // Thiếu một số thông tin cần thiết
          title: "sp1",
          thumb: "thumb1",
          images: ["img1"],
        });

      expect(response.status).toBe(500); // Kiểm tra rằng phản hồi là lỗi 500
      expect(response.body.mes).toBe("Missing inputs"); // Kiểm tra rằng thông điệp lỗi đúng
    });

    it("should create a new product successfully", async () => {
      const response = await supertest(app)
        .post("/api/product")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Test Product",
          price: 100,
          description: ["Test description"],
          branch: "Test Branch",
          category: "Test Category",
          color: "Test Color",
          images: ["img1"],
          thumb: "img2",
          slug: "title1",
          quantity: 1,
        });
      expect(response.status).toBe(200); // Kiểm tra rằng phản hồi là thành công
      expect(response.body.success).toBe(true); // Kiểm tra rằng phản hồi có thành công hay không
      expect(response.body.newProduct).toBeDefined(); // Kiểm tra rằng sản phẩm mới đã được tạo
      // Kiểm tra rằng sản phẩm mới đã được tạo như mong đợi
    });
  });
  describe("updateProduct function", () => {
    let productId;

    beforeAll(async () => {
      // Tạo một sản phẩm mới để sử dụng trong các bài kiểm tra
      const newProduct = await Product.create({
        title: "Test Product",
        price: 100,
        description: "Test description",
        branch: "Test Branch",
        category: "Test Category",
        color: "Test Color",
      });

      productId = newProduct._id;
    });

    afterAll(async () => {
      // Xóa sản phẩm đã tạo sau khi hoàn thành các bài kiểm tra
      await Product.findByIdAndDelete(productId);
    });

    it("should throw an error if no update data provided", async () => {
      const response = await supertest(app)
        .put(`/api/product/${productId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(500); // Kiểm tra rằng phản hồi là lỗi 500
      expect(response.body.mes).toBe("Missing inputs"); // Kiểm tra rằng thông điệp lỗi đúng
    });

    it("should update the product successfully", async () => {
      const response = await supertest(app)
        .put(`/api/product/${productId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Updated Product Title",
          price: 200,
          description: "Updated description",
          branch: "Updated Branch",
          category: "Updated Category",
          color: "Updated Color",
        });

      expect(response.status).toBe(200); // Kiểm tra rằng phản hồi là thành công
      expect(response.body.success).toBe(true); // Kiểm tra rằng phản hồi có thành công hay không
      expect(response.body.mes).toBe("Update product success"); // Kiểm tra rằng thông điệp thành công đúng
    });
  });
  describe("ratings function", () => {
    let productId;

    beforeAll(async () => {
      // Tạo một sản phẩm mới để sử dụng trong các bài kiểm tra
      const newProduct = await Product.create({
        title: "Test Product",
        price: 100,
        description: "Test description",
        branch: "Test Branch",
        category: "Test Category",
        color: "Test Color",
      });

      productId = newProduct._id;
    });

    afterAll(async () => {
      // Xóa sản phẩm và người dùng đã tạo sau khi hoàn thành các bài kiểm tra
      await Product.findByIdAndDelete(productId);
    });

    it("should throw an error if required inputs are missing", async () => {
      const response = await supertest(app)
        .put(`/api/product/ratings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          // Thiếu một số thông tin cần thiết
        });

      expect(response.status).toBe(500); // Kiểm tra rằng phản hồi là lỗi 500
      expect(response.body.mes).toBe("Missing inputs"); // Kiểm tra rằng thông điệp lỗi đúng
    });

    it("should rate the product successfully", async () => {
      const response = await supertest(app)
        .put(`/api/product/ratings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          pid: productId,
          star: 5,
          comment: "Great product!",
          pid: productId,
        });

      expect(response.status).toBe(200); // Kiểm tra rằng phản hồi là thành công
      expect(response.body.success).toBe(true); // Kiểm tra rằng phản hồi có thành công hay không
      expect(response.body.updatedProduct).toBeDefined(); // Kiểm tra rằng sản phẩm đã được cập nhật
    });
  });
});
