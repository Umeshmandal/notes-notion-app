import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same folder name is allowed for different users,
// but not twice for the same user.
folderSchema.index(
  { user: 1, name: 1 },
  { unique: true }
);

export default mongoose.model("Folder", folderSchema);