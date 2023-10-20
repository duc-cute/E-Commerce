/** @format */

const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Types.ObjectId, ref: "Product" },
      count: Number,
      color: String,
    },
  ],
  status: {
    type: String,
    default: "Processing",
    enum: ["Processing", "Cancelled", "Successed"],
  },
  total: Number,
  paymentIntent: {},
  orderBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  coupon: { type: mongoose.Types.ObjectId, ref: "Coupon" },
});

//Export the model
module.exports = mongoose.model("Order", orderSchema);
