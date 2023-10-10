/** @format */

const Brand = require("../models/brand");
const asyncHandler = require("express-async-handler");

const createBrand = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw new Error("Missing inputs");
  const response = await Brand.create(req.body);
  return res.status(200).json({
    success: response ? true : false,
    createdBrand: response ? response : "Can't create brand",
  });
});
const getBrand = asyncHandler(async (req, res) => {
  const response = await Brand.find().select("title _id");

  return res.status(200).json({
    success: response ? true : false,
    getBrand: response ? response : "Can't find brand",
  });
});
const deleteBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  const response = await Brand.findByIdAndDelete(brid);
  return res.status(200).json({
    success: response ? true : false,
    deletedBrand: response ? response : "Can't delete brand",
  });
});
const updateBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  const response = await Brand.findByIdAndUpdate(brid, req.body, {
    now: true,
  });
  return res.status(200).json({
    success: response ? true : false,
    updatedBrand: response ? response : "Can't update brand",
  });
});

module.exports = {
  createBrand,
  getBrand,
  deleteBrand,
  updateBrand,
};
