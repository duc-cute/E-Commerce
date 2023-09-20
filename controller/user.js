/** @format */

const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");
const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body; //Get data from body
  if (!email || !password || !firstname || !lastname)
    return res.status(400).json({
      sucess: false,
      mes: "Missing input",
    });

  const user = await User.findOne({ email });
  if (user) throw new Error("User has existed");
  else {
    const newUser = await User.create(req.body);
    return res.status(200).json({
      sucess: newUser ? true : false,
      mes: newUser
        ? "Register is successfully .Please go login"
        : "Something went wrong",
    });
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body; //Get data from body
  if (!email || !password)
    return res.status(400).json({
      sucess: false,
      mes: "Missing input",
    });
  const response = await User.findOne({ email });
  if (response && (await response.isCorrectPassword(password))) {
    const { password, role, ...userData } = response.toObject();
    const accessToken = generateAccessToken(response._id, role);
    const refreshToken = generateRefreshToken(response._id);

    await User.findByIdAndUpdate(response._id, { refreshToken }, { new: true }); //Save refresh token in database

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Invalid credentials!");
  }
});

const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user; //Get data from body
  const user = await User.findById(_id).select("-password -refreshToken -role");
  if (user) {
    return res.status(200).json({
      sucess: true,
      res: user ? user : "user not found",
    });
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie && !cookie.refreshToken)
    throw new Error("No fresh token in cookie");
  const rs = jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
  const response = await User.findOne({
    _id: rs._id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : "Refresh Token  not matched",
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken)
    throw new Error("Refresh Token not in cookie");
  //delete token in db
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    { new: true }
  );
  //delete token in cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({
    success: true,
    mes: "Logout is done",
  });
});

module.exports = {
  register,
  login,
  getCurrent,
  refreshAccessToken,
  logout,
};
