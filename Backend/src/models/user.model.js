import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        avatar: {
            type: String,
            default: null
        },
        preferences: {
            notifications: {
                reviewCompleted: { type: String, enum: ["in_app", "email", "none"], default: "in_app" },
                findingsNeedAttention: { type: String, enum: ["in_app", "email", "none"], default: "in_app" },
                emailDigest: { type: Boolean, default: false },
            },
            review: {
                defaultMinSeverity: { type: String, enum: ["info", "warning", "error"], default: "info" },
                activeTriggers: { type: [String], enum: ["pr", "push"], default: ["pr", "push"] },
                defaultModel: { type: String, default: "llama-3.3-70b-versatile" },
            },
            chat: {
                defaultModel: { type: String, default: "llama-3.1-8b-instant" },
            },
        }
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema)
export default User