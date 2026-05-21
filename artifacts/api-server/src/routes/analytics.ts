import { Router, Response } from "express";
import { Product } from "../schemas/Product.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

<<<<<<< HEAD
router.get("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
=======
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const cropDistribution = await Product.aggregate([
      {
        $match: {
          sellerId: userId,
          adminVerificationStatus: "Received_And_Paid",
        },
      },
      {
        $group: {
          _id: "$cropTitle",
          totalWeight: { $sum: "$totalWeightKg" },
          totalUnits: { $sum: "$calculatedTotalUnits" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalWeight: -1 } },
    ]);

    const lifetimeStats = await Product.aggregate([
      {
        $match: {
          sellerId: userId,
          adminVerificationStatus: "Received_And_Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalWeightKg: { $sum: "$totalWeightKg" },
          totalProducts: { $sum: 1 },
          estimatedEarnings: { $sum: { $multiply: ["$calculatedTotalUnits", "$pricePerUnit"] } },
        },
      },
    ]);

    const stats = lifetimeStats[0] || { totalWeightKg: 0, totalProducts: 0, estimatedEarnings: 0 };

    const allProducts = await Product.find({
      sellerId: userId,
    })
      .select("cropTitle adminVerificationStatus totalWeightKg createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      cropDistribution,
      lifetimeStats: stats,
      recentProducts: allProducts,
    });
  } catch (err) {
    req.log?.error({ err }, "Analytics error");
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
