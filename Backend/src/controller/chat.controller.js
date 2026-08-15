import Chat from "../models/chat.model.js";
import Repo from "../models/repo.model.js";
import Installation from "../models/installation.model.js";
import mongoose from "mongoose";
import axios from "axios";
import { v4 as uuid4 } from "uuid";
import logger from "../lib/logger.js";

export const addChat = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        let { query, model_name, converId, repoId } = req.body;

        if (!query) {
            return res.status(400).json({ message: "user query is required" });
        }
        if (!model_name) {
            return res.status(400).json({ message: "model_name is required" });
        }
        if (!repoId) {
            return res.status(400).json({ message: "repoId is required" });
        }

        // Validate repo exists
        const repo = await Repo.findById(repoId);
        if (!repo) {
            return res.status(404).json({ message: "repository not found" });
        }

        // Validate user owns the installation
        const installation = await Installation.findOne({
            installationId: repo.installationId,
            userId,
        });
        if (!installation) {
            return res.status(403).json({ message: "you do not own this repository" });
        }

        // Early exit if repo hasn't been indexed yet — saves a wasted
        // round-trip to Groq/Pinecone for a query guaranteed to return empty.
        if (!repo.lastIndexedSha) {
            return res.status(200).json({
                response: `**${repo.owner}/${repo.name}** hasn't finished indexing yet — please wait a moment and try again.`,
                conversationId: converId || null,
            });
        }
        
        // If no converId, this is a new conversation — generate one and a title
        let isNewConversation = false;
        if (!converId) {
            converId = uuid4();
            isNewConversation = true;
        }

        // Enforce strict 1:1 conversation-repo binding.
        // Without this, a stale converId from repo A sent alongside repoId B
        // would silently corrupt the conversation — pulling repo A's context
        // into a repo B query, and saving the message with a mismatched repoId.
        if (!isNewConversation) {
            const existingChat = await Chat.findOne({ conversationId: converId }).select("repoId");
            if (existingChat && String(existingChat.repoId) !== String(repoId)) {
                return res.status(400).json({ message: "this conversation belongs to a different repository" });
            }
        }

        const rawContext = await Chat.find({ userId, conversationId: converId })
            .sort({ createdAt: 1 }) 
            .limit(7);

        const context = rawContext.map(
            (msg) => `User: ${msg.user_message}\nAI: ${msg.AI_message}`
        );

        const response = await axios.post(`${process.env.AI_SERVICES_URL}/query`, {
            query,
            model_name,
            context,
            thread_id: converId,
            namespace: repo.namespace,
            repo_full_name: `${repo.owner}/${repo.name}`,
        });

        if (!response.data) {
            return res.status(500).json({ message: "Internal server error" });
        }
        // Auto-generate title from first message (truncate to 50 chars)
        const title = isNewConversation 
            ? query.length > 50 ? query.slice(0, 50) + "..." : query
            : null;

        const chat = new Chat({
            userId,
            repoId,
            conversationId: converId,
            user_message: query,
            AI_message: response.data.response,
            ...(title && { title }),
        });

        await chat.save();

        const io = req.app.locals.io;
        io.to(userId.toString()).emit("aiMessage", { 
            userMessage: query, 
            aiMessage: response.data.response,
        });

        res.status(200).json({ 
            response: response.data.response, 
            conversationId: converId,
            ...(title && { title }),
        });
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const { converId } = req.query; 

        if (!userId) {
            return res.status(400).json({ message: "user id is required" });
        }
        if (!converId) {
            return res.status(400).json({ message: "conversation id is required" });
        }

        const all_chat = await Chat.find({ userId, conversationId: converId })
            .select("-userId -createdAt -updatedAt -__v")
            .sort({ createdAt: 1 });
        
        if (all_chat.length === 0) {
            return res.status(404).json({ message: "no chat found" });
        }
        
        res.status(200).json(all_chat);
    } catch (error) {
        next(error);
    }
};

export const getSessions = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { repoId } = req.query;

        const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
        if (repoId) {
            matchStage.repoId = new mongoose.Types.ObjectId(repoId);
        }

        const sessions = await Chat.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$conversationId",
                    title: { $first: "$title" },
                    firstMessage: { $first: "$user_message" },
                    updatedAt: { $last: "$createdAt" },
                }
            },
            { $sort: { updatedAt: -1 } },
            {
                $project: {
                    _id: 0,
                    conversationId: "$_id",
                    // Use stored title, or fall back to first message truncated
                    title: {
                        $cond: {
                            if: { $and: [{ $ne: ["$title", null] }, { $ne: ["$title", ""] }] },
                            then: "$title",
                            else: {
                                $cond: {
                                    if: { $gt: [{ $strLenCP: { $ifNull: ["$firstMessage", ""] } }, 50] },
                                    then: { $concat: [{ $substrCP: ["$firstMessage", 0, 50] }, "..."] },
                                    else: { $ifNull: ["$firstMessage", "Untitled Chat"] }
                                }
                            }
                        }
                    },
                    updatedAt: 1
                }
            }
        ]);

        res.status(200).json(sessions);
    } catch (error) {
        next(error);
    }
};

export const deleteSession = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { converId } = req.params;

        if (!converId) {
            return res.status(400).json({ message: "conversation id is required" });
        }

        const result = await Chat.deleteMany({ userId, conversationId: converId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "no conversation found" });
        }

        res.status(200).json({ message: "conversation deleted successfully" });
    } catch (error) {
        next(error);
    }
};