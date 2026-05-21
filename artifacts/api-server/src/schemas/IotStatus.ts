import mongoose, { Schema, Document } from "mongoose";

export interface IIotStatus extends Document {
  userId: mongoose.Types.ObjectId;
  pumpStatus: boolean;
  valveStatus: boolean;
  foggerStatus: boolean;
  fanStatus: boolean;
  autoRulesEnabled: boolean;
  createdAt: Date;
}

const IotStatusSchema = new Schema<IIotStatus>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    pumpStatus: { type: Boolean, default: false },
    valveStatus: { type: Boolean, default: false },
    foggerStatus: { type: Boolean, default: false },
    fanStatus: { type: Boolean, default: false },
    autoRulesEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const IotStatus = mongoose.model<IIotStatus>("IotStatus", IotStatusSchema);
