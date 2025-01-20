import mongoose from "mongoose";
import SequenceFactory from "mongoose-sequence";

const AutoIncrement = SequenceFactory(mongoose);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 100 },
    image: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    favorit: { type: [String], default: [] },
    author: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
ProductSchema.plugin(AutoIncrement, { inc_field: "product_idx" });
const Product = mongoose.model("Product", ProductSchema);

export default Product;
