/** @format */

const express = require("express");
const dbConnect = require("../config/dbconnect");
const initRoutes = require("../routes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

function createServer() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST", "DELETE", "PUT"],
      credentials: true,
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  dbConnect();
  initRoutes(app);

  return app;
}
module.exports = createServer;
