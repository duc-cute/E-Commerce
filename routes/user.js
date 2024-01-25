/** @format */
const ctrls = require("../controller/user");
const router = require("express").Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");

router.post("/register", ctrls.register);
router.post("/createUsers", ctrls.createUsers);
router.put("/finalregister/:token", ctrls.finalRegister);
router.post("/login", ctrls.login);
router.get("/current", verifyAccessToken, ctrls.getCurrent);
router.post("/refreshtoken", ctrls.refreshAccessToken);
router.get("/logout", ctrls.logout);
router.post("/forgotpassword", ctrls.forgotPassword);

router.put("/resetpassword", ctrls.resetPassword);
router.get("/", [verifyAccessToken, isAdmin], ctrls.getUsers);
router.delete("/:uid", [verifyAccessToken, isAdmin], ctrls.deleteUser);
router.put(
  "/current",
  verifyAccessToken,
  uploader.single("avatar"),
  ctrls.updateUser
);
router.put("/address", [verifyAccessToken], ctrls.updateUserAddress);
router.put("/cart", [verifyAccessToken], ctrls.updateCart);
router.delete("/remove-cart/:pid/:sku", [verifyAccessToken], ctrls.removeCart);
router.put("/:uid", [verifyAccessToken, isAdmin], ctrls.updateUserByAdmin);
module.exports = router;

//Create(POST) + PUT -> body
//GET + DELETE -> query
