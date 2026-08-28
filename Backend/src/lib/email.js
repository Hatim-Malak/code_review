import { Resend } from "resend";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTP = async (email, otp) => {
  try {
    const recipientEmail = typeof email === "string" ? email.trim().toLowerCase() : email?.email?.trim()?.toLowerCase();
    if (!recipientEmail) {
      throw new Error(`Invalid recipient email: ${email}`);
    }

    const data = await resend.emails.send({
      from: "onboarding@resend.dev", // Default sender for testing
      to: recipientEmail,
      subject: "Your Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
          <div style="background-color: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    logger.info(`OTP email sent to ${recipientEmail}: ${data?.id || data?.data?.id || "success"}`);
    return data;
  } catch (error) {
    logger.error(`Error sending OTP email to ${email}: ${error.message}`);
    throw error;
  }
};

export const sendSignupOTP = async (email, otp) => {
  try {
    const recipientEmail = typeof email === "string" ? email.trim().toLowerCase() : email?.email?.trim()?.toLowerCase();
    if (!recipientEmail) {
      throw new Error(`Invalid recipient email: ${email}`);
    }

    const data = await resend.emails.send({
      from: "onboarding@resend.dev", // Default sender for testing
      to: recipientEmail,
      subject: "Welcome to HatMind - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to HatMind!</h2>
          <p>We're excited to have you. To complete your registration, please verify your email address using this One-Time Password (OTP):</p>
          <div style="background-color: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 15 minutes.</p>
        </div>
      `,
    });

    logger.info(`Signup OTP email sent to ${recipientEmail}: ${data?.id || data?.data?.id || "success"}`);
    return data;
  } catch (error) {
    logger.error(`Error sending Signup OTP email to ${email}: ${error.message}`);
    throw error;
  }
};
