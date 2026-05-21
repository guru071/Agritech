import { Router, Request, Response } from "express";
import { Product } from "../schemas/Product.js";
import { LandListing } from "../schemas/LandListing.js";
import { User } from "../schemas/User.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { multerUpload, processImage } from "../middleware/upload.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/logistics/pending", async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      adminVerificationStatus: "Awaiting_Hub_Delivery",
      isOfficialHubProduct: false,
    }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending logistics" });
  }
});

router.put("/logistics/pay/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { verifiedWeight } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        adminVerificationStatus: "Received_And_Paid",
        verifiedWeight: parseFloat(verifiedWeight) || null,
      },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product, message: "Product confirmed as received and paid." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

router.put("/logistics/publish/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { pricePerUnit } = req.body;
    const update: Record<string, unknown> = { adminVerificationStatus: "Listed_For_Retail" };
    if (pricePerUnit) update.pricePerUnit = parseFloat(pricePerUnit);
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product, message: "Product listed for retail." });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish product" });
  }
});

router.get("/land/pending", async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await LandListing.find({ adminApprovalStatus: "Pending" }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending land listings" });
  }
});

router.put("/land/approve/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await LandListing.findByIdAndUpdate(
      req.params.id,
      { adminApprovalStatus: "Approved" },
      { new: true }
    );
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ listing, message: "Land listing approved." });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve listing" });
  }
});

router.put("/land/reject/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await LandListing.findByIdAndUpdate(
      req.params.id,
      { adminApprovalStatus: "Rejected" },
      { new: true }
    );
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ listing, message: "Land listing rejected." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject listing" });
  }
});

router.post(
  "/store/official",
  multerUpload.single("image"),
  processImage,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { cropTitle, totalWeightKg, packagingUnitType, weightPerUnitKg, pricePerUnit } = req.body;

      if (!cropTitle || !totalWeightKg || !packagingUnitType || !weightPerUnitKg) {
        res.status(400).json({ error: "All product fields are required" });
        return;
      }

      const totalW = parseFloat(totalWeightKg);
      const unitW = parseFloat(weightPerUnitKg);
      const calculatedTotalUnits = Math.ceil(totalW / unitW);

      const product = new Product({
        sellerName: "AgriHub Official Store",
        sellerPhone: "",
        cropTitle: cropTitle.trim(),
        totalWeightKg: totalW,
        packagingUnitType: packagingUnitType.trim(),
        weightPerUnitKg: unitW,
        calculatedTotalUnits,
        adminVerificationStatus: "Listed_For_Retail",
        isOfficialHubProduct: true,
        imagePath: req.body.imagePath || "",
        pricePerUnit: parseFloat(pricePerUnit) || 0,
      });

      await product.save();
      res.status(201).json({ product, message: "Official product listed successfully." });
    } catch (err) {
      req.log?.error({ err }, "Admin store upload error");
      res.status(500).json({ error: "Failed to upload official product" });
    }
  }
);

router.get("/analytics/platform", async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, premiumUsers, hubVolumeResult, recentProducts, pendingLand] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionTier: "Premium" }),
      Product.aggregate([
        { $match: { adminVerificationStatus: "Received_And_Paid" } },
        { $group: { _id: null, totalVolume: { $sum: "$totalWeightKg" } } },
      ]),
      Product.find({ isOfficialHubProduct: false })
        .select("cropTitle totalWeightKg adminVerificationStatus createdAt sellerName")
        .sort({ createdAt: -1 })
        .limit(20),
      LandListing.countDocuments({ adminApprovalStatus: "Pending" }),
    ]);

    const monthlyVolume = await Product.aggregate([
      { $match: { adminVerificationStatus: "Received_And_Paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          volume: { $sum: "$totalWeightKg" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    const cropBreakdown = await Product.aggregate([
      {
        $group: {
          _id: "$cropTitle",
          totalWeight: { $sum: "$totalWeightKg" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalWeight: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: totalUsers - premiumUsers,
      },
      hub: {
        totalVolumeKg: hubVolumeResult[0]?.totalVolume || 0,
        pendingLandListings: pendingLand,
      },
      monthlyVolume,
      cropBreakdown,
      recentProducts,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin analytics error");
    res.status(500).json({ error: "Failed to fetch platform analytics" });
  }
});

export default router;
