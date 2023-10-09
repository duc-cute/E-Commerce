/** @format */

const router = require("express").Router();
const ctrls = require("../controller/blog");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
router.post("/", [verifyAccessToken, isAdmin], ctrls.createBlog);
router.put("/like/:bid", verifyAccessToken, ctrls.likeBlog);
router.put("/dislike/:bid", verifyAccessToken, ctrls.dislikeBlog);
router.put("/:bid", [verifyAccessToken, isAdmin], ctrls.updateBlog);
router.get("/", ctrls.getBlogs);

module.exports = router;
