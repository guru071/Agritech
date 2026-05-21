import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  productId: mongoose.Types.ObjectId;
  cropTitle: string;
  sellerPhone: string;
  sellerName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  unitsRequested: number;
  message: string;
  status: "Pending" | "Accepted" | "Rejected" | "Packed" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    cropTitle: { type: String, required: true },
    sellerPhone: { type: String, required: true },
    sellerName: { type: String, default: "AgriHub Official" },
    buyerName: { type: String, required: true, trim: true },
    buyerPhone: { type: String, required: true, trim: true },
    buyerEmail: { type: String, default: "", lowercase: true },
    unitsRequested: { type: Number, required: true, min: 1 },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
