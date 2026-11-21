import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
  },
  { timestamps: true },
);

// One bookmark per (user, thread); the unique index enforces idempotent saves
// at the DB level. A duplicate insert raises E11000, which the service treats
// as an idempotent no-op.
BookmarkSchema.index({ user: 1, thread: 1 }, { unique: true });

const Bookmark = mongoose.model("Bookmark", BookmarkSchema);

export default Bookmark;
