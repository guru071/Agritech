import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  sellerPhone: string;
  cropTitle: string;
  totalWeightKg: number;
  packagingUnitType: string;
  weightPerUnitKg: number;
  calculatedTotalUnits: number;
  adminVerificationStatus: "Awaiting_Hub_Delivery" | "Received_And_Paid" | "Listed_For_Retail";
  verifiedWeight: number | null;
  isOfficialHubProduct: boolean;
  imagePath: string;
  pricePerUnit: number;
  visibility: "Public" | "Hidden";
  isFeatured: boolean;
  payoutStatus: "Unpaid" | "Settled";
  payoutTransactionId: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    sellerName: { type: String, default: "AgriHub Official" },
    sellerPhone: { type: String, default: "" },
    cropTitle: { type: String, required: true, trim: true },
    totalWeightKg: { type: Number, required: true, min: 0.1 },
    packagingUnitType: { type: String, required: true },
    weightPerUnitKg: { type: Number, required: true, min: 0.1 },
    calculatedTotalUnits: { type: Number, required: true },
    adminVerificationStatus: {
      type: String,
      enum: ["Awaiting_Hub_Delivery", "Received_And_Paid", "Listed_For_Retail"],
      default: "Awaiting_Hub_Delivery",
    },
    verifiedWeight: { type: Number, default: null },
    isOfficialHubProduct: { type: Boolean, default: false },
    imagePath: { type: String, default: "" },
    pricePerUnit: { type: Number, default: 0 },
    visibility: { type: String, enum: ["Public", "Hidden"], default: "Public" },
    isFeatured: { type: Boolean, default: false },
    payoutStatus: { type: String, enum: ["Unpaid", "Settled"], default: "Unpaid" },
    payoutTransactionId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
