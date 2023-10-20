/** @format */

const Order = require("../models/order");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const asyncHandler = require("express-async-handler");

const createOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { coupon } = req.body;

  const userCart = await User.findById(_id)
    .select("cart")
    .populate("cart.product", "title price");
  const products = userCart?.cart.map((el) => ({
    product: el.product._id,
    count: el.quantity,
    color: el.color,
  }));
  let total = userCart?.cart.reduce(
    (sum, el) => sum + el.quantity * el.product.price,
    0
  );
  if (coupon) {
    const selectedCoupon = await Coupon.findById(coupon);
    total = Math.round(total * (1 - selectedCoupon.discount / 100));
  }
  const rs = await Order.create({
    products,
    total,
    orderBy: _id,
    coupon: coupon,
  });
  return res.status(200).json({
    success: rs ? true : false,
    userCart: rs ? rs : "Can't find cart",
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { oid } = req.params;
  const { status } = req.body;
  if (!status) throw new Error("Missing inputs");
  const response = await Order.findByIdAndUpdate(
    oid,
    { status },
    { new: true }
  );
  return res.status(200).json({
    success: response ? true : false,
    updatedOrder: response ? response : "Something went wrong",
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const response = await Order.findOne({ orderBy: _id });
  return res.status(200).json({
    success: response ? true : false,
    getOrder: response ? response : "Something went wrong",
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const response = await Order.find();
  return res.status(200).json({
    success: response ? true : false,
    getOrders: response ? response : "Something went wrong",
  });
});
module.exports = { createOrder, updateStatus, getOrder, getOrders };
