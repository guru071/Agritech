import { Router, Request, Response } from "express";
import { Land3D } from "../schemas/Land3D.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /land3d - Upsert 3D Land data (premium only)
router.post("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.subscriptionTier !== "Premium") {
      res.status(403).json({ error: "Active premium subscription required to use 3D Land Visualizer." });
      return;
    }

    const { pts, terrainHeights, tW, tH } = req.body;
    const land = await Land3D.findOneAndUpdate(
      { userId: req.userId },
      { pts, terrainHeights, tW, tH },
      { new: true, upsert: true }
    );
    res.json({ success: true, land });
  } catch (err) {
    res.status(500).json({ error: "Failed to save 3D land data." });
  }
});

// GET /land3d - Get user's own 3D Land data (premium only)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.subscriptionTier !== "Premium") {
      res.status(403).json({ error: "Active premium subscription required to use 3D Land Visualizer." });
      return;
    }

    const land = await Land3D.findOne({ userId: req.userId });
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch 3D land data." });
  }
});

// GET /land3d/user/:userId - Public endpoint to view a user's 3D Land data
router.get("/user/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const land = await Land3D.findOne({ userId: req.params.userId });
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch 3D land data." });
  }
});

export default router;
