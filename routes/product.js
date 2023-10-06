/** @format */

const ctrls = require("../controller/product");
const router = require("express").Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/", [verifyAccessToken, isAdmin], ctrls.createProduct);
router.get("/:uid", ctrls.getProduct);
router.get("/", ctrls.getProducts);
router.delete("/:uid", [verifyAccessToken, isAdmin], ctrls.deleteProduct);
router.put("/ratings", verifyAccessToken, ctrls.ratings);
router.put("/:uid", [verifyAccessToken, isAdmin], ctrls.updateProduct);

module.exports = router;
