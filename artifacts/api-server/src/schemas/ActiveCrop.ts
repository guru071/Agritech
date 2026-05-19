import mongoose, { Schema, Document } from "mongoose";

export interface IActiveCrop extends Document {
  userId: mongoose.Types.ObjectId;
  cropName: string;
  variety: string;
  plantedDate: Date;
  fieldSize: number;
  wateringDays: number[];
  fertilizerDays: number[];
  fertilizerNames: string[];
  notes: string;
  createdAt: Date;
}

const ActiveCropSchema = new Schema<IActiveCrop>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cropName: { type: String, required: true, trim: true },
    variety: { type: String, default: "" },
    plantedDate: { type: Date, required: true },
    fieldSize: { type: Number, default: 1 },
    wateringDays: { type: [Number], default: [] },
    fertilizerDays: { type: [Number], default: [] },
    fertilizerNames: { type: [String], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ActiveCrop = mongoose.model<IActiveCrop>("ActiveCrop", ActiveCropSchema);
