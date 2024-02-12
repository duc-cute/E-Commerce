/** @format */

const router = require("express").Router();
const ctrls = require("../controller/coupon");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken, isAdmin], ctrls.createCoupon);
router.get("/", ctrls.getCoupons);
router.put("/:cid", [verifyAccessToken, isAdmin], ctrls.updateCoupon);
router.delete("/:cid", [verifyAccessToken, isAdmin], ctrls.deleteCoupon);

module.exports = router;
