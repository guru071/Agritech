import mongoose, { Schema, Document } from "mongoose";

export interface ILandListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  sellerPhone: string;
  title: string;
  totalAcreage: number;
  pricePerSqFt: number;
  totalPrice: number;
  status: "Available" | "Sold";
  adminApprovalStatus: "Pending" | "Approved" | "Rejected";
  imagePath: string;
  location: string;
  visibility: "Public" | "Hidden";
  isFeatured: boolean;
  createdAt: Date;
}

const LandListingSchema = new Schema<ILandListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String, required: true },
    sellerPhone: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    totalAcreage: { type: Number, required: true, min: 0.01 },
    pricePerSqFt: { type: Number, required: true, min: 0.01 },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["Available", "Sold"], default: "Available" },
    adminApprovalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    imagePath: { type: String, default: "" },
    location: { type: String, default: "" },
    visibility: { type: String, enum: ["Public", "Hidden"], default: "Public" },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LandListing = mongoose.model<ILandListing>("LandListing", LandListingSchema);
