import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "agrihub-secret-key-2024";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
  subscriptionTier?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
      subscriptionTier: string;
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    req.subscriptionTier = decoded.subscriptionTier;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        subscriptionTier: string;
      };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userName = decoded.name;
      req.subscriptionTier = decoded.subscriptionTier;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};

export const ADMIN_TOKEN = process.env.ADMIN_SECRET || "agrihub-admin-2024";
export const ADMIN_BUSINESS_PHONE = process.env.ADMIN_PHONE || "919876543210";

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminToken = req.headers["x-admin-token"] as string;
  if (!adminToken || adminToken !== ADMIN_TOKEN) {
    res.status(403).json({ error: "Admin access denied" });
    return;
  }
  next();
};

export { JWT_SECRET };
