import mongoose, { Schema, Document } from "mongoose";

export interface ILand3D extends Document {
  userId: mongoose.Types.ObjectId;
  pts: Array<{ x: number; z: number }>;
  terrainHeights: number[];
  tW: number;
  tH: number;
  createdAt: Date;
}

const Land3DSchema = new Schema<ILand3D>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    pts: [{ x: Number, z: Number }],
    terrainHeights: { type: [Number], required: true },
    tW: { type: Number, required: true },
    tH: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Land3D = mongoose.model<ILand3D>("Land3D", Land3DSchema);
