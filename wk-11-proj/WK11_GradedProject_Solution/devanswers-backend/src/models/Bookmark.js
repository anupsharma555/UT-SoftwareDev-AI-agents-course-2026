import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
    },
}, { timestamps: true });

// One bookmark per (user, question); also guards against duplicate saves and races.
bookmarkSchema.index({ user: 1, question: 1 }, { unique: true });
// Supports the "list my saved questions, newest first" query.
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
