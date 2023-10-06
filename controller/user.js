/** @format */

const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
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
    const { password, role, refreshToken, ...userData } = response.toObject();
    const accessToken = generateAccessToken(response._id, role);
    const newRefreshToken = generateRefreshToken(response._id);

    await User.findByIdAndUpdate(
      response._id,
      { newRefreshToken },
      { new: true }
    ); //Save refresh token in database

    res.cookie("refreshToken", newRefreshToken, {
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

//From refreshtoken in cookie , we'll get new access token
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

//Client gửi email
//Server check email Xem hợp lệ hay không => gửi mail + link (kèm token)
//client check email => click
//client gửi api kèm token
//server check token có giống token server gửi hay không
//Change password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new Error("Missing email");
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  const resetToken = user.createPasswordChangedToken();

  await user.save();
  const html = `Xin vui lòng click vào link này để đặt lại mật khẩu .
  <a href = ${process.env.URL_SERVER}/api/user/resetpassword/${resetToken}>Click here</a>`;

  const data = {
    email,
    html,
  };
  const rs = await sendMail(data);
  return res.status(200).json({
    success: true,
    rs,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpire: { $gt: Date.now() },
  });
  if (!user) throw new Error("Invalid reset token");

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  return res.status(200).json({
    success: user ? true : false,
    mes: user ? "Updated password" : "Something went wrong",
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const response = await User.find().select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    users: response ? response : "Something went wrong",
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) throw new Error("Missing inputs");
  const response = await User.findByIdAndDelete(_id);
  return res.status(200).json({
    success: response ? true : false,
    deleteUser: response
      ? `User with email ${response.email} deleted`
      : "No user delete",
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id || Object.keys(req.body).length === 0)
    throw new Error("Missing inputs");
  const response = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  }).select("-password -role");
  return res.status(200).json({
    success: response ? true : false,
    updateUser: response ? response : "Something went wrong",
  });
});
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  const response = await User.findByIdAndUpdate({ _id: uid }, req.body, {
    new: true,
  }).select("-password -role");
  return res.status(200).json({
    success: response ? true : false,
    updateUser: response ? response : "Something went wrong",
  });
});

module.exports = {
  register,
  login,
  getCurrent,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
};
