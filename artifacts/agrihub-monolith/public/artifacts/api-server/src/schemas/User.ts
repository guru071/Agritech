import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  subscriptionTier: "Free" | "Premium";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    subscriptionTier: { type: String, enum: ["Free", "Premium"], default: "Free" },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
