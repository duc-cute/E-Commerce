/** @format */

const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: { type: mongoose.Types.ObjectId, ref: "Product" },
        quantity: Number,
        color: String,
        title: String,
        price: Number,
        thumb: String,
        sku: String,
      },
    ],
    status: {
      type: String,
      default: "Processing",
      enum: ["Cancelled", "Processing", "Successed"],
    },
    total: Number,
    orderBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    address: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
