/** @format */

const ctrls = require("../controller/product");
const router = require("express").Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/", [verifyAccessToken, isAdmin], ctrls.createProduct);
router.get("/", ctrls.getProducts);
router.get("/:uid", ctrls.getProduct);
router.delete("/:uid", [verifyAccessToken, isAdmin], ctrls.deleteProduct);
router.put("/:uid", [verifyAccessToken, isAdmin], ctrls.updateProduct);

module.exports = router;
