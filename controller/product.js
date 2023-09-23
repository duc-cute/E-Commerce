/** @format */
const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugifyVietnamese = require("../ultils/slugifyVietNamese");

const createProduct = asyncHandler(async (req, res) => {
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  if (req.body && req.body.title)
    req.body.slug = slugifyVietnamese(req.body.title);
  const newProduct = await Product.create(req.body);
  return res.status(200).json({
    success: newProduct ? true : false,
    newProduct: newProduct ? newProduct : "Can't not create new product",
  });
});
const getProduct = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const product = await Product.findById(uid);
  return res.status(200).json({
    success: product ? true : false,
    product: product ? product : "Can't not find product",
  });
});
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  return res.status(200).json({
    success: products ? true : false,
    products: products ? products : "Can't not find product",
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  if (req.body && req.body.title)
    req.body.slug = slugifyVietnamese(req.body.title);
  const updateProduct = await Product.findByIdAndUpdate(uid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateProduct ? true : false,
    updateProduct: updateProduct ? updateProduct : "Can't not update product",
  });
});
const deleteProduct = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const deleteProduct = await Product.findByIdAndDelete(uid);
  return res.status(200).json({
    success: deleteProduct ? true : false,
    deleteProduct: deleteProduct ? deleteProduct : "Can't not delete product",
  });
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
