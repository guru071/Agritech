import { Router, Request, Response } from "express";
import { Story } from "../schemas/Story.js";
import { authenticateToken, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { multerUpload, processImage } from "../middleware/upload.js";

const router = Router();

router.get("/", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.post(
  "/",
  authenticateToken,
  multerUpload.single("media"),
  processImage,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentStories = await Story.countDocuments({
        userId: req.userId,
        createdAt: { $gte: twentyFourHoursAgo },
      });

      const tier = req.subscriptionTier || "Free";

      if (tier === "Free" && recentStories >= 1) {
        res.status(403).json({
          error: "Story limit reached",
          code: "STORY_LIMIT",
          message: "Free users can only post 1 story per 24 hours. Upgrade to Premium to post more.",
        });
        return;
      }

      const { caption, mediaType } = req.body;
      const story = new Story({
        userId: req.userId,
        userName: req.userName || "Farmer",
        userInitial: (req.userName || "F")[0].toUpperCase(),
        caption: caption?.trim() || "",
        mediaUrl: req.body.imagePath || "",
        mediaType: req.body.imagePath ? "image" : "text",
      });

      await story.save();
      res.status(201).json({ story, message: "Story posted successfully" });
    } catch (err) {
      req.log?.error({ err }, "Story create error");
      res.status(500).json({ error: "Failed to post story" });
    }
  }
);

router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    if (story.userId.toString() !== req.userId) {
      res.status(403).json({ error: "You can only delete your own stories" });
      return;
    }
    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
