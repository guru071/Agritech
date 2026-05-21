import { Router, Request, Response } from "express";
import { Order } from "../schemas/Order.js";
import { Product } from "../schemas/Product.js";
import { authenticateToken, authenticateAdmin, AuthRequest, ADMIN_BUSINESS_PHONE } from "../middleware/auth.js";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, buyerName, buyerPhone, buyerEmail, unitsRequested, message } = req.body;

    if (!productId || !buyerName || !buyerPhone || !unitsRequested) {
      res.status(400).json({ error: "Product, buyer name, phone, and units are required" });
      return;
    }

    const units = parseInt(unitsRequested);
    if (isNaN(units) || units < 1) {
      res.status(400).json({ error: "Units requested must be at least 1" });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const sellerPhone = product.isOfficialHubProduct
      ? ADMIN_BUSINESS_PHONE
      : product.sellerPhone;

    if (!sellerPhone) {
      res.status(400).json({ error: "Seller contact not available" });
      return;
    }

    const order = new Order({
      productId,
      cropTitle: product.cropTitle,
      sellerPhone,
      sellerName: product.sellerName,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail?.trim() || "",
      unitsRequested: units,
      message: message?.trim() || "",
      status: "Pending",
    });

    await order.save();

    const waText = encodeURIComponent(
      `🌾 *New Order Request via AgriHub Pro*\n\n` +
      `*Crop:* ${product.cropTitle}\n` +
      `*Units Requested:* ${units} × ${product.weightPerUnitKg}kg = ${units * product.weightPerUnitKg}kg total\n` +
      `*Price per Unit:* ₹${product.pricePerUnit || "TBD"}\n\n` +
      `*Buyer:* ${buyerName.trim()}\n` +
      `*Phone:* ${buyerPhone.trim()}\n` +
      (buyerEmail ? `*Email:* ${buyerEmail.trim()}\n` : "") +
      (message ? `\n*Message:* ${message.trim()}\n` : "") +
      `\n_Ref ID: ${order._id}_`
    );

    res.status(201).json({
      order,
      whatsappUrl: `https://wa.me/${sellerPhone}?text=${waText}`,
      message: "Order request submitted! Redirecting to WhatsApp to confirm.",
    });
  } catch (err) {
    req.log?.error({ err }, "Order create error");
    res.status(500).json({ error: "Failed to submit order request" });
  }
});

router.get("/my-sales", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myProducts = await Product.find({ sellerId: req.userId }).select("_id");
    const productIds = myProducts.map((p) => p._id);
    const orders = await Order.find({ productId: { $in: productIds } })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/admin/all", authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
});

router.put("/admin/:id/status", authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
<<<<<<< HEAD
    const allowedStatuses = ["Pending", "Accepted", "Rejected", "Packed", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(", ")}` });
=======
    if (!["Accepted", "Rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be Accepted or Rejected" });
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
      return;
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order, message: `Order ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
