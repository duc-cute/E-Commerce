/** @format */
const ctrls = require("../controller/user");
const router = require("express").Router();

router.post("/register", ctrls.register);
module.exports = router;
