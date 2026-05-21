import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../schemas/User.js";
import { JWT_SECRET, authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      subscriptionTier: "Free",
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, subscriptionTier: user.subscriptionTier },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
<<<<<<< HEAD
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        accountStatus: user.accountStatus,
      },
=======
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionTier: user.subscriptionTier },
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
    });
  } catch (err) {
    req.log?.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

<<<<<<< HEAD
    if (user.accountStatus === "Suspended") {
      res.status(403).json({ error: "This account is suspended. Please contact AgriHub support." });
      return;
    }

=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, subscriptionTier: user.subscriptionTier },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
<<<<<<< HEAD
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        accountStatus: user.accountStatus,
      },
=======
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionTier: user.subscriptionTier },
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
    });
  } catch (err) {
    req.log?.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
<<<<<<< HEAD
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      accountStatus: user.accountStatus,
      upiId: user.upiId,
      bankAccountNumber: user.bankAccountNumber,
      ifscCode: user.ifscCode,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        accountStatus: user.accountStatus,
        upiId: user.upiId,
        bankAccountNumber: user.bankAccountNumber,
        ifscCode: user.ifscCode,
      },
    });
=======
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscriptionTier: user.subscriptionTier } });
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/upgrade", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { subscriptionTier: "Premium" },
      { new: true }
    ).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, subscriptionTier: user.subscriptionTier },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
<<<<<<< HEAD
    res.json({
      success: true,
      token,
      subscriptionTier: user.subscriptionTier,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        accountStatus: user.accountStatus,
      },
      message: "Upgraded to Premium!"
    });
=======
    res.json({ token, subscriptionTier: user.subscriptionTier, message: "Upgraded to Premium!" });
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  } catch (err) {
    res.status(500).json({ error: "Upgrade failed" });
  }
});

<<<<<<< HEAD
router.post("/pay", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { subscriptionTier: "Premium" },
      { new: true }
    ).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, subscriptionTier: user.subscriptionTier },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({
      success: true,
      token,
      subscriptionTier: user.subscriptionTier,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionTier: user.subscriptionTier,
        accountStatus: user.accountStatus,
      },
      message: "Upgraded to Premium!"
    });
  } catch (err) {
    res.status(500).json({ error: "Payment failed." });
  }
});

=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
export default router;
