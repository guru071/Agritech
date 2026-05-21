import { Router, Request, Response } from "express";
import { Product } from "../schemas/Product.js";
import { LandListing } from "../schemas/LandListing.js";
import { User } from "../schemas/User.js";
<<<<<<< HEAD
import { Order } from "../schemas/Order.js";
import { Story } from "../schemas/Story.js";
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
import { authenticateAdmin } from "../middleware/auth.js";
import { multerUpload, processImage } from "../middleware/upload.js";

const router = Router();

router.use(authenticateAdmin);

<<<<<<< HEAD
const PRODUCT_STATUSES = ["Awaiting_Hub_Delivery", "Received_And_Paid", "Listed_For_Retail"];
const LAND_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];
const LAND_STATUSES = ["Available", "Sold"];
const ORDER_STATUSES = ["Pending", "Accepted", "Rejected", "Packed", "Shipped", "Delivered", "Cancelled"];
const USER_STATUSES = ["Active", "Suspended"];
const TIERS = ["Free", "Premium"];
const VISIBILITY = ["Public", "Hidden"];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchFilter(q: string, fields: string[]) {
  if (!q) return {};
  const regex = { $regex: escapeRegex(q), $options: "i" };
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

router.get("/overview", async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      premiumUsers,
      suspendedUsers,
      pendingCrops,
      liveProducts,
      officialProducts,
      hiddenProducts,
      pendingLand,
      approvedLand,
      pendingOrders,
      liveStories,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionTier: "Premium" }),
      User.countDocuments({ accountStatus: "Suspended" }),
      Product.countDocuments({ adminVerificationStatus: "Awaiting_Hub_Delivery", isOfficialHubProduct: false }),
      Product.countDocuments({ adminVerificationStatus: "Listed_For_Retail", visibility: { $ne: "Hidden" } }),
      Product.countDocuments({ isOfficialHubProduct: true }),
      Product.countDocuments({ visibility: "Hidden" }),
      LandListing.countDocuments({ adminApprovalStatus: "Pending" }),
      LandListing.countDocuments({ adminApprovalStatus: "Approved", visibility: { $ne: "Hidden" } }),
      Order.countDocuments({ status: "Pending" }),
      Story.countDocuments({ moderationStatus: { $ne: "Hidden" } }),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const orderPipeline = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatus = Object.fromEntries(orderPipeline.map((row) => [row._id, row.count]));

    const inventoryValue = await Product.aggregate([
      { $match: { visibility: { $ne: "Hidden" }, adminVerificationStatus: "Listed_For_Retail" } },
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ["$calculatedTotalUnits", "$pricePerUnit"] } },
          units: { $sum: "$calculatedTotalUnits" },
        },
      },
    ]);

    res.json({
      users: { total: totalUsers, premium: premiumUsers, suspended: suspendedUsers, free: totalUsers - premiumUsers },
      commerce: { pendingCrops, liveProducts, officialProducts, hiddenProducts, inventoryValue: inventoryValue[0]?.value || 0, inventoryUnits: inventoryValue[0]?.units || 0 },
      land: { pending: pendingLand, approved: approvedLand },
      community: { liveStories },
      orders: { pending: pendingOrders, byStatus: orderStatus },
      recentUsers,
      recentOrders,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin overview error");
    res.status(500).json({ error: "Failed to fetch admin overview" });
  }
});

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = asString(req.query["q"]);
    const tier = asString(req.query["tier"]);
    const status = asString(req.query["status"]);
    const filter: Record<string, unknown> = { ...searchFilter(q, ["name", "email", "phone"]) };
    if (TIERS.includes(tier)) filter["subscriptionTier"] = tier;
    if (USER_STATUSES.includes(status)) filter["accountStatus"] = status;
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).limit(250);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const update: Record<string, unknown> = {};
    const name = asString(req.body.name);
    const email = asString(req.body.email);
    const phone = asString(req.body.phone);
    const tier = asString(req.body.subscriptionTier);
    const status = asString(req.body.accountStatus);

    if (name) update["name"] = name;
    if (email) update["email"] = email.toLowerCase();
    if (phone) update["phone"] = phone;
    if (TIERS.includes(tier)) update["subscriptionTier"] = tier;
    if (USER_STATUSES.includes(status)) update["accountStatus"] = status;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user, message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await Story.deleteMany({ userId: req.params.id });
    res.json({ user, message: "User deleted and related stories removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/products/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = asString(req.query["q"]);
    const status = asString(req.query["status"]);
    const source = asString(req.query["source"]);
    const visibility = asString(req.query["visibility"]);
    const filter: Record<string, unknown> = { ...searchFilter(q, ["cropTitle", "sellerName", "packagingUnitType"]) };
    if (PRODUCT_STATUSES.includes(status)) filter["adminVerificationStatus"] = status;
    if (source === "official") filter["isOfficialHubProduct"] = true;
    if (source === "farmer") filter["isOfficialHubProduct"] = false;
    if (VISIBILITY.includes(visibility)) filter["visibility"] = visibility;
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.patch("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const update: Record<string, unknown> = {};
    const cropTitle = asString(req.body.cropTitle);
    const packagingUnitType = asString(req.body.packagingUnitType);
    const status = asString(req.body.adminVerificationStatus);
    const visibility = asString(req.body.visibility);
    const featured = parseBoolean(req.body.isFeatured);
    const official = parseBoolean(req.body.isOfficialHubProduct);
    const totalWeightKg = parseNumber(req.body.totalWeightKg);
    const weightPerUnitKg = parseNumber(req.body.weightPerUnitKg);
    const pricePerUnit = parseNumber(req.body.pricePerUnit);
    const verifiedWeight = parseNumber(req.body.verifiedWeight);

    if (cropTitle) update["cropTitle"] = cropTitle;
    if (packagingUnitType) update["packagingUnitType"] = packagingUnitType;
    if (PRODUCT_STATUSES.includes(status)) update["adminVerificationStatus"] = status;
    if (VISIBILITY.includes(visibility)) update["visibility"] = visibility;
    if (featured !== undefined) update["isFeatured"] = featured;
    if (official !== undefined) update["isOfficialHubProduct"] = official;
    if (totalWeightKg !== undefined && totalWeightKg > 0) update["totalWeightKg"] = totalWeightKg;
    if (weightPerUnitKg !== undefined && weightPerUnitKg > 0) update["weightPerUnitKg"] = weightPerUnitKg;
    if (pricePerUnit !== undefined && pricePerUnit >= 0) update["pricePerUnit"] = pricePerUnit;
    if (verifiedWeight !== undefined && verifiedWeight >= 0) update["verifiedWeight"] = verifiedWeight;

    if (update["totalWeightKg"] || update["weightPerUnitKg"]) {
      const existing = await Product.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      const total = Number(update["totalWeightKg"] || existing.totalWeightKg);
      const unit = Number(update["weightPerUnitKg"] || existing.weightPerUnitKg);
      update["calculatedTotalUnits"] = Math.ceil(total / unit);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product, message: "Product updated" });
  } catch (err) {
    req.log?.error({ err }, "Admin product update error");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await Order.deleteMany({ productId: req.params.id });
    res.json({ product, message: "Product and related orders deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/land/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = asString(req.query["q"]);
    const approval = asString(req.query["approval"]);
    const status = asString(req.query["status"]);
    const visibility = asString(req.query["visibility"]);
    const filter: Record<string, unknown> = { ...searchFilter(q, ["title", "location", "sellerName"]) };
    if (LAND_APPROVAL_STATUSES.includes(approval)) filter["adminApprovalStatus"] = approval;
    if (LAND_STATUSES.includes(status)) filter["status"] = status;
    if (VISIBILITY.includes(visibility)) filter["visibility"] = visibility;
    const listings = await LandListing.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch land listings" });
  }
});

router.patch("/land/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const update: Record<string, unknown> = {};
    const title = asString(req.body.title);
    const location = asString(req.body.location);
    const approval = asString(req.body.adminApprovalStatus);
    const status = asString(req.body.status);
    const visibility = asString(req.body.visibility);
    const featured = parseBoolean(req.body.isFeatured);
    const totalAcreage = parseNumber(req.body.totalAcreage);
    const pricePerSqFt = parseNumber(req.body.pricePerSqFt);

    if (title) update["title"] = title;
    if (location) update["location"] = location;
    if (LAND_APPROVAL_STATUSES.includes(approval)) update["adminApprovalStatus"] = approval;
    if (LAND_STATUSES.includes(status)) update["status"] = status;
    if (VISIBILITY.includes(visibility)) update["visibility"] = visibility;
    if (featured !== undefined) update["isFeatured"] = featured;
    if (totalAcreage !== undefined && totalAcreage > 0) update["totalAcreage"] = totalAcreage;
    if (pricePerSqFt !== undefined && pricePerSqFt > 0) update["pricePerSqFt"] = pricePerSqFt;

    if (update["totalAcreage"] || update["pricePerSqFt"]) {
      const existing = await LandListing.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      const acreage = Number(update["totalAcreage"] || existing.totalAcreage);
      const price = Number(update["pricePerSqFt"] || existing.pricePerSqFt);
      update["totalPrice"] = acreage * 43560 * price;
    }

    const listing = await LandListing.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ listing, message: "Land listing updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update land listing" });
  }
});

