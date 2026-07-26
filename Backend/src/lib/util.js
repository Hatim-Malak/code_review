import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

export const generateTokens = async (userId, tokenVersion, res) => {
    // Short-lived Access Token (15 minutes)
    const accessToken = jwt.sign(
        { userId, tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    // Long-lived Refresh Token (7 days)
    const refreshToken = jwt.sign(
        { userId, tokenVersion },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, // Fallback just in case
        { expiresIn: "7d" }
    );

    const cookieOptions = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "None",
        secure: process.env.NODE_ENV !== "development"
    };

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { accessToken, refreshToken };
};