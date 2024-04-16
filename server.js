/** @format */

const createServer = require("./ultils/server");
require("dotenv").config();

const port = process.env.PORT || 8888;
const app = createServer();
app.listen(port, () => {
  console.log("listent on the port", port);
});
