import { Router, Request, Response } from "express";
import { LandListing } from "../schemas/LandListing.js";
import { User } from "../schemas/User.js";
import { authenticateToken, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { multerUpload, processImage } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  authenticateToken,
  multerUpload.single("image"),
  processImage,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, totalAcreage, pricePerSqFt, location } = req.body;

      if (!title || !totalAcreage || !pricePerSqFt) {
        res.status(400).json({ error: "Title, acreage, and price per sqft are required" });
        return;
      }

      const acreage = parseFloat(totalAcreage);
      const pricePerSqFtVal = parseFloat(pricePerSqFt);

      if (acreage <= 0 || pricePerSqFtVal <= 0) {
        res.status(400).json({ error: "Acreage and price must be positive numbers" });
        return;
      }

      const totalPrice = acreage * 43560 * pricePerSqFtVal;

      const user = await User.findById(req.userId).select("name phone");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const listing = new LandListing({
        sellerId: req.userId,
        sellerName: user.name,
        sellerPhone: user.phone,
        title: title.trim(),
        totalAcreage: acreage,
        pricePerSqFt: pricePerSqFtVal,
        totalPrice,
        status: "Available",
        adminApprovalStatus: "Pending",
        imagePath: req.body.imagePath || "",
        location: location?.trim() || "",
      });

      await listing.save();
      res.status(201).json({ listing, message: "Land listed successfully. Pending admin approval." });
    } catch (err) {
      req.log?.error({ err }, "Land listing create error");
      res.status(500).json({ error: "Failed to create land listing" });
    }
  }
);

router.get("/", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listings = await LandListing.find({ adminApprovalStatus: "Approved" }).sort({ createdAt: -1 });
    res.json({ listings, currentUserId: req.userId || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch land listings" });
  }
});

router.patch("/:id/status", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await LandListing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ error: "You can only update your own listings" });
      return;
    }
    const { status } = req.body;
    if (!["Available", "Sold"].includes(status)) {
      res.status(400).json({ error: "Status must be Available or Sold" });
      return;
    }
    listing.status = status;
    await listing.save();
    res.json({ listing, message: `Listing marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing status" });
  }
});

router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await LandListing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ error: "You can only delete your own listings" });
      return;
    }
    await listing.deleteOne();
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

export default router;
