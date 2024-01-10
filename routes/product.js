/** @format */

const ctrls = require("../controller/product");
const router = require("express").Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");
router.put(
  "/uploadimage/:pid",
  [verifyAccessToken, isAdmin],
  uploader.array("images", 10),
  ctrls.uploadImagesProduct
);
router.post(
  "/",
  [verifyAccessToken, isAdmin],
  uploader.fields([
    { name: "images", maxCount: 5 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrls.createProduct
);
router.get("/:pid", ctrls.getProduct);
router.get("/", ctrls.getProducts);
router.delete("/:pid", [verifyAccessToken, isAdmin], ctrls.deleteProduct);
router.put("/ratings", verifyAccessToken, ctrls.ratings);
router.put(
  "/varriants/:pid",
  [verifyAccessToken, isAdmin],
  uploader.fields([
    { name: "images", maxCount: 5 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrls.addVarriant
);
router.put(
  "/:pid",
  [verifyAccessToken, isAdmin],
  uploader.fields([
    { name: "images", maxCount: 5 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrls.updateProduct
);

module.exports = router;
