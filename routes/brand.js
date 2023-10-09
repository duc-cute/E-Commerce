/** @format */

const router = require("express").Router();

const ctrls = require("../controller/brand");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken, isAdmin], ctrls.createBrand);
router.get("/", ctrls.getBrand);
router.delete("/:brid", [verifyAccessToken, isAdmin], ctrls.deleteBrand);
router.put("/:brid", [verifyAccessToken, isAdmin], ctrls.updateBrand);

module.exports = router;
