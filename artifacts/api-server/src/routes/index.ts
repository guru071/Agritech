import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import landMarketRouter from "./landMarket.js";
import storiesRouter from "./stories.js";
import trackerRouter from "./tracker.js";
import analyticsRouter from "./analytics.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/land-market", landMarketRouter);
router.use("/stories", storiesRouter);
router.use("/tracker", trackerRouter);
router.use("/users/me/analytics", analyticsRouter);
router.use("/admin", adminRouter);

export default router;
