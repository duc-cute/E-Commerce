/** @format */
const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugifyVietnamese = require("../ultils/slugifyVietNamese");
const makeSku = require("uniqid");
const User = require("../models/user");

const createProduct = asyncHandler(async (req, res) => {
  const { title, price, description, branch, category, color, quantity } =
    req.body;
  if (!(title && price && description && branch && category && color))
    throw new Error("Missing inputs");
  const thumb = req?.files?.thumb ? req.files.thumb[0].path : "";
  const images = req?.file?.images
    ? req?.files.images.map((el) => el.path)
    : [];

  req.body.slug = slugifyVietnamese(title);
  if (thumb) req.body.thumb = thumb;
  if (images) req.body.images = images;

  const newProduct = await Product.create(req.body);
  return res.status(200).json({
    success: newProduct ? true : false,
    newProduct: newProduct ? newProduct : "Can't not create new product",
  });
});
const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const product = await Product.findById(pid).populate({
    path: "ratings",
    populate: {
      path: "postedBy",
      select: "firstname lastname avatar",
    },
  });
  return res.status(200).json({
    success: product ? true : false,
    product: product ? product : "Can't not find product",
  });
});
const getProducts = asyncHandler(async (req, res) => {
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
  let colorQueryObj = {};
  //Filtering
  if (queryObj?.title)
    formatQueries.title = { $regex: queryObj.title, $options: "i" };
  if (queryObj?.category)
    formatQueries.category = { $regex: queryObj.category, $options: "i" };
  if (queryObj?.branch)
    formatQueries.branch = { $regex: queryObj.branch, $options: "i" };
  if (queryObj?.color) {
    delete formatQueries.color;
    const colorArr = queryObj.color.split(",");
    const colorQueryArr = colorArr.map((el) => ({
      color: { $regex: el, $options: "i" },
    }));
    colorQueryObj = { $or: colorQueryArr };
  }
  let queryObject = {};
  if (queryObj.q) {
    delete formatQueries.q;
    queryObject = {
      $or: [
        {
          title: { $regex: queryObj.q, $options: "i" },
        },
        {
          color: { $regex: queryObj.q, $options: "i" },
        },
        {
          branch: { $regex: queryObj.q, $options: "i" },
        },
        {
          category: { $regex: queryObj.q, $options: "i" },
        },
      ],
    };
  }

  const q = { ...colorQueryObj, ...formatQueries, ...queryObject };
  try {
    let query = Product.find(q);
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    }
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

    const products = await query;
    const countProducts = await Product.countDocuments(q);

    return res.status(200).json({
      success: products ? true : false,
      counts: countProducts,
      products: products ? products : "Can't not find product",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error,
    });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const files = req.files;
  if (files?.thumb) req.body.thumb = files.thumb[0].path;
  if (files?.images)
    req.body.images = [
      ...req.body.imgOld,
      ...files.images.map((el) => el.path),
    ];

  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  if (req.body && req.body.title)
    req.body.slug = slugifyVietnamese(req.body.title);

  const updateProduct = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updateProduct ? true : false,
    mes: updateProduct ? "Update product success" : "Can't not update product",
  });
});
const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const deleteProduct = await Product.findByIdAndDelete(pid);

  const resonse = await User.updateMany(
    { "cart.product": pid },
    {
      $pull: { cart: { product: pid } },
    }
  );
  return res.status(200).json({
    success: resonse ? true : false,
    deleteProduct: deleteProduct ? deleteProduct : "Can't not delete product",
  });
});

const ratings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, comment, pid, updatedAt = Date.now() } = req.body;

  if (!star && !pid) throw new Error("Missing inputs");
  const ratingProduct = await Product.findById(pid);
  const alreadyProduct = ratingProduct?.ratings?.find(
    (el) => el.postedBy.toString() === _id
  );
  if (alreadyProduct) {
    await Product.updateOne(
      {
        ratings: { $elemMatch: alreadyProduct },
      },
      {
        $set: {
          "ratings.$.star": star,
          "ratings.$.comment": comment,
          "ratings.$.updatedAt": updatedAt,
        },
      }
    );
  } else {
    await Product.findByIdAndUpdate(
      pid,
      {
        $push: {
          ratings: { star, comment, postedBy: _id, updatedAt },
        },
      },
      { new: true }
    );
  }
  const updatedProduct = await Product.findById(pid);
  const ratingCount = updatedProduct.ratings.length;
  const sumRating = updatedProduct.ratings.reduce(
    (sum, rating) => sum + rating.star,
    0
  );
  updatedProduct.totalRating = Math.round((sumRating * 10) / ratingCount) / 10;
  await updatedProduct.save();
  return res.status(200).json({
    success: true,
    updatedProduct,
  });
});

const uploadImagesProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (!req.files) throw new Error("Missing inputs");
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: { images: { $each: req.files.map((el) => el.path) } },
    },
    { new: true }
  );
  return res.status(200).json({
    success: true,
    updatedProduct: response ? response : " Can't upload Image",
  });
});

const addVarriant = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const { title, price, color } = req.body;
  let thumb;
  let images;
  if (Object.keys(req?.files).length > 0) {
    thumb = req?.files?.thumb[0].path;
    images = req?.files?.images.map((el) => el?.path);
  }
  if (!(title && price && color)) throw new Error("Missing inputs");
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: {
        varriants: {
          title,
          color,
          price,
          thumb,
          images,
          sku: makeSku().toUpperCase(),
        },
      },
    },
    { new: true }
  );
  return res.status(200).json({
    success: true,
    mes: response ? "Add Varriants is successfully!" : " Can't upload varriant",
  });
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  ratings,
  uploadImagesProduct,
  addVarriant,
};
