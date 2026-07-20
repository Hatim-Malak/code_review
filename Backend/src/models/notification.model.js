import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ["review_completed", "findings_attention", "review_failed"]
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        metadata: {
            repoId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Repo"
            },
            owner: String,
            repoName: String,
            prNumber: Number
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
