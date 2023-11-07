/** @format */

const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
const makeToken = require("uniqid");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");

// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname } = req.body; //Get data from body
//   if (!email || !password || !firstname || !lastname)
//     return res.status(400).json({
//       success: false,
//       mes: "Missing input",
//     });

//   const user = await User.findOne({ email });
//   if (user) throw new Error("User has existed");
//   else {
//     const newUser = await User.create(req.body);
//     return res.status(200).json({
//       success: newUser ? true : false,
//       mes: newUser
//         ? "Register is successfully .Please go login"
//         : "Something went wrong",
//     });
//   }
// });

//Use cookie
// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstname, lastname, mobile } = req.body; //Get data from body
//   if (!email || !password || !firstname || !lastname || !mobile)
//     return res.status(400).json({
//       success: false,
//       mes: "Missing input",
//     });

//   const user = await User.findOne({ email });
//   if (user) throw new Error("User has existed");
//   else {
//     const token = makeToken();
//     res.cookie(
//       "dataregister",
//       { ...req.body, token },
//       {
//         httpOnly: true,
//         maxAge: 15 * 60 * 1000,
//       }
//     );

//     const html = `Xin vui lòng click vào link này để hoàn tất việc đăng kí .
//     <a href = ${process.env.URL_SERVER}/api/user/finalregister/${token}>Click here</a>`;

//     await sendMail({ email, html, subject: "Register Account" });
//     return res.status(200).json({
//       success: true,
//       mes: "Please check your account",
//     });
//   }
// });

const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname, mobile } = req.body; //Get data from body
  if (!email || !password || !firstname || !lastname || !mobile)
    return res.status(400).json({
      success: false,
      mes: "Missing input",
    });

  const user = await User.findOne({ email });
  if (user) throw new Error("User has existed");
  else {
    const token = makeToken();
    const emailEdited = btoa(email) + "@" + token;
    const newUser = await User.create({
      email: emailEdited,
      password,
      firstname,
      lastname,
      mobile,
    });
    if (newUser) {
      const html = `<h2>Register code:</h2><br/><blockquote>${token}</blockquote/>`;

      await sendMail({
        email,
        html,
        subject: "Confirm register account in Ecommerce",
      });
    }
    setTimeout(async () => {
      await User.deleteOne({ email: emailEdited });
    }, [15 * 60 * 1000]);
    return res.status(200).json({
      success: newUser ? true : false,
      mes: newUser
        ? "Please check your email to active account"
        : "Somethings went wrong",
    });
  }
});

// const finalRegister = asyncHandler(async (req, res) => {
//   const { token } = req.params;

//   const cookie = req.cookies;

//   console.log(cookie);

//   if (!cookie || cookie?.dataregister?.token !== token) {
//     res.clearCookie("dataregister", {
//       httpOnly: true,
//       secure: true,
//     });
//     return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`);
//   }

//   const newUser = await User.create({
//     email: cookie?.dataregister?.email,
//     password: cookie?.dataregister?.password,
//     mobile: cookie?.dataregister?.mobile,
//     firstname: cookie?.dataregister?.firstname,
//     lastname: cookie?.dataregister?.lastname,
//   });
//   console.log(newUser);
//   if (newUser) {
//     res.clearCookie("dataregister", {
//       httpOnly: true,
//       secure: true,
//     });
//     return res.redirect(`${process.env.CLIENT_URL}/finalregister/success`);
//   } else {
//     res.clearCookie("dataregister", {
//       httpOnly: true,
//       secure: true,
//     });
//     return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`);
//   }
// });

const finalRegister = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const noteActiveUser = await User.findOne({ email: new RegExp(`${token}$`) });
  if (noteActiveUser) {
    noteActiveUser.email = atob(noteActiveUser.email.split("@")[0]);
    noteActiveUser.save();
  }
  return res.status(200).json({
    success: noteActiveUser ? true : false,
    mes: noteActiveUser ? "Register is successfully" : "Somethings went wrong",
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body; //Get data from body
  if (!email || !password)
    return res.status(400).json({
      success: false,
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
      success: true,
      res: user ? user : "user not found",
    });
  }
});

//From refreshtoken in cookie , we'll get new access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken)
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
  const { email } = req.body;
  if (!email) throw new Error("Missing email");
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  const resetToken = user.createPasswordChangedToken();

  await user.save();
  const html = `Xin vui lòng click vào link này để đặt lại mật khẩu .
  <a href = ${process.env.CLIENT_URL}/reset-password/${resetToken}>Click here</a>`;

  const data = {
    email,
    html,
    subject: "Forgot Password",
  };
  const rs = await sendMail(data);

  return res.status(200).json({
    success: rs.response.includes("OK") ? true : false,
    mes: rs.response.includes("OK")
      ? "Check your email"
      : "Some things went wrong!",
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

const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { address } = req.body;
  if (!address) throw new Error("Missing inputs");
  console.log("Address", address);
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: address } },
    { new: true }
  ).select("-password -role");
  console.log("rés", response);
  return res.status(200).json({
    success: response ? true : false,
    updateUser: response ? response : "Something went wrong",
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, quantity, color } = req.body;
  if (!pid || !quantity || !color) throw new Error("Missing inputs");
  const user = await User.findById(_id);
  console.log("user", user);
  const alreadyProduct = user?.cart.find((el) => el.product.toString() === pid);
  console.log("alreadyProduct", alreadyProduct);

  if (alreadyProduct) {
    console.log(alreadyProduct.color === color);
    if (alreadyProduct.color === color) {
      const response = await User.updateOne(
        { cart: { $elemMatch: alreadyProduct } },
        { $set: { "cart.$.quantity": quantity } },
        { new: true }
      );
      return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : "Something went wrong",
      });
    } else {
      const response = await User.findByIdAndUpdate(
        _id,
        { $push: { cart: { product: pid, quantity, color } } },
        { new: true }
      );
      return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? response : "Something went wrong",
      });
    }
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $push: { cart: { product: pid, quantity, color } },
      },
      { new: true }
    );
    console.log("product: pid, quantity, color", pid, quantity, color);
    return res.status(200).json({
      success: response ? true : false,
      updateUser: response ? response : "Something went wrong",
    });
  }
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
  updateUserAddress,
  updateCart,
  finalRegister,
};
