/** @format */

const User = require("../models/user");
const asyncHandler = require("express-async-handler");

const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body; //Get data from body
  if (!email || !password || !firstname || !lastname)
    return res.status(400).json({
      sucess: false,
      mes: "Missing input",
    });
  const response = await User.create(req.body);
  return res.status(200).json({
    sucess: response ? true : false,
    response,
  });
});

module.exports = {
  register,
};
