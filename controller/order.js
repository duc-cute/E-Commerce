/** @format */

const Order = require("../models/order");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const user = require("../models/user");

const createOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { products, total, status, address } = req.body;

  const rs = await Order.create({
    products,
    total,
    status,
    orderBy: _id,
  });
  await User.findByIdAndUpdate(_id, { cart: [] });

  setTimeout(async () => {
    await Order.findByIdAndUpdate(rs._id, { status: "Successed" });
  }, [7 * 12 * 60 * 60 * 1000]);
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
  const { status } = req.query;
  // console.log("status", req.query);
  //Build Query
  const queryObj = { ...req.query };

  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]); //Delete fields unnecessary in query object

  //Format Query to order to in correct syntax mongoose
  let queryString = JSON.stringify(queryObj);
  queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );
  const formatQueries = JSON.parse(queryString);

  let q = { ...formatQueries, orderBy: _id };
  if (status) {
    q = { ...q, status };
  }
  try {
    let query = Order.find(q);

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    }

    //Paginations
    //limit: số object gọi về API
    //skip:2
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_PAGE;
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);

    const orders = await query;
    const countOrders = await Order.countDocuments(q);
    console.log("or", orders);

    return res.status(200).json({
      success: orders ? true : false,
      counts: countOrders,
      orders: orders ? orders : "Can't not find product",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error,
    });
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const response = await Order.find();
  return res.status(200).json({
    success: response ? true : false,
    getOrders: response ? response : "Something went wrong",
  });
});
module.exports = { createOrder, updateStatus, getOrder, getOrders };
