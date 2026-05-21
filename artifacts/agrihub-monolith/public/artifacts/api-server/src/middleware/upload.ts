import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".sh", ".php", ".js", ".py", ".rb", ".pl", ".cmd", ".msi", ".dll"];

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Blocked file extension: ${ext}`));
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`));
  }
  cb(null, true);
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const processImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    return next();
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const outputPath = path.join(uploadsDir, uniqueName);

  try {
    await sharp(req.file.buffer)
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(outputPath);

    req.body.imagePath = `/uploads/${uniqueName}`;
    next();
  } catch (err) {
    next(err);
  }
};
