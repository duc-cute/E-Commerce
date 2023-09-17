/** @format */

const express = require("express");
const dbconnect = require("./config/dbconnect");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8888;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dbconnect();

app.use("/", (req, res) => {
  res.send("Welcome server!");
});

app.listen(port, () => {
  console.log("listent on the port", port);
});
