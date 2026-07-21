import User from "../models/user.model.js";
import Installation from "../models/installation.model.js";
import Repo from "../models/repo.model.js";
import { v2 as cloudinary } from "cloudinary";
import { uninstallApp } from "../lib/githubAuth.js";
import logger from "../lib/logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      user.avatar = uploadResponse.secure_url;
    }

    await user.save();
    const updatedUser = await User.findById(req.user._id).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { notifications, review, chat } = req.body;
    const user = await User.findById(req.user._id);

    if (notifications) {
      user.preferences.notifications = { ...user.preferences.notifications.toObject(), ...notifications };
    }
    if (review) {
      user.preferences.review = { ...user.preferences.review.toObject(), ...review };
    }
    if (chat) {
      user.preferences.chat = { ...user.preferences.chat.toObject(), ...chat };
    }
    user.markModified("preferences");

    await user.save();
    const updatedUser = await User.findById(req.user._id).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const getLinkedInstallations = async (req, res, next) => {
  try {
    const installations = await Installation.find({ userId: req.user._id });
    res.status(200).json(installations);
  } catch (error) {
    next(error);
  }
};

export const disconnectInstallation = async (req, res, next) => {
  try {
    const { installationId } = req.params;
    const installation = await Installation.findOne({ installationId: Number(installationId), userId: req.user._id });
    if (!installation) {
      return res.status(403).json({ message: "not authorized for this installation" });
    }

    try {
      await uninstallApp(installation.installationId);
    } catch (uninstallError) {
      // It might already be uninstalled on GitHub's side, log and continue
      logger.error(`Failed to uninstall from GitHub API: ${uninstallError.message || uninstallError}`);
    }

    installation.userId = null;
    await installation.save();

    await Repo.updateMany(
      { installationId: installation.installationId },
      { $set: { claimedByUserId: null, claimedAt: null } }
    );

    res.status(200).json({ message: "Installation disconnected and repos unclaimed" });
  } catch (error) {
    next(error);
  }
};

export const disconnectRepo = async (req, res, next) => {
  try {
    const { owner, repo: repoName } = req.params;
    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not found" });

    if (String(repo.claimedByUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: "only the claiming user can disconnect this repo" });
    }

    repo.claimedByUserId = null;
    repo.claimedAt = null;
    await repo.save();

    res.status(200).json({ message: "Repo disconnected" });
  } catch (error) {
    next(error);
  }
};

export const updateRepoPreferences = async (req, res, next) => {
  try {
    const { owner, repo: repoName } = req.params;
    const { minSeverity, activeTriggers, model } = req.body;
    
    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not found" });

    if (String(repo.claimedByUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: "only the claiming user can update preferences for this repo" });
    }

    repo.reviewPreferences = {
      minSeverity: minSeverity !== undefined ? minSeverity : repo.reviewPreferences?.minSeverity,
      activeTriggers: activeTriggers !== undefined ? activeTriggers : repo.reviewPreferences?.activeTriggers,
      model: model !== undefined ? model : repo.reviewPreferences?.model,
    };

    await repo.save();
    res.status(200).json(repo.reviewPreferences);
  } catch (error) {
    next(error);
  }
};
