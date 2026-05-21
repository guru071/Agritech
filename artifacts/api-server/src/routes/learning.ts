import { Router, Request, Response } from "express";
import { VideoTutorial } from "../schemas/VideoTutorial.js";
import { authenticateAdmin } from "../middleware/auth.js";

const router = Router();

const defaultTutorials = [
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

// GET all tutorials
router.get("/tutorials", async (req: Request, res: Response): Promise<void> => {
  try {
    let tutorials = await VideoTutorial.find().sort({ createdAt: -1 });
    if (tutorials.length === 0) {
      // Auto-seed default tutorials
      await VideoTutorial.insertMany(defaultTutorials);
      tutorials = await VideoTutorial.find().sort({ createdAt: -1 });
    }
    res.json(tutorials);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tutorials" });
  }
});

// POST a new tutorial (Admin only)
router.post("/tutorials", authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, videoUrl, category, language, description } = req.body;
    if (!title || !videoUrl || !category || !language || !description) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    const tutorial = new VideoTutorial({ title, videoUrl, category, language, description });
    await tutorial.save();
    res.status(201).json(tutorial);
  } catch (err) {
    res.status(500).json({ error: "Failed to add tutorial" });
  }
});

// PATCH a tutorial (Admin only)
router.patch("/tutorials/:id", authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, videoUrl, category, language, description } = req.body;
    const tutorial = await VideoTutorial.findById(req.params.id);
    if (!tutorial) {
      res.status(404).json({ error: "Tutorial not found" });
      return;
    }
    if (title !== undefined) tutorial.title = title;
    if (videoUrl !== undefined) tutorial.videoUrl = videoUrl;
    if (category !== undefined) tutorial.category = category;
    if (language !== undefined) tutorial.language = language;
    if (description !== undefined) tutorial.description = description;

    await tutorial.save();
    res.json(tutorial);
  } catch (err) {
    res.status(500).json({ error: "Failed to update tutorial" });
  }
});

// DELETE a tutorial (Admin only)
router.delete("/tutorials/:id", authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorial = await VideoTutorial.findById(req.params.id);
    if (!tutorial) {
      res.status(404).json({ error: "Tutorial not found" });
      return;
    }
    await tutorial.deleteOne();
    res.json({ message: "Tutorial deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete tutorial" });
  }
});

// POST seed tutorials manually
router.post("/tutorials/seed", async (req: Request, res: Response): Promise<void> => {
  try {
    await VideoTutorial.deleteMany({});
    await VideoTutorial.insertMany(defaultTutorials);
    res.json({ message: "Seeded system tutorials successfully." });
  } catch (err) {
    res.status(500).json({ error: "Seeding failed." });
  }
});

export default router;
