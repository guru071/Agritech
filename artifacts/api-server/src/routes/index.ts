<<<<<<< HEAD
import { Router, type IRouter, type Response } from "express";
=======
import { Router, type IRouter } from "express";
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import landMarketRouter from "./landMarket.js";
import storiesRouter from "./stories.js";
import trackerRouter from "./tracker.js";
import analyticsRouter from "./analytics.js";
import adminRouter from "./admin.js";
import ordersRouter from "./orders.js";
<<<<<<< HEAD
import learningRouter from "./learning.js";
import iotRouter from "./iot.js";
import land3dRouter from "./land3d.js";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { User } from "../schemas/User.js";
import { Product } from "../schemas/Product.js";
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/land-market", landMarketRouter);
router.use("/stories", storiesRouter);
router.use("/tracker", trackerRouter);
router.use("/users/me/analytics", analyticsRouter);
router.use("/admin", adminRouter);
router.use("/orders", ordersRouter);
<<<<<<< HEAD
router.use("/learning", learningRouter);
router.use("/iot", iotRouter);
router.use("/land3d", land3dRouter);

// PUT /users/me/bank
router.put("/users/me/bank", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { upiId, bankAccountNumber, ifscCode } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    user.upiId = upiId || "";
    user.bankAccountNumber = bankAccountNumber || "";
    user.ifscCode = ifscCode || "";
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payment details." });
  }
});

// GET /users/me/deliveries
router.get("/users/me/deliveries", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliveries = await Product.find({ sellerId: req.userId });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledger." });
  }
});
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1

export default router;
