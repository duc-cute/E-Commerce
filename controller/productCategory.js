/** @format */

const ProductCategory = require("../models/productCategory");
const asyncHandler = require("express-async-handler");

const createCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw new Error("Missing inputs");
  const response = await ProductCategory.create(req.body);
  return res.status(200).json({
    success: response ? true : false,
    createdCategory: response ? response : "Can't create product category",
  });
});
const getCategory = asyncHandler(async (req, res) => {
  const response = await ProductCategory.find().select("title _id");
  return res.status(200).json({
    success: response ? true : false,
    getCategory: response ? response : "Can't find product category",
  });
});
const deleteCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  const response = await ProductCategory.findByIdAndDelete(pcid);
  return res.status(200).json({
    success: response ? true : false,
    deletedCategory: response ? response : "Can't delete product category",
  });
});
const updateCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  const response = await ProductCategory.findByIdAndUpdate(pcid, req.body, {
    now: true,
  });
  return res.status(200).json({
    success: response ? true : false,
    updatedCategory: response ? response : "Can't update product category",
  });
});

module.exports = {
  createCategory,
  getCategory,
  deleteCategory,
  updateCategory,
};
