import express from "express";
import auth from "../middleware/auth.js";
import Folder from "../models/Folder.js";
import Note from "../models/Note.js";

const router = express.Router();

router.use(auth);

// Get all folders for logged-in user
router.get("/", async (req, res) => {
  try {
    const folders = await Folder.find({
      user: req.user.id,
    }).sort({ name: 1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Create folder
router.post("/", async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Folder name is required.",
      });
    }

    const existingFolder = await Folder.findOne({
      name,
      user: req.user.id,
    });

    if (existingFolder) {
      return res.status(409).json({
        message: "Folder already exists.",
      });
    }

    const folder = await Folder.create({
      name,
      user: req.user.id,
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Rename folder
router.put("/:id", async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Folder name is required.",
      });
    }

    const folder = await Folder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found.",
      });
    }

    const existingFolder = await Folder.findOne({
      name,
      user: req.user.id,
      _id: { $ne: req.params.id },
    });

    if (existingFolder) {
      return res.status(409).json({
        message: "Folder already exists.",
      });
    }

    const oldName = folder.name;

    await Note.updateMany(
      {
        folder: oldName,
        user: req.user.id,
      },
      {
        $set: {
          folder: name,
        },
      }
    );

    folder.name = name;
    await folder.save();

    res.json(folder);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete folder
router.delete("/:id", async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found.",
      });
    }

    await Note.updateMany(
      {
        folder: folder.name,
        user: req.user.id,
      },
      {
        $set: {
          folder: "Personal",
        },
      }
    );

    await folder.deleteOne();

    res.json({
      message: "Folder deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

export default router;