import { Router, Request, Response } from "express";
import { Product } from "../schemas/Product.js";
import { User } from "../schemas/User.js";
import { authenticateToken, optionalAuth, AuthRequest, ADMIN_BUSINESS_PHONE } from "../middleware/auth.js";
import { multerUpload, processImage } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  authenticateToken,
  multerUpload.single("image"),
  processImage,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { cropTitle, totalWeightKg, packagingUnitType, weightPerUnitKg, pricePerUnit } = req.body;

      if (!cropTitle || !totalWeightKg || !packagingUnitType || !weightPerUnitKg) {
        res.status(400).json({ error: "All product fields are required" });
        return;
      }

      const totalW = parseFloat(totalWeightKg);
      const unitW = parseFloat(weightPerUnitKg);

      if (unitW <= 0) {
        res.status(400).json({ error: "Weight per unit must be greater than 0" });
        return;
      }

      const calculatedTotalUnits = Math.ceil(totalW / unitW);

      const user = await User.findById(req.userId).select("name phone");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const product = new Product({
        sellerId: req.userId,
        sellerName: user.name,
        sellerPhone: user.phone,
        cropTitle: cropTitle.trim(),
        totalWeightKg: totalW,
        packagingUnitType: packagingUnitType.trim(),
        weightPerUnitKg: unitW,
        calculatedTotalUnits,
        adminVerificationStatus: "Awaiting_Hub_Delivery",
        isOfficialHubProduct: false,
        imagePath: req.body.imagePath || "",
        pricePerUnit: parseFloat(pricePerUnit) || 0,
      });

      await product.save();
      res.status(201).json({ product, message: "Crop listed successfully. Awaiting Hub delivery confirmation." });
    } catch (err) {
      req.log?.error({ err }, "Product create error");
      res.status(500).json({ error: "Failed to list product" });
    }
  }
);

router.get("/", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      visibility: { $ne: "Hidden" },
      $or: [{ adminVerificationStatus: "Listed_For_Retail" }, { isOfficialHubProduct: true }],
    }).sort({ createdAt: -1 });

    const enriched = products.map((p) => ({
      ...p.toObject(),
      adminPhone: p.isOfficialHubProduct ? ADMIN_BUSINESS_PHONE : null,
    }));

    res.json({ products: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/my", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ sellerId: req.userId }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your products" });
  }
});

export default router;
