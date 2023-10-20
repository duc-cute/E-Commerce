/** @format */

const router = require("express").Router();
const ctrls = require("../controller/insertData");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", ctrls.insertProduct);
router.post("/cate", ctrls.insertProductCategory);

module.exports = router;
