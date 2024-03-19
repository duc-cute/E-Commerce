/** @format */

const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");
const crypto = require("crypto");
const makeToken = require("uniqid");
const Product = require("../models/product");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");
const { users } = require("../ultils/constant");

// const register = asyncHandler(async (req, res) => {
//   const { email, password, search, lastname } = req.body; //Get data from body
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
      { refreshToken: newRefreshToken },
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
  const user = await User.findById(_id)
    .select("-password -refreshToken ")
    .populate({
      path: "cart",
      populate: {
        path: "product",
        select: "title thumb price category color",
      },
    })
    .populate({
      path: "wishlist",

      select: "title thumb price category color ",
    });
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

  //Filtering
  if (queryObj?.search) {
    delete formatQueries.search;

    formatQueries["$or"] = [
      { firstname: { $regex: queryObj.search, $options: "i" } },
      { lastname: { $regex: queryObj.search, $options: "i" } },
      { email: { $regex: queryObj.search, $options: "i" } },
    ];
  }

  try {
    let query = User.find(formatQueries);
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

    const users = await query;
    const countUsers = await User.countDocuments(formatQueries);

    return res.status(200).json({
      success: users ? true : false,
      counts: countUsers,
      users: users ? users : "Can't not find user",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error,
    });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (!uid) throw new Error("Missing inputs");
  const response = await User.findByIdAndDelete(uid);
  return res.status(200).json({
    success: response ? true : false,
    mes: response
      ? `User with email ${response.email} deleted`
      : "No user delete",
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { firstname, lastname, email, phone } = req.body;
  let avatar;
  if (req?.file) avatar = req?.file?.path;

  if (!_id || Object.keys(req.body).length === 0)
    throw new Error("Missing inputs");
  const response = await User.findByIdAndUpdate(
    _id,
    { firstname, lastname, email, phone, avatar },
    {
      new: true,
    }
  ).select("-password -role");
  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Update user is success" : "Something went wrong",
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
    mes: response ? "Update user success" : "Something went wrong",
  });
});

const addUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { name, phone, city, district, ward, addressDetail, defaultAddress } =
    req.body;
  if (!city || !district || !ward) throw new Error("Missing inputs");
  const currentUser = await User.findById(_id);

  if (currentUser.address.length === 0) {
    currentUser.address.push({
      city,
      district,
      ward,
      addressDetail,
      defaultAddress: true,
      name,
      phone,
    });
    const response = await currentUser.save();

    return res.status(200).json({
      success: response ? true : false,
      mes: response
        ? "Update Address is successfully!"
        : "Something went wrong",
    });
  } else {
    if (defaultAddress) {
      currentUser.address.map((addr) => (addr.defaultAddress = false));
    }
  }
  currentUser.address.push({
    city,
    district,
    ward,
    addressDetail,
    defaultAddress: defaultAddress,
    name,
    phone,
  });

  const response = await currentUser.save();

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Update Address is successfully!" : "Something went wrong",
  });
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { defaultAddress } = req.body;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  const currentUser = await User.findById(_id);

  if (defaultAddress)
    currentUser.address.map((addr) => (addr.defaultAddress = false));
  currentUser.address.id(id).set({
    ...req.body,
  });
  const response = await currentUser.save();

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Update Address is successfully!" : "Something went wrong",
  });
});

const removeUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  if (!id) throw new Error("Missing inputs");
  // 65491f79052f482954c2b5e0

  const response = await User.findByIdAndUpdate(
    _id,
    {
      $pull: { address: { _id: id } },
    },
    { new: true }
  );

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Remove Address is successfully!" : "Something went wrong",
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const {
    pid,
    quantity = 1,
    title = "",
    color = "",
    thumb,
    price,
    sku,
  } = req.body;
  if (!pid || !price || !title) throw new Error("Missing inputs");
  const user = await User.findById(_id).select("cart");
  const alreadyProduct = user?.cart.find(
    (el) =>
      el.product.toString() === pid && el.color === color && el.title === title
  );

  if (alreadyProduct) {
    const response = await User.updateOne(
      { cart: { $elemMatch: alreadyProduct } },
      { $set: { "cart.$.quantity": quantity } },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated your cart" : "Something went wrong",
    });
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $push: {
          cart: { product: pid, quantity, color, price, title, thumb, sku },
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated your cart" : "Something went wrong",
    });
  }
});

const removeCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, sku } = req.params;

  const user = await User.findById(_id).select("cart");
  // console.log("cart", user.cart);
  const alreadyProduct = user?.cart.find(
    (el) => el.product.toString() === pid || el.sku === sku
  );

  if (!alreadyProduct) {
    return res.status(200).json({
      success: true,
      mes: "Updated your cart",
    });
  }
  let response;
  if (sku !== "undefined") {
    console.log("lot1");
    console.log("sku", sku);
    response = await User.findByIdAndUpdate(
      _id,
      { $pull: { cart: { product: pid, sku: sku } } },
      { new: true }
    );
  } else {
    console.log("lot2");

    response = await User.findByIdAndUpdate(
      _id,
      { $pull: { cart: { product: pid } } },
      { new: true }
    );
  }

  return res.status(200).json({
    success: response ? true : false,
    mes: response ? "Updated your cart" : "Something went wrong",
  });
});
const createUsers = asyncHandler(async (req, res) => {
  const response = await User.create(users);
  return res.status(200).json({
    success: response ? true : false,
    users: response ? response : "Something went wrong",
  });
});
const updateWithList = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid } = req.body;
  if (!pid) throw new Error("Missing inputs");
  const user = await User.findById(_id);

  const alreadyProduct = user?.wishlist.find((el) => el.toString() === pid);

  if (alreadyProduct) {
    const response = await User.findByIdAndUpdate(
      _id,
      { $pull: { wishlist: pid } },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated your wishlist" : "Something went wrong",
    });
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      {
        $push: {
          wishlist: pid,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Updated your wishlist" : "Something went wrong",
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
  createUsers,
  removeCart,
  removeUserAddress,
  addUserAddress,
  updateWithList,
};
