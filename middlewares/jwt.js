/** @format */

const jwt = require("jsonwebtoken");
const generateAccessToken = (uid, role) =>
  jwt.sign({ _id: uid, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRE,
  });

const generateRefreshToken = (uid) =>
  jwt.sign({ _id: uid }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE,
  });

module.exports = { generateAccessToken, generateRefreshToken };
