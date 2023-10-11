/** @format */

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  // cloud_name: process.env.CLOUDINARY_NAME,
  // api_key: process.env.CLOUDINARY_KEY,
  // api_secret: process.env.CLOUDINARY_SECRET,
  cloud_name: "dr5odgvjs",
  api_key: "473313456251965",
  api_secret: "Rd-nyuWWnXcb_146cTAvA8S_QsQ",
});

const storage = new CloudinaryStorage({
  cloudinary,
  allowedFormats: ["jpg", "png"],
  params: {
    folder: "ecommerce",
  },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
