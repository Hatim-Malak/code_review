import mongoose from "mongoose";

const otpVerificationSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        otp: {
            type: String, // hashed
            required: true
        },
        attempts: {
            type: Number,
            default: 0
        },
        expiresAt: {
            type: Date,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: { expires: '15m' } // TTL index: MongoDB will auto-delete docs 15m after createdAt
        }
    }
);

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);
export default OtpVerification;
