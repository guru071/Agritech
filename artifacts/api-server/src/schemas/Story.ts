import mongoose, { Schema, Document } from "mongoose";

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userInitial: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "text";
<<<<<<< HEAD
  moderationStatus: "Visible" | "Hidden";
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  createdAt: Date;
}

const StorySchema = new Schema<IStory>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userInitial: { type: String, required: true },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, default: "" },
  mediaType: { type: String, enum: ["image", "text"], default: "text" },
<<<<<<< HEAD
  moderationStatus: { type: String, enum: ["Visible", "Hidden"], default: "Visible" },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

=======
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
export const Story = mongoose.model<IStory>("Story", StorySchema);
