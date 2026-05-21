import mongoose, { Schema, Document } from "mongoose";

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userInitial: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "text";
  moderationStatus: "Visible" | "Hidden";
  createdAt: Date;
}

const StorySchema = new Schema<IStory>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userInitial: { type: String, required: true },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, default: "" },
  mediaType: { type: String, enum: ["image", "text"], default: "text" },
  moderationStatus: { type: String, enum: ["Visible", "Hidden"], default: "Visible" },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

export const Story = mongoose.model<IStory>("Story", StorySchema);
