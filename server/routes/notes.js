import express from "express";
import auth from "../middleware/auth.js";
import Note from "../models/Note.js";

const router = express.Router();

router.use(auth);

// GET /api/notes
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      folder = "All",
      archived = "false",
      trashed = "false",
    } = req.query;

    const query = {
      user: req.user.id,
      archived: archived === "true",
      trashed: trashed === "true",
    };

    if (folder !== "All") {
      query.folder = folder;
    }

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const notes = await Note.find(query).sort({
      pinned: -1,
      updatedAt: -1,
    });

    res.json(notes);
  } catch (error) {
    console.error("Load notes error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
});

// POST /api/notes
router.post("/", async (req, res) => {
  try {
    const note = await Note.create({
      user: req.user.id,
      title: req.body.title || "Untitled",
      content: req.body.content || "",
      folder: req.body.folder || "Personal",
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      color: req.body.color || "default",
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(400).json({
      message: error.message,
    });
  }
});

// PUT /api/notes/:id
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "content",
      "folder",
      "tags",
      "color",
      "pinned",
      "archived",
      "trashed",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    return res.status(200).json(note);
  } catch (error) {
    console.error("Update note error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
});

// PATCH /api/notes/:id/pin
router.patch("/:id/pin", async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    note.pinned = !note.pinned;

    await note.save();

    res.json(note);
  } catch (error) {
    console.error("Pin note error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

// PATCH /api/notes/:id/archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        $set: {
          archived: true,
          trashed: false,
        },
      },
      {
        new: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json(note);
  } catch (error) {
    console.error("Archive note error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

// PATCH /api/notes/:id/restore
router.patch("/:id/restore", async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        $set: {
          archived: false,
          trashed: false,
        },
      },
      {
        new: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json(note);
  } catch (error) {
    console.error("Restore note error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

// DELETE /api/notes/trash/empty
router.delete("/trash/empty", async (req, res) => {
  try {
    const result = await Note.deleteMany({
      user: req.user.id,
      trashed: true,
    });

    res.json({
      message: "Trash emptied successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Empty trash error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // First delete → move to trash
    if (!note.trashed) {
      note.trashed = true;
      note.archived = false;

      await note.save();

      return res.json({
        message: "Moved to trash",
        note,
      });
    }

    // Second delete → permanent deletion
    await note.deleteOne();

    res.json({
      message: "Deleted permanently",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

export default router;