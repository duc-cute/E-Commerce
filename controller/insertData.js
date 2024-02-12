/** @format */

// /** @format */

// const asyncHandler = require("express-async-handler");
// const Product = require("../models/product");
// const ProductCategory = require("../models/productCategory");
// const slugify = require("../ultils/slugifyVietNamese");
// const data = require("../data/data2.json");
// const dataCate = require("../data/cate_brand");

// const fn = async (product) => {
//   await Product.create({
//     title: product?.name,
//     slug: slugify(product?.name),
//     description: product?.description,
//     branch: product?.brand,
//     price: Math.round(Number(product?.price.match(/\d/g).join("")) / 100),
//     category: product?.category[1],
//     quantity: Math.round(Math.random() * 1000),
//     sold: Math.round(Math.random() * 100),
//     images: product?.images,
//     color: product?.variants.find((el) => el.label === "Color")?.variants[0],
//     thumb: product?.thumb,
//     totalRating: 0,
//   });
// };

// const fn2 = async (productCategory) => {
//   await ProductCategory.create({
//     title: productCategory?.cate,
//     brand: productCategory?.brand,
//     slug: slugify(productCategory?.cate),
//     image: productCategory?.image,
//     icon: productCategory?.icon,
//   });
// };

// const insertProduct = asyncHandler(async (req, res) => {
//   const promises = [];
//   console.log(data);
//   for (let product of data) promises.push(fn(product));
//   await Promise.all(promises);
//   return res.json("Done");
// });

// const insertProductCategory = asyncHandler(async (req, res) => {
//   const promises = [];
//   for (let product of dataCate) promises.push(fn2(product));
//   await Promise.all(promises);
//   return res.json("Done");
// });

// module.exports = { insertProduct, insertProductCategory };
