import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  subscriptionTier: "Free" | "Premium";
<<<<<<< HEAD
  subscriptionStatus: "Pending_Payment" | "Active" | "Expired";
  subscriptionExpiresAt?: Date;
  accountStatus: "Active" | "Suspended";
  upiId: string;
  bankAccountNumber: string;
  ifscCode: string;
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    subscriptionTier: { type: String, enum: ["Free", "Premium"], default: "Free" },
<<<<<<< HEAD
    subscriptionStatus: { type: String, enum: ["Pending_Payment", "Active", "Expired"], default: "Pending_Payment" },
    subscriptionExpiresAt: { type: Date },
    accountStatus: { type: String, enum: ["Active", "Suspended"], default: "Active" },
    upiId: { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
