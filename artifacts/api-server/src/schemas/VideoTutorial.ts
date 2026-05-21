import mongoose, { Schema, Document } from "mongoose";

export interface IVideoTutorial extends Document {
  title: string;
  videoUrl: string;
  category: string;
  language: string;
  description: string;
  createdAt: Date;
}

const VideoTutorialSchema = new Schema<IVideoTutorial>(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const VideoTutorial = mongoose.model<IVideoTutorial>("VideoTutorial", VideoTutorialSchema);