router.delete("/land/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await LandListing.findByIdAndDelete(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ listing, message: "Land listing deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete land listing" });
  }
});

router.get("/orders/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = asString(req.query["q"]);
    const status = asString(req.query["status"]);
    const filter: Record<string, unknown> = { ...searchFilter(q, ["cropTitle", "sellerName", "buyerName", "buyerPhone", "buyerEmail"]) };
    if (ORDER_STATUSES.includes(status)) filter["status"] = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = asString(req.body.status);
    if (!ORDER_STATUSES.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(", ")}` });
      return;
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order, message: `Order marked ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.delete("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

router.get("/stories/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = asString(req.query["q"]);
    const status = asString(req.query["status"]);
    const filter: Record<string, unknown> = { ...searchFilter(q, ["userName", "caption", "mediaType"]) };
    if (["Visible", "Hidden"].includes(status)) filter["moderationStatus"] = status;
    const stories = await Story.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.patch("/stories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const moderationStatus = asString(req.body.moderationStatus);
    if (!["Visible", "Hidden"].includes(moderationStatus)) {
      res.status(400).json({ error: "moderationStatus must be Visible or Hidden" });
      return;
    }
    const story = await Story.findByIdAndUpdate(req.params.id, { moderationStatus }, { new: true, runValidators: true });
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    res.json({ story, message: `Story marked ${moderationStatus}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update story" });
  }
});

router.delete("/stories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    res.json({ story, message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story" });
  }
});

=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
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
