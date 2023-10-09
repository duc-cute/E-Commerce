/** @format */

const ctrls = require("../controller/productCategory");
const router = require("express").Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken, isAdmin], ctrls.createCategory);
router.get("/", ctrls.getCategory);
router.delete("/:pcid", [verifyAccessToken, isAdmin], ctrls.deleteCategory);
router.put("/:pcid", [verifyAccessToken, isAdmin], ctrls.updateCategory);

module.exports = router;
