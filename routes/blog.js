/** @format */

const router = require("express").Router();
const ctrls = require("../controller/blog");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
router.post("/", [verifyAccessToken, isAdmin], ctrls.createBlog);
router.put("/like/:bid", verifyAccessToken, ctrls.likeBlog);
router.put(
  "/uploadimage/:bid",
  [verifyAccessToken, isAdmin],
  uploader.single("image"),
  ctrls.uploadImagesBlog
);
router.put("/dislike/:bid", verifyAccessToken, ctrls.dislikeBlog);
router.put("/:bid", [verifyAccessToken, isAdmin], ctrls.updateBlog);
router.delete("/:bid", [verifyAccessToken, isAdmin], ctrls.deleteBlog);
router.get("/one/:bid", ctrls.getBlog);
router.get("/", ctrls.getBlogs);

module.exports = router;
