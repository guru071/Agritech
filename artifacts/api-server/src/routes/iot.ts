import { Router, Response } from "express";
import { IotStatus } from "../schemas/IotStatus.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /iot/status
router.get("/status", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.subscriptionTier !== "Premium") {
      res.status(403).json({ error: "Active premium subscription required to access Smart Home features." });
      return;
    }

    let status = await IotStatus.findOne({ userId: req.userId });
    if (!status) {
      status = new IotStatus({ userId: req.userId });
      await status.save();
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch IoT status" });
  }
});

// POST /iot/status
router.post("/status", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.subscriptionTier !== "Premium") {
      res.status(403).json({ error: "Active premium subscription required to access Smart Home features." });
      return;
    }

    const { pumpStatus, valveStatus, foggerStatus, fanStatus, autoRulesEnabled } = req.body;
    let status = await IotStatus.findOne({ userId: req.userId });
    if (!status) {
      status = new IotStatus({ userId: req.userId });
    }

    if (pumpStatus !== undefined) status.pumpStatus = pumpStatus;
    if (valveStatus !== undefined) status.valveStatus = valveStatus;
    if (foggerStatus !== undefined) status.foggerStatus = foggerStatus;
    if (fanStatus !== undefined) status.fanStatus = fanStatus;
    if (autoRulesEnabled !== undefined) status.autoRulesEnabled = autoRulesEnabled;

    await status.save();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to update IoT status" });
  }
});

// GET /iot/telemetry
router.get("/telemetry", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.subscriptionTier !== "Premium") {
      res.status(403).json({ error: "Active premium subscription required to access Smart Home features." });
      return;
    }

    // Generate simulated dynamic fluctuations for telemetry
    const now = new Date();
    const soilMoisture = Math.round(30 + Math.sin(now.getTime() / 10000) * 8 + Math.random() * 2);
    const temperature = Math.round(28 + Math.cos(now.getTime() / 15000) * 5 + Math.random() * 1.5);
    const humidity = Math.round(65 + Math.sin(now.getTime() / 12000) * 10 + Math.random() * 2);
    const tankLevel = Math.round(82 + Math.sin(now.getTime() / 50000) * 4);
    
    // Simulated NPK sensor values
    const nitrogen = Math.round(42 + Math.sin(now.getTime() / 20000) * 3);
    const phosphorus = Math.round(34 + Math.cos(now.getTime() / 25000) * 2);
    const potassium = Math.round(55 + Math.sin(now.getTime() / 30000) * 4);

    res.json({
      soilMoisture,
      temperature,
      humidity,
      tankLevel,
      npk: { nitrogen, phosphorus, potassium },
      timestamp: now
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read sensor telemetry." });
  }
});

export default router;
