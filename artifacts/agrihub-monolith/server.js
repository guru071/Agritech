import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { config as dotenvConfig } from "dotenv";
dotenvConfig(); // Load .env variables into process.env


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrihub-pro";

// Secrets — set these in .env. Server exits in production if unset.
function requireSecret(key, devFallback) {
  const val = process.env[key];
  if (val) return val;
  if (process.env.NODE_ENV === "production") {
    console.error(`FATAL: ${key} is required in production. Set it in .env`);
    process.exit(1);
  }
  console.warn(`[SECURITY] ${key} not set — using insecure dev fallback. Set ${key} in .env`);
  return devFallback;
}
const JWT_SECRET = requireSecret("JWT_SECRET", `agrihub-dev-${crypto.randomBytes(8).toString("hex")}`);
const ADMIN_TOKEN_KEY = requireSecret("ADMIN_TOKEN_KEY", `agrihub-admin-${crypto.randomBytes(8).toString("hex")}`);

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose Schemas

const ChatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  icon: { type: String, default: "👥" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessageAt: { type: Date, default: Date.now },
  isDisabled: { type: Boolean, default: false },
  onlyAdminsSend: { type: Boolean, default: false },
  onlyAdminsEdit: { type: Boolean, default: false }
});

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, default: "Unknown" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  subscriptionTier: {
    type: String,
    enum: ["Free", "Premium"],
    default: "Free"
  },
  subscriptionStatus: { 
    type: String, 
    enum: ["Pending_Payment", "Active", "Expired"], 
    default: "Pending_Payment" 
  },
  subscriptionExpiresAt: { type: Date },
  upiId: { type: String, default: "" },
  bankAccountNumber: { type: String, default: "" },
  ifscCode: { type: String, default: "" },
  profileImagePath: { type: String, default: "" },
  bio: { type: String, default: "" }
});

function inferCropCategory(title) {
  const t = (title || "").toLowerCase();
  if (/seed|விதை/.test(t)) return "Seeds";
  if (/fertil|nutrient|urea|உர/.test(t)) return "Fertilizer";
  if (/tool|implement|plough|கருவி/.test(t)) return "Tools";
  if (/organic|இயற்கை/.test(t)) return "Organic";
  if (/rice|அரிசி|ponni|paddy/.test(t)) return "Rice";
  if (/wheat|கோதுமை/.test(t)) return "Wheat";
  if (/millet|ragi|கம்பு/.test(t)) return "Millet";
  if (/cotton|பருத்தி/.test(t)) return "Cotton";
  if (/tomato|onion|veg|காய்கறி/.test(t)) return "Vegetables";
  if (/mango|banana|fruit|பழம்/.test(t)) return "Fruits";
  return "Harvest";
}

function inferHarvestGrade(title, isOfficial) {
  const t = (title || "").toLowerCase();
  if (/organic|grade a\+/i.test(t)) return "Organic";
  if (isOfficial) return "A+";
  if (/export|premium/.test(t)) return "A";
  return "A";
}

const ProductSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropTitle: { type: String, required: true },
  cropCategory: { type: String, default: "Harvest" },
  harvestGrade: { type: String, enum: ["A+", "A", "B", "Organic"], default: "A" },
  hubLocation: { type: String, default: "Thanjavur" },
  totalWeightKg: { type: Number, required: true },
  packagingUnitType: { type: String, required: true },
  weightPerUnitKg: { type: Number, required: true },
  calculatedTotalUnits: { type: Number, required: true },
  adminVerificationStatus: { 
    type: String, 
    enum: ["Awaiting_Hub_Delivery", "Received_And_Paid", "Listed_For_Retail"], 
    default: "Awaiting_Hub_Delivery" 
  },
  pricePerUnit: { type: Number, default: 0 },
  isOfficialHubProduct: { type: Boolean, default: false },
  imagePath: { type: String, required: true },
  payoutStatus: { type: String, enum: ["Unpaid", "Settled"], default: "Unpaid" },
  payoutTransactionId: { type: String, default: "" }
});

const LandListingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  totalAcreage: { type: Number, required: true },
  pricePerSqFt: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["Available", "Sold"], default: "Available" },
  adminApprovalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  imagePath: { type: String, required: true }
});

const StorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  caption: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 Hours TTL
});

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  mediaUrl: { type: String, default: "" },
  caption: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

const ActiveCropSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropName: { type: String, required: true },
  plantedDate: { type: Date, default: Date.now },
  wateringDays: { type: [Number], required: true },
  fertilizerDays: { type: [Number], required: true },
  landSizeAcres: { type: Number, required: true },
  seedRequiredKg: { type: Number, required: true },
  totalFarmingDays: { type: Number, required: true }
});

const VideoTutorialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, required: true },
  description: { type: String, required: true }
});

const Land3DSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  pts: { type: Array, required: true }, // array of {x, z}
  terrainHeights: { type: [Number], required: true }, // flat height array
  tW: { type: Number, required: true },
  tH: { type: Number, required: true }
});

const IotStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  pumpStatus: { type: Boolean, default: false },
  valveStatus: { type: Boolean, default: false },
  foggerStatus: { type: Boolean, default: false },
  fanStatus: { type: Boolean, default: false },
  autoRulesEnabled: { type: Boolean, default: true }
});

const IotReadingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  soilMoisture: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  tankLevel: { type: Number, required: true },
  nitrogen: { type: Number, required: true },
  phosphorus: { type: Number, required: true },
  potassium: { type: Number, required: true },
  deviceId: { type: String, default: "" },
  recordedAt: { type: Date, default: Date.now, index: true }
});

const OrderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cropTitle: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Delivered"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

const SupportMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  name: { type: String, default: "Guest" },
  messages: [{
    sender: { type: String, enum: ["user", "agent"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);

const Product = mongoose.model("Product", ProductSchema);
const LandListing = mongoose.model("LandListing", LandListingSchema);
const Story = mongoose.model("Story", StorySchema);
const Post = mongoose.model("Post", PostSchema);
const ActiveCrop = mongoose.model("ActiveCrop", ActiveCropSchema);
const VideoTutorial = mongoose.model("VideoTutorial", VideoTutorialSchema);
const Land3D = mongoose.model("Land3D", Land3DSchema);
const IotStatus = mongoose.model("IotStatus", IotStatusSchema);
const IotReading = mongoose.model("IotReading", IotReadingSchema);
const Order = mongoose.model("Order", OrderSchema);
const SupportMessage = mongoose.model("SupportMessage", SupportMessageSchema);

const IOT_DEVICE_KEY = process.env.IOT_DEVICE_KEY || "";
const UPI_VPA = process.env.UPI_VPA || "";
const MERCHANT_NAME = process.env.MERCHANT_NAME || "AgriHub Pro";
const SUBSCRIPTION_AMOUNT = Number(process.env.SUBSCRIPTION_AMOUNT || 700);

// Security Middleware (Multer + Sharp)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime", "video/ogg"];
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (extension === ".exe" || extension === ".bat" || extension === ".cmd" || extension === ".sh") {
    return cb(new Error("Executable and script files are strictly blocked."), false);
  }
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP, and MP4/WEBM/MOV/OGG videos are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const publicUploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

const processImage = async (req, res, next) => {
  if (!req.file) return next();
  
  if (req.file.mimetype.startsWith("video/")) {
    try {
      const extension = path.extname(req.file.originalname) || ".mp4";
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension.toLowerCase()}`;
      const outputPath = path.join(publicUploadsDir, filename);
      fs.writeFileSync(outputPath, req.file.buffer);
      req.processedImagePath = `/uploads/${filename}`;
      return next();
    } catch (err) {
      return res.status(500).json({ error: "Video processing failed." });
    }
  }

  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(publicUploadsDir, filename);
    
    await sharp(req.file.buffer)
      .resize(1080)
      .webp({ quality: 75 })
      .toFile(outputPath);
      
    req.processedImagePath = `/uploads/${filename}`;
    next();
  } catch (err) {
    res.status(500).json({ error: "Image processing failed." });
  }
};

// Auth middleware — validates real JWT tokens only.
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  // Reject the old fake guest token — it is no longer accepted.
  if (!token || token === "auto-guest-token") {
    return res.status(401).json({ error: "Access token is missing or invalid." });
  }
  
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    
    try {
      const dbUser = await User.findById(payload.id);
      if (!dbUser) return res.status(404).json({ error: "User record not found." });
      
      if (dbUser.subscriptionStatus === "Active" && dbUser.subscriptionExpiresAt && new Date() > dbUser.subscriptionExpiresAt) {
        dbUser.subscriptionStatus = "Expired";
        await dbUser.save();
      }
      
      req.user = dbUser;
      next();
    } catch (e) {
      res.status(500).json({ error: "Database error validation." });
    }
  });
};

const requireActiveSubscription = (req, res, next) => {
  if (req.user.subscriptionStatus !== "Active") {
    return res.status(402).json({ error: "Active yearly subscription required." });
  }
  next();
};

const authenticateAdmin = (req, res, next) => {
  const adminToken = req.headers["x-admin-token"];
  if (adminToken === ADMIN_TOKEN_KEY) {
    next();
  } else {
    res.status(403).json({ error: "Access denied." });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered." });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      subscriptionStatus: "Pending_Payment" 
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET);
    res.status(201).json({ token, user: { name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus, subscriptionTier: user.subscriptionTier } });
  } catch (err) {
    res.status(500).json({ error: "Registration error." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials." });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });
    
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET);
    res.json({ token, user: { name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus, subscriptionTier: user.subscriptionTier } });
  } catch (err) {
    res.status(500).json({ error: "Login error." });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// Update Bank profile
app.put("/api/users/me/bank", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const { upiId, bankAccountNumber, ifscCode } = req.body;
    req.user.upiId = upiId || "";
    req.user.bankAccountNumber = bankAccountNumber || "";
    req.user.ifscCode = ifscCode || "";
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payment details." });
  }
});

app.post("/api/auth/pay", authenticateToken, async (req, res) => {
  try {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    req.user.subscriptionStatus = "Active";
    req.user.subscriptionExpiresAt = expiryDate;
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ error: "Payment failed." });
  }
});

// Stories — with freemium 1-per-24h limit for Free tier users
app.post("/api/story", authenticateToken, upload.single("media"), processImage, async (req, res) => {
  try {
    // Freemium gate: Free users limited to 1 story per 24 hours
    if (req.user.subscriptionTier === "Free") {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await Story.countDocuments({
        userId: req.user._id,
        createdAt: { $gte: yesterday }
      });
      if (recentCount >= 1) {
        return res.status(403).json({ error: "Free plan limit reached. Upgrade to Premium to post more stories.", upgrade: true });
      }
    }
    const story = new Story({
      userId: req.user._id,
      userName: req.user.name,
      mediaUrl: req.body.mediaBase64 || req.processedImagePath || "/uploads/default-story.jpg",
      caption: req.body.caption || ""
    });
    await story.save();
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ error: "Failed to post story." });
  }
});

// Alias: POST /api/stories (same as /api/story) — used by community.html
app.post("/api/stories", authenticateToken, upload.single("media"), processImage, async (req, res) => {
  try {
    if (req.user.subscriptionTier === "Free") {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await Story.countDocuments({ userId: req.user._id, createdAt: { $gte: yesterday } });
      if (recentCount >= 1) return res.status(403).json({ error: "Free plan limit reached. Upgrade to Premium to post more stories.", upgrade: true });
    }
    const story = new Story({
      userId: req.user._id,
      userName: req.user.name,
      mediaUrl: req.body.mediaBase64 || req.processedImagePath || "/uploads/default-story.jpg",
      caption: req.body.caption || ""
    });
    await story.save();
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ error: "Failed to post story." });
  }
});

app.get("/api/stories", async (req, res) => {
  try {
    const stories = await Story.find({
      $or: [
        { reports: { $exists: false } },
        { reports: { $size: 0 } }
      ]
    }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories." });
  }
});

// Products
app.post("/api/products", authenticateToken, requireActiveSubscription, upload.single("image"), processImage, async (req, res) => {
  try {
    const { cropTitle, totalWeightKg, packagingUnitType, weightPerUnitKg } = req.body;
    const w = Number(totalWeightKg);
    const unitW = Number(weightPerUnitKg);
    const calculatedTotalUnits = Math.ceil(w / unitW);
    
    const product = new Product({
      sellerId: req.user._id,
      cropTitle,
      cropCategory: inferCropCategory(cropTitle),
      harvestGrade: inferHarvestGrade(cropTitle, false),
      hubLocation: req.body.hubLocation || "Thanjavur",
      totalWeightKg: w,
      packagingUnitType,
      weightPerUnitKg: unitW,
      calculatedTotalUnits,
      imagePath: req.processedImagePath || "/uploads/default-crop.jpg"
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit logistics." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { adminVerificationStatus: "Listed_For_Retail" },
        { isOfficialHubProduct: true }
      ]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

app.get("/api/users/me/deliveries", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const deliveries = await Product.find({ sellerId: req.user._id });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledger." });
  }
});

// Land
app.post("/api/land-market", authenticateToken, requireActiveSubscription, upload.single("image"), processImage, async (req, res) => {
  try {
    const { title, totalAcreage, pricePerSqFt } = req.body;
    const acreage = Number(totalAcreage);
    const sqFtPrice = Number(pricePerSqFt);
    const totalPrice = acreage * 43560 * sqFtPrice;
    
    const listing = new LandListing({
      sellerId: req.user._id,
      title,
      totalAcreage: acreage,
      pricePerSqFt: sqFtPrice,
      totalPrice,
      imagePath: req.processedImagePath || "/uploads/default-land.jpg"
    });
    
    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: "Failed to list land." });
  }
});

app.get("/api/land-market", async (req, res) => {
  try {
    const listings = await LandListing.find({ adminApprovalStatus: "Approved" });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.patch("/api/land-market/:id/status", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await LandListing.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!listing) return res.status(404).json({ error: "Listing not found." });
    listing.status = status;
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// Crop Tracker
app.post("/api/tracker/start", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const { cropName, wateringDays, fertilizerDays, landSizeAcres, seedRequiredKg, totalFarmingDays } = req.body;
    const tracker = new ActiveCrop({
      userId: req.user._id,
      cropName,
      wateringDays: wateringDays.split(",").map(Number),
      fertilizerDays: fertilizerDays.split(",").map(Number),
      landSizeAcres: Number(landSizeAcres || 1),
      seedRequiredKg: Number(seedRequiredKg || 20),
      totalFarmingDays: Number(totalFarmingDays || 120)
    });
    await tracker.save();
    res.status(201).json(tracker);
  } catch (err) {
    res.status(500).json({ error: "Failed to start tracker." });
  }
});

app.get("/api/tracker", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const trackers = await ActiveCrop.find({ userId: req.user._id });
    res.json(trackers);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// Land 3D Storage (Upsert)
app.post("/api/land3d", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const { pts, terrainHeights, tW, tH } = req.body;
    const land = await Land3D.findOneAndUpdate(
      { userId: req.user._id },
      { pts, terrainHeights, tW, tH },
      { new: true, upsert: true }
    );
    res.json({ success: true, land });
  } catch (err) {
    res.status(500).json({ error: "Failed to save 3D land data." });
  }
});

app.get("/api/land3d", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const land = await Land3D.findOne({ userId: req.user._id });
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch 3D land data." });
  }
});

// Non-authenticated access to user's 3D Land (for general viewers / learning cards)
app.get("/api/land3d/user/:userId", async (req, res) => {
  try {
    const land = await Land3D.findOne({ userId: req.params.userId });
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch 3D land data." });
  }
});

// IoT Controls & Telemetry Routes
app.get("/api/iot/status", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    let status = await IotStatus.findOne({ userId: req.user._id });
    if (!status) {
      status = new IotStatus({ userId: req.user._id });
      await status.save();
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch IoT status." });
  }
});

app.post("/api/iot/status", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const { pumpStatus, valveStatus, foggerStatus, fanStatus, autoRulesEnabled } = req.body;
    let status = await IotStatus.findOne({ userId: req.user._id });
    if (!status) {
      status = new IotStatus({ userId: req.user._id });
    }
    if (pumpStatus !== undefined) status.pumpStatus = pumpStatus;
    if (valveStatus !== undefined) status.valveStatus = valveStatus;
    if (foggerStatus !== undefined) status.foggerStatus = foggerStatus;
    if (fanStatus !== undefined) status.fanStatus = fanStatus;
    if (autoRulesEnabled !== undefined) status.autoRulesEnabled = autoRulesEnabled;
    
    await status.save();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to update IoT status." });
  }
});

// Ingest real sensor readings (JWT or farm device key)
app.post("/api/iot/telemetry/ingest", async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers["authorization"];
    const bearer = authHeader && authHeader.split(" ")[1];
    if (bearer) {
      try {
        const payload = jwt.verify(bearer, JWT_SECRET);
        userId = payload.id;
      } catch {
        return res.status(403).json({ error: "Invalid token." });
      }
    } else {
      const deviceKey = req.headers["x-device-key"];
      if (!IOT_DEVICE_KEY || deviceKey !== IOT_DEVICE_KEY) {
        return res.status(403).json({ error: "Valid Authorization or X-Device-Key required." });
      }
      userId = req.body.userId;
      if (!userId) return res.status(400).json({ error: "userId required when using device key." });
    }

    const { soilMoisture, temperature, humidity, tankLevel, nitrogen, phosphorus, potassium, deviceId } = req.body;
    const reading = new IotReading({
      userId,
      soilMoisture: Number(soilMoisture),
      temperature: Number(temperature),
      humidity: Number(humidity),
      tankLevel: Number(tankLevel),
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      deviceId: deviceId || ""
    });
    if ([reading.soilMoisture, reading.temperature, reading.humidity, reading.tankLevel].some((v) => Number.isNaN(v))) {
      return res.status(400).json({ error: "soilMoisture, temperature, humidity, and tankLevel are required numbers." });
    }
    await reading.save();
    res.status(201).json({ success: true, recordedAt: reading.recordedAt });
  } catch (err) {
    res.status(500).json({ error: "Failed to store sensor reading." });
  }
});

app.get("/api/iot/telemetry", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const latest = await IotReading.findOne({ userId: req.user._id }).sort({ recordedAt: -1 });
    if (!latest) {
      return res.json({
        connected: false,
        message: "No sensor data yet. POST readings from your ESP32/Arduino to /api/iot/telemetry/ingest."
      });
    }
    res.json({
      connected: true,
      soilMoisture: latest.soilMoisture,
      temperature: latest.temperature,
      humidity: latest.humidity,
      tankLevel: latest.tankLevel,
      npk: { nitrogen: latest.nitrogen, phosphorus: latest.phosphorus, potassium: latest.potassium },
      deviceId: latest.deviceId,
      timestamp: latest.recordedAt
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read sensor telemetry." });
  }
});

// Marketplace orders (real purchases, not alert stubs)
app.post("/api/orders", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const quantity = Math.max(1, Number(req.body.quantity) || 1);
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).json({ error: "Product not found." });
    if (product.calculatedTotalUnits < quantity) {
      return res.status(400).json({ error: "Not enough stock available." });
    }
    if (!product.pricePerUnit || product.pricePerUnit <= 0) {
      return res.status(400).json({ error: "Product is not yet priced for sale." });
    }

    product.calculatedTotalUnits -= quantity;
    await product.save();

    const order = new Order({
      buyerId: req.user._id,
      sellerId: product.sellerId,
      productId: product._id,
      cropTitle: product.cropTitle,
      quantity,
      unitPrice: product.pricePerUnit,
      totalPrice: product.pricePerUnit * quantity
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Order placement failed." });
  }
});

app.get("/api/orders/me", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.get("/api/config/public", (req, res) => {
  res.json({
    upiVpa: UPI_VPA,
    merchantName: MERCHANT_NAME,
    subscriptionAmount: SUBSCRIPTION_AMOUNT
  });
});

// Tutorials — auto-seeds default content on first run
const DEFAULT_TUTORIALS = [
  { title: "Introduction to Drip Irrigation Systems", videoUrl: "https://www.youtube.com/embed/5F_C1F4bTjE", category: "Irrigation", language: "EN", description: "Learn step by step how to install a water-efficient system to optimize moisture levels." },
  { title: "பயிர் சுழற்சி முறைகள் (Crop Rotation)", videoUrl: "https://www.youtube.com/embed/oPZ19xZ4U9k", category: "Soil Health", language: "தமிழ்", description: "மண்ணின் வளத்தை அதிகரிக்க பயிர் சுழற்சி முறைகளின் முக்கியத்துவம்." },
  { title: "Advanced Organic Pest Management", videoUrl: "https://www.youtube.com/embed/grVz1m-oGkg", category: "Pest Control", language: "EN", description: "Control beetles, caterpillars, and fungi naturally without synthetic pesticides." },
  { title: "மண் பரிசோதனை முறைகள் (Soil Testing Guide)", videoUrl: "https://www.youtube.com/embed/kY1yUo_mY0c", category: "Soil Health", language: "தமிழ்", description: "விவசாய நிலத்தின் மண்ணை பரிசோதனை செய்யும் முறைகள்." },
  { title: "Sorghum and Millet Intercropping Yield Secrets", videoUrl: "https://www.youtube.com/embed/g2HqX2qSxt0", category: "Crop Yield", language: "EN", description: "Combine grain legumes and millets to double your farm's productivity per sq ft." },
  { title: "சொட்டு நீர் பாசன பராமரிப்பு (Drip Maintenance)", videoUrl: "https://www.youtube.com/embed/A3s31pL1sV8", category: "Irrigation", language: "தமிழ்", description: "பாசனக் குழாய்களில் ஏற்படும் அடைப்புகளை நீக்கி சீரான நீர்ப்பாசனம் செய்வதற்கான எளிய வழிகள்." }
];

app.get("/api/learning/tutorials", async (req, res) => {
  try {
    let tutorials = await VideoTutorial.find().sort({ createdAt: -1 });
    if (tutorials.length === 0) {
      await VideoTutorial.insertMany(DEFAULT_TUTORIALS);
      tutorials = await VideoTutorial.find().sort({ createdAt: -1 });
    }
    res.json(tutorials);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tutorials." });
  }
});

app.get("/api/users/me/analytics", authenticateToken, requireActiveSubscription, async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user._id);
    const cropDistribution = await Product.aggregate([
      { $match: { sellerId, adminVerificationStatus: { $in: ["Received_And_Paid", "Listed_For_Retail"] } } },
      {
        $group: {
          _id: "$cropTitle",
          totalWeight: { $sum: "$totalWeightKg" },
          totalEarnings: { $sum: { $multiply: ["$calculatedTotalUnits", "$pricePerUnit"] } },
          totalBatches: { $sum: 1 }
        }
      }
    ]);
    const totals = cropDistribution.reduce((acc, curr) => {
      acc.weight += curr.totalWeight;
      acc.earnings += curr.totalEarnings;
      return acc;
    }, { weight: 0, earnings: 0 });
    res.json({ cropDistribution, totalWeight: totals.weight, totalEarnings: totals.earnings });
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// Admin
// Admin — get all users
app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Admin — delete user
app.delete("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// Admin — upgrade user to Premium
app.put("/api/admin/users/:id/tier", authenticateAdmin, async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { subscriptionTier: tier }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tier." });
  }
});

app.get("/api/admin/logistics/pending", authenticateAdmin, async (req, res) => {
  try {
    const pending = await Product.find({ adminVerificationStatus: "Awaiting_Hub_Delivery" }).populate("sellerId");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.put("/api/admin/logistics/pay/:id", authenticateAdmin, async (req, res) => {
  try {
    const { verifiedWeight, transactionId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found." });
    
    product.totalWeightKg = Number(verifiedWeight);
    product.calculatedTotalUnits = Math.ceil(product.totalWeightKg / product.weightPerUnitKg);
    product.adminVerificationStatus = "Received_And_Paid";
    product.payoutStatus = "Settled";
    product.payoutTransactionId = transactionId || `TXN-${Math.round(Math.random() * 1e12)}`;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.put("/api/admin/logistics/publish/:id", authenticateAdmin, async (req, res) => {
  try {
    const { pricePerUnit } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found." });
    if (product.adminVerificationStatus !== "Received_And_Paid") {
      return res.status(400).json({ error: "Product must be Received_And_Paid before publishing." });
    }
    product.pricePerUnit = Number(pricePerUnit);
    product.adminVerificationStatus = "Listed_For_Retail";
    if (!product.cropCategory) product.cropCategory = inferCropCategory(product.cropTitle);
    if (!product.harvestGrade) product.harvestGrade = inferHarvestGrade(product.cropTitle, product.isOfficialHubProduct);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// Admin — get Received_And_Paid items ready to publish
app.get("/api/admin/logistics/paid", authenticateAdmin, async (req, res) => {
  try {
    const paid = await Product.find({ adminVerificationStatus: "Received_And_Paid" }).populate("sellerId");
    res.json(paid);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.get("/api/admin/land/pending", authenticateAdmin, async (req, res) => {
  try {
    const pending = await LandListing.find({ adminApprovalStatus: "Pending" }).populate("sellerId");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.put("/api/admin/land/approve/:id", authenticateAdmin, async (req, res) => {
  try {
    const land = await LandListing.findById(req.params.id);
    if (!land) return res.status(404).json({ error: "Not found." });
    land.adminApprovalStatus = "Approved";
    await land.save();
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.put("/api/admin/land/reject/:id", authenticateAdmin, async (req, res) => {
  try {
    const land = await LandListing.findById(req.params.id);
    if (!land) return res.status(404).json({ error: "Not found." });
    land.adminApprovalStatus = "Rejected";
    await land.save();
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

app.post("/api/admin/store/official", authenticateAdmin, upload.single("image"), processImage, async (req, res) => {
  try {
    const { cropTitle, totalWeightKg, packagingUnitType, weightPerUnitKg, pricePerUnit } = req.body;
    const product = new Product({
      sellerId: new mongoose.Types.ObjectId("000000000000000000000000"),
      cropTitle,
      totalWeightKg: Number(totalWeightKg),
      packagingUnitType,
      weightPerUnitKg: Number(weightPerUnitKg),
      calculatedTotalUnits: Math.ceil(Number(totalWeightKg) / Number(weightPerUnitKg)),
      adminVerificationStatus: "Listed_For_Retail",
      pricePerUnit: Number(pricePerUnit),
      isOfficialHubProduct: true,
      cropCategory: inferCropCategory(cropTitle),
      harvestGrade: inferHarvestGrade(cropTitle, true),
      hubLocation: req.body.hubLocation || "Thanjavur",
      imagePath: req.processedImagePath || "/uploads/default-store.jpg"
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// Admin — add tutorial video
app.post("/api/learning/tutorials", authenticateAdmin, async (req, res) => {
  try {
    const { title, videoUrl, category, language, description } = req.body;
    const tutorial = new VideoTutorial({ title, videoUrl, category, language, description });
    await tutorial.save();
    res.status(201).json(tutorial);
  } catch (err) {
    res.status(500).json({ error: "Failed to add tutorial." });
  }
});

// Admin — delete tutorial
app.delete("/api/learning/tutorials/:id", authenticateAdmin, async (req, res) => {
  try {
    await VideoTutorial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete tutorial." });
  }
});

// Admin — edit tutorial video
app.patch("/api/learning/tutorials/:id", authenticateAdmin, async (req, res) => {
  try {
    const { title, videoUrl, category, language, description } = req.body;
    const tutorial = await VideoTutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ error: "Tutorial not found." });
    
    if (title !== undefined) tutorial.title = title;
    if (videoUrl !== undefined) tutorial.videoUrl = videoUrl;
    if (category !== undefined) tutorial.category = category;
    if (language !== undefined) tutorial.language = language;
    if (description !== undefined) tutorial.description = description;
    
    await tutorial.save();
    res.json(tutorial);
  } catch (err) {
    res.status(500).json({ error: "Failed to update tutorial." });
  }
});

// Alias: PUT /api/learning/tutorials/:id (same as PATCH) — used by admin dashboard
app.put("/api/learning/tutorials/:id", authenticateAdmin, async (req, res) => {
  try {
    const { title, videoUrl, category, language, description } = req.body;
    const tutorial = await VideoTutorial.findById(req.params.id);
    if (!tutorial) return res.status(404).json({ error: "Tutorial not found." });
    if (title !== undefined) tutorial.title = title;
    if (videoUrl !== undefined) tutorial.videoUrl = videoUrl;
    if (category !== undefined) tutorial.category = category;
    if (language !== undefined) tutorial.language = language;
    if (description !== undefined) tutorial.description = description;
    await tutorial.save();
    res.json(tutorial);
  } catch (err) {
    res.status(500).json({ error: "Failed to update tutorial." });
  }
});

// Admin — edit official product price
app.patch("/api/admin/products/:id/price", authenticateAdmin, async (req, res) => {
  try {
    const { pricePerUnit } = req.body;
    if (!pricePerUnit || Number(pricePerUnit) <= 0) return res.status(400).json({ error: "Invalid price." });
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { pricePerUnit: Number(pricePerUnit) },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update price." });
  }
});

// Admin — delete official product
app.delete("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

app.get("/api/admin/analytics/platform", authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscribers = await User.countDocuments({ subscriptionStatus: "Active" });
    const totalRevenue = activeSubscribers * 700;
    const volumeResult = await Product.aggregate([
      { $match: { adminVerificationStatus: { $in: ["Received_And_Paid", "Listed_For_Retail"] } } },
      { $group: { _id: null, totalWeight: { $sum: "$totalWeightKg" } } }
    ]);
    const totalVolume = volumeResult[0]?.totalWeight || 0;
    res.json({ totalUsers, activeSubscribers, totalRevenue, totalVolume });
  } catch (err) {
    res.status(500).json({ error: "Failed." });
  }
});

// --- Support Messaging APIs ---
app.post("/api/support/message", async (req, res) => {
  try {
    const { sessionId, name, text } = req.body;
    if (!sessionId || !text) return res.status(400).json({ error: "Missing sessionId or text" });
    
    let chat = await SupportMessage.findOne({ sessionId });
    if (!chat) {
      chat = new SupportMessage({ sessionId, name: name || "Guest", messages: [] });
    }
    chat.messages.push({ sender: "user", text, timestamp: new Date() });
    chat.updatedAt = new Date();
    chat.status = "Open";
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/support/message/:sessionId", async (req, res) => {
  try {
    const chat = await SupportMessage.findOne({ sessionId: req.params.sessionId });
    res.json(chat || { messages: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

app.get("/api/admin/support", authenticateAdmin, async (req, res) => {
  try {
    const chats = await SupportMessage.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

app.post("/api/admin/support/reply", authenticateAdmin, async (req, res) => {
  try {
    const { sessionId, text } = req.body;
    const chat = await SupportMessage.findOne({ sessionId });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    
    chat.messages.push({ sender: "agent", text, timestamp: new Date() });
    chat.updatedAt = new Date();
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to reply" });
  }
});

app.post("/api/seed", async (req, res) => {
  try {
    await VideoTutorial.deleteMany({});
    const tutorials = [
      {
        title: "Introduction to Drip Irrigation Systems",
        videoUrl: "https://www.youtube.com/embed/5F_C1F4bTjE",
        category: "Irrigation",
        language: "EN",
        description: "Learn step by step how to install a water-efficient system to optimize moisture levels."
      },
      {
        title: "பயிர் சுழற்சி முறைகள் (Crop Rotation)",
        videoUrl: "https://www.youtube.com/embed/oPZ19xZ4U9k",
        category: "Soil Health",
        language: "தமிழ்",
        description: "மண்ணின் வளத்தை அதிகரிக்க பயிர் சுழற்சி முறைகளின் முக்கியத்துவம் மற்றும் சாகுபடி முறைகள்."
      },
      {
        title: "Advanced Organic Pest Management",
        videoUrl: "https://www.youtube.com/embed/grVz1m-oGkg",
        category: "Pest Control",
        language: "EN",
        description: "Control beetles, caterpillars, and fungi naturally without synthetic pesticides."
      },
      {
        title: "மண் பரிசோதனை முறைகள் (Soil Testing Guide)",
        videoUrl: "https://www.youtube.com/embed/kY1yUo_mY0c",
        category: "Soil Health",
        language: "தமிழ்",
        description: "விவசாய நிலத்தின் மண்ணை பரிசோதனை செய்யும் முறைகள் மற்றும் உரத் தேவைகள்."
      },
      {
        title: "Sorghum and Millet Intercropping Yield Secrets",
        videoUrl: "https://www.youtube.com/embed/g2HqX2qSxt0",
        category: "Crop Yield",
        language: "EN",
        description: "Combine grain legumes and millets to double your farm's productivity per sq ft."
      },
      {
        title: "சொட்டு நீர் பாசன பராமரிப்பு (Drip Maintenance)",
        videoUrl: "https://www.youtube.com/embed/A3s31pL1sV8",
        category: "Irrigation",
        language: "தமிழ்",
        description: "பாசனக் குழாய்களில் ஏற்படும் அடைப்புகளை நீக்கி சீரான நீர்ப்பாசனம் செய்வதற்கான எளிய வழிகள்."
      }
    ];
    await VideoTutorial.insertMany(tutorials);
    res.json({ message: "Seeded system tutorials successfully." });
  } catch (err) {
    res.status(500).json({ error: "Seeding failed." });
  }
});

// Static file serving — serves public/ and admin-public/
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin-public")));


// --- SOCIAL & PROFILE ROUTES --- //

// 1. Get Public Profile
app.get("/api/users/:id/profile", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("name bio profileImagePath createdAt");
    if(!u) return res.status(404).json({error: "User not found"});
    const stories = await Story.find({ userId: u._id }).sort({createdAt: -1});
    res.json({ user: u, stories });
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 2. Update My Profile (Settings)
app.put("/api/users/me/profile", authenticateToken, upload.single("profileImage"), processImage, async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    let updateData = {};
    if(name) updateData.name = name;
    if(phone) updateData.phone = phone;
    if(bio !== undefined) updateData.bio = bio;
    
    if (req.file) {
      updateData.profileImagePath = "/uploads/" + req.file.filename;
    }
    
    const u = await User.findByIdAndUpdate(req.user.id, updateData, {new: true}).select("-password");
    res.json(u);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 3. Change Password
app.put("/api/users/me/password", authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if(!newPassword || newPassword.length < 6) return res.status(400).json({error: "Password too short"});
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 4. Create Chat (DM or Group)
app.post("/api/chats", authenticateToken, async (req, res) => {
  try {
    const { isGroup, name, participantIds } = req.body;
    // For DM, check if exists
    if(!isGroup && participantIds.length === 1) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: [req.user.id, participantIds[0]], $size: 2 }
      });
      if(existing) return res.json(existing);
    }
    
    const parts = [req.user.id, ...participantIds];
    const chat = new Chat({
      isGroup,
      name: isGroup ? name : "",
      participants: parts,
      adminIds: [req.user.id]
    });
    await chat.save();
    res.json(chat);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 5. Get My Chats
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    // Ensure "AgriHub General" exists
    let general = await Chat.findOne({ name: "AgriHub General", isGroup: true });
    if (!general) {
      general = new Chat({ isGroup: true, name: "AgriHub General", participants: [], adminIds: [] });
      await general.save();
    }
    
    // Auto-join general if not in it
    if (!general.participants.includes(req.user.id)) {
      general.participants.push(req.user.id);
      await general.save();
    }

    const chats = await Chat.find({ participants: req.user.id, isDisabled: { $ne: true } }).populate("participants", "name profileImagePath").sort({lastMessageAt: -1});
    res.json(chats);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 6. Get Chat Messages
app.get("/api/chats/:id/messages", authenticateToken, async (req, res) => {
  try {
    const msgs = await Message.find({ chatId: req.params.id }).sort({createdAt: 1});
    res.json(msgs);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 7. Send Message
app.post("/api/chats/:id/messages", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if(!text) return res.status(400).json({error: "Empty message"});
    
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({error: "Chat not found"});
    if (chat.isDisabled) return res.status(403).json({error: "Group has been disabled"});
    
    if (chat.isGroup && chat.onlyAdminsSend) {
      const isAdmin = chat.adminIds.some(id => id.toString() === req.user.id.toString());
      if (!isAdmin) {
        return res.status(403).json({error: "Only admins can send messages in this group"});
      }
    }
    
    const msg = new Message({
      chatId: req.params.id,
      senderId: req.user.id,
      senderName: req.user.name,
      text
    });
    await msg.save();
    
    chat.lastMessageAt = new Date();
    await chat.save();
    res.json(msg);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// --- NEW SOCIAL / COMMUNITY ROUTE UPDATES ---

// GET /api/users - search and list users (for DMs)
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const q = req.query.search || "";
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).select("name profileImagePath bio email").limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to search users." });
  }
});

// POST /api/stories/:id/like - toggle like status
app.post("/api/stories/:id/like", authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found." });
    
    const index = story.likes.indexOf(req.user._id);
    if (index === -1) {
      story.likes.push(req.user._id);
    } else {
      story.likes.splice(index, 1);
    }
    await story.save();
    res.json({
      success: true,
      liked: index === -1,
      likesCount: story.likes.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like." });
  }
});

// POST /api/stories/:id/comments - add a comment
app.post("/api/stories/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text cannot be empty." });
    }
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found." });
    
    const comment = {
      userId: req.user._id,
      userName: req.user.name,
      text: text.trim(),
      createdAt: new Date()
    };
    story.comments.push(comment);
    await story.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment." });
  }
});

// DELETE /api/stories/:id - delete a story
app.delete("/api/stories/:id", authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found." });
    
    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You are not authorized to delete this story." });
    }
    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Story deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story." });
  }
});

// GET /api/chats/:id - get group details
app.get("/api/chats/:id", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id })
      .populate("participants", "name profileImagePath bio email");
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied." });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat details." });
  }
});

// PUT /api/chats/:id - edit group details & admin toggles
app.put("/api/chats/:id", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied." });
    
    if (!chat.isGroup) {
      return res.status(400).json({ error: "Only groups can be updated." });
    }
    
    const isAdmin = chat.adminIds.some(id => id.toString() === req.user._id.toString());
    
    if (chat.onlyAdminsEdit && !isAdmin) {
      return res.status(403).json({ error: "Only admins can edit this group." });
    }
    
    const { name, description, icon, onlyAdminsSend, onlyAdminsEdit, participantIds, adminIds, isDisabled } = req.body;
    
    if (name !== undefined) chat.name = name;
    if (description !== undefined) chat.description = description;
    if (icon !== undefined) chat.icon = icon;
    
    if (onlyAdminsSend !== undefined || onlyAdminsEdit !== undefined || participantIds !== undefined || adminIds !== undefined || isDisabled !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ error: "Only group admins can change settings or members." });
      }
      if (onlyAdminsSend !== undefined) chat.onlyAdminsSend = onlyAdminsSend;
      if (onlyAdminsEdit !== undefined) chat.onlyAdminsEdit = onlyAdminsEdit;
      if (participantIds !== undefined) chat.participants = participantIds;
      if (adminIds !== undefined) chat.adminIds = adminIds;
      if (isDisabled !== undefined) chat.isDisabled = isDisabled;
    }
    
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to update chat." });
  }
});

// DELETE /api/chats/:id - disable group
app.delete("/api/chats/:id", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied." });
    
    if (!chat.isGroup) {
      return res.status(400).json({ error: "Only groups can be disabled." });
    }
    
    const isAdmin = chat.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can disable this group." });
    }
    
    chat.isDisabled = true;
    await chat.save();
    res.json({ success: true, message: "Group disabled successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable group." });
  }
});

// POST /api/chats/:id/admins - add admin to group
app.post("/api/chats/:id/admins", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found." });
    if (!chat.isGroup) return res.status(400).json({ error: "Only groups have admins." });
    
    // Check if requester is admin or creator
    const isAdmin = chat.adminIds.some(id => id.toString() === req.user._id.toString());
    const isCreator = chat.createdBy && chat.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ error: "Permission denied." });
    
    const { userId } = req.body;
    if (!chat.adminIds.includes(userId)) chat.adminIds.push(userId);
    
    await chat.save();
    res.json({ success: true, message: "Admin added." });
  } catch (err) {
    res.status(500).json({ error: "Failed to add admin." });
  }
});

// POST /api/chats/:id/remove - remove user from group
app.post("/api/chats/:id/remove", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found." });
    if (!chat.isGroup) return res.status(400).json({ error: "Only groups have participants." });
    
    // Check if requester is admin or creator
    const isAdmin = chat.adminIds.some(id => id.toString() === req.user._id.toString());
    const isCreator = chat.createdBy && chat.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ error: "Permission denied." });
    
    const { userId } = req.body;
    chat.participants = chat.participants.filter(id => id.toString() !== userId.toString());
    chat.adminIds = chat.adminIds.filter(id => id.toString() !== userId.toString());
    
    await chat.save();
    res.json({ success: true, message: "User removed." });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove user." });
  }
});

// POST /api/chats/:id/add - add user to group
app.post("/api/chats/:id/add", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found." });
    if (!chat.isGroup) return res.status(400).json({ error: "Only groups have participants." });
    
    // Check if requester is an active participant in the group
    const isParticipant = chat.participants.some(id => id.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "Only group participants can add members." });
    }
    
    const { userId } = req.body;
    if (!chat.participants.includes(userId)) chat.participants.push(userId);
    
    await chat.save();
    res.json({ success: true, message: "User added." });
  } catch (err) {
    res.status(500).json({ error: "Failed to add user." });
  }
});

// POST /api/chats/:id/leave - leave group
app.post("/api/chats/:id/leave", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found." });
    
    if (!chat.isGroup) {
      return res.status(400).json({ error: "Cannot leave a direct message." });
    }
    
    chat.participants = chat.participants.filter(id => id.toString() !== req.user._id.toString());
    chat.adminIds = chat.adminIds.filter(id => id.toString() !== req.user._id.toString());
    
    await chat.save();
    res.json({ success: true, message: "Left group successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to leave group." });
  }
});

// POST /api/stories/:id/report - report a story
app.post("/api/stories/:id/report", authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found." });
    
    if (!story.reports) story.reports = [];
    if (!story.reports.includes(req.user._id)) {
      story.reports.push(req.user._id);
      await story.save();
    }
    res.json({ success: true, message: "Story reported successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to report story." });
  }
});

// GET /api/posts - fetch permanent feed posts (images only)
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [
        { reports: { $exists: false } },
        { reports: { $size: 0 } }
      ]
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts." });
  }
});

// POST /api/posts - create a permanent feed post (supports image upload only, no videos)
app.post("/api/posts", authenticateToken, upload.single("media"), processImage, async (req, res) => {
  try {
    if (req.file && req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({ error: "Videos are not allowed for permanent feed posts. Only images are permitted." });
    }
    const post = new Post({
      userId: req.user._id,
      userName: req.user.name,
      mediaUrl: req.processedImagePath || "",
      caption: req.body.caption || ""
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post." });
  }
});

// POST /api/posts/:id/like - toggle like status for posts
app.post("/api/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    
    const index = post.likes.indexOf(req.user._id);
    if (index === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.json({
      success: true,
      liked: index === -1,
      likesCount: post.likes.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like." });
  }
});

// POST /api/posts/:id/comments - comment on a post
app.post("/api/posts/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text cannot be empty." });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    
    const comment = {
      userId: req.user._id,
      userName: req.user.name,
      text: text.trim(),
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment." });
  }
});

// POST /api/posts/:id/report - report a post
app.post("/api/posts/:id/report", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    
    if (!post.reports) post.reports = [];
    if (!post.reports.includes(req.user._id)) {
      post.reports.push(req.user._id);
      await post.save();
    }
    res.json({ success: true, message: "Post reported successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to report post." });
  }
});

// DELETE /api/posts/:id - delete a permanent post
app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You are not authorized to delete this post." });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Post deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post." });
  }
});

// Root redirect → marketplace
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Admin dashboard
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-public", "dashboard.html"));
});

// SPA catch-all: unknown routes → marketplace (prevents 404 on page refresh)
app.get("*", (req, res, next) => {
  // Only catch non-API, non-file requests
  if (req.path.startsWith("/api/") || req.path.includes(".")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AgriHub Pro monolithic server started on port ${PORT}`);
});
