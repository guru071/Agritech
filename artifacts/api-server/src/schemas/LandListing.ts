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
<<<<<<< HEAD
  visibility: "Public" | "Hidden";
  isFeatured: boolean;
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
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
<<<<<<< HEAD
    visibility: { type: String, enum: ["Public", "Hidden"], default: "Public" },
    isFeatured: { type: Boolean, default: false },
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  },
  { timestamps: true }
);

export const LandListing = mongoose.model<ILandListing>("LandListing", LandListingSchema);
