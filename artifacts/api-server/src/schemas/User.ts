import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  subscriptionTier: "Free" | "Premium";
  subscriptionStatus: "Pending_Payment" | "Active" | "Expired";
  subscriptionExpiresAt?: Date;
  accountStatus: "Active" | "Suspended";
  upiId: string;
  bankAccountNumber: string;
  ifscCode: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    subscriptionTier: { type: String, enum: ["Free", "Premium"], default: "Free" },
    subscriptionStatus: { type: String, enum: ["Pending_Payment", "Active", "Expired"], default: "Pending_Payment" },
    subscriptionExpiresAt: { type: Date },
    accountStatus: { type: String, enum: ["Active", "Suspended"], default: "Active" },
    upiId: { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
