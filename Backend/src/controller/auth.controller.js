import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import {generateTokens} from "../lib/util.js"
import mongoose from "mongoose";
import Installation from "../models/installation.model.js";
import Repo from "../models/repo.model.js";
import Chat from "../models/chat.model.js";
import logger from "../lib/logger.js";
import { sendOTP, sendSignupOTP } from "../lib/email.js";
import jwt from "jsonwebtoken";
import OtpVerification from "../models/otp.model.js";

export const requestSignupOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Email already exists" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        await OtpVerification.findOneAndUpdate(
            { email },
            { 
                otp: hashedOtp, 
                attempts: 0, 
                expiresAt: Date.now() + 15 * 60 * 1000 
            },
            { upsert: true, new: true }
        );

        await sendSignupOTP(email, otp);
        res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        logger.error(`Error in requestSignupOtp controller: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const signup = async (req,res) =>{
    const {fullName,email,password,otp} = req.body
    try {
        if (!fullName || !email || !password || !otp) {
            return res.status(400).json({ message: "All fields and OTP are required" })
        }
        if(password.length < 6){
            return res.status(400).json({message:"Password must be greater than 6 characters"})
        }
        const user = await User.findOne({email})
        if(user) return res.status(400).json({message:"Email already exists"})

        const otpDoc = await OtpVerification.findOne({ email });
        if (!otpDoc) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        if (otpDoc.attempts >= 5) {
            return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
        }

        if (otpDoc.expiresAt < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const isMatch = await bcrypt.compare(otp, otpDoc.otp);
        if (!isMatch) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // OTP verified successfully!
        await OtpVerification.findOneAndDelete({ email });

        const salt = await bcrypt.genSalt(10)
        const hashpassword  = await bcrypt.hash(password,salt)

        const newUser = new User(
            {
                email,
                fullName,
                password:hashpassword,
                tokenVersion: 1 // Start at 1
            }
        )
        if(newUser){
            await newUser.save()
            await generateTokens(newUser._id, newUser.tokenVersion, res)

            const userObj = newUser.toObject();
            delete userObj.password;

            res.status(201).json(userObj)
        }else{
            res.status(400).json({message:"Invalid user data"})
        }
    } catch (error) {
        logger.error(`error in signup controller: ${error.message}`)
        res.status(500).json({message:"Internal server error"})
    }
}

export const login = async (req,res) =>{
    const {email,fullName,password} = req.body
    try {
        if (!email || !password) return res.status(400).json({message:"All fields are required"})
        if(password.length<6) return res.status(400).json({message:"The password must be greater than 6 characters"})
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"Invalid credentials"})
        }
        const ispassword = await bcrypt.compare(password,user.password)
        if(!ispassword) return res.status(400).json({message:"Invalid credentials"})

        // Increment tokenVersion to kill any other active sessions
        user.tokenVersion += 1;
        await user.save();

        await generateTokens(user._id, user.tokenVersion, res)
        
        const userObj = user.toObject();
        delete userObj.password;
        
        res.status(200).json(userObj)
    } catch (error) {
        logger.error(`Error in login controller: ${error.message}`)
        res.status(500).json({message:"Internal server error"})
    }
}

export const logout = async (req,res) =>{
    try {
        if (req.user && req.user._id) {
            // True session kill: increment tokenVersion so stolen refresh tokens are invalidated
            await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
        }
        res.cookie("accessToken","",{maxAge:0})
        res.cookie("refreshToken","",{maxAge:0})
        res.status(200).json({message:"Logged out Successfully"})
    } catch (error) {
        logger.error(`Error in logout controller: ${error.message}`)
        res.status(500).json({message:"Internal server error"})        
    }
}

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: "User not found" });

        // Single Session Enforcement: Check if tokenVersion matches DB
        if (decoded.tokenVersion !== user.tokenVersion) {
            // Token is old, meaning they logged in elsewhere
            res.cookie("accessToken", "", { maxAge: 0 });
            res.cookie("refreshToken", "", { maxAge: 0 });
            return res.status(401).json({ message: "Session expired. Logged in from another device." });
        }

        // Valid refresh token & valid version. Issue new tokens.
        // We do NOT increment tokenVersion here, otherwise we'd log ourselves out.
        await generateTokens(user._id, user.tokenVersion, res);
        
        res.status(200).json({ message: "Tokens refreshed successfully" });
    } catch (error) {
        logger.error(`Error in refresh controller: ${error.message}`);
        res.cookie("accessToken", "", { maxAge: 0 });
        res.cookie("refreshToken", "", { maxAge: 0 });
        res.status(401).json({ message: "Invalid refresh token" });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        
        // Anti-enumeration: always return success
        if (!user) {
            return res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
        user.resetPasswordAttempts = 0;
        await user.save();

        await sendOTP(user.email, otp);

        res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
    } catch (error) {
        logger.error(`Error in forgotPassword controller: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        if (user.resetPasswordAttempts >= 5) {
            return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
        }

        if (user.resetPasswordOtpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);
        if (!isMatch) {
            user.resetPasswordAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Valid OTP! Reset password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpires = null;
        user.resetPasswordAttempts = 0;
        
        // Increment tokenVersion to kill all active sessions
        user.tokenVersion += 1;
        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        logger.error(`Error in resetPassword controller: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const check = async (req,res) =>{
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });
        res.status(200).json(user)
    } catch (error) {
        logger.error(`error in checkAuth controller: ${error.message}`)
        res.status(500).json({message:"Internal server error"})
    }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be greater than 6 characters" });
    }
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password confirmation required" });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    session.startTransaction();
    await Installation.updateMany({ userId: req.user._id }, { $set: { userId: null } }, { session });
    await Repo.updateMany(
      { claimedByUserId: req.user._id },
      { $set: { claimedByUserId: null, claimedAt: null } },
      { session }
    );
    await Chat.deleteMany({ userId: req.user._id }, { session });
    await User.findByIdAndDelete(req.user._id, { session });
    await session.commitTransaction();

    res.cookie("accessToken", "", { maxAge: 0 }); 
    res.cookie("refreshToken", "", { maxAge: 0 });
    res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};