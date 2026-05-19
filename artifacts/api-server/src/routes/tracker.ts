import { Router, Request, Response } from "express";
import { ActiveCrop } from "../schemas/ActiveCrop.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const crops = await ActiveCrop.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ crops });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tracked crops" });
  }
});

router.post("/start", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cropName, variety, plantedDate, fieldSize, wateringDays, fertilizerDays, fertilizerNames, notes } = req.body;

    if (!cropName || !plantedDate) {
      res.status(400).json({ error: "Crop name and planted date are required" });
      return;
    }

    const parsedPlantedDate = new Date(plantedDate);
    if (isNaN(parsedPlantedDate.getTime())) {
      res.status(400).json({ error: "Invalid planted date" });
      return;
    }

    const parseIntArray = (val: unknown): number[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(Number).filter((n) => !isNaN(n));
      if (typeof val === "string") {
        return val
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n));
      }
      return [];
    };

    const parseStringArray = (val: unknown): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const crop = new ActiveCrop({
      userId: req.userId,
      cropName: cropName.trim(),
      variety: variety?.trim() || "",
      plantedDate: parsedPlantedDate,
      fieldSize: parseFloat(fieldSize) || 1,
      wateringDays: parseIntArray(wateringDays),
      fertilizerDays: parseIntArray(fertilizerDays),
      fertilizerNames: parseStringArray(fertilizerNames),
      notes: notes?.trim() || "",
    });

    await crop.save();
    res.status(201).json({ crop, message: "Crop tracking started!" });
  } catch (err) {
    req.log?.error({ err }, "Tracker start error");
    res.status(500).json({ error: "Failed to start crop tracking" });
  }
});

router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const crop = await ActiveCrop.findOne({ _id: req.params.id, userId: req.userId });
    if (!crop) {
      res.status(404).json({ error: "Crop not found" });
      return;
    }
    await crop.deleteOne();
    res.json({ message: "Crop tracking removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove crop tracking" });
  }
});

export default router;
