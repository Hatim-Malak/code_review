import Chat from "../models/chat.model.js";
import mongoose from "mongoose";
import axios from "axios";
import { v4 as uuid4 } from "uuid";

export const addChat = async (req, res) => {
    try {
        const userId = req.user._id;
        
        let { query, model_name, converId } = req.body;

        if (!query) {
            return res.status(400).json({ message: "user query is required" });
        }
        if (!model_name) {
            return res.status(400).json({ message: "model_name is required" });
        }
        
        // If no converId, this is a new conversation — generate one and a title
        let isNewConversation = false;
        if (!converId) {
            converId = uuid4();
            isNewConversation = true;
        }

        const rawContext = await Chat.find({ userId, conversationId: converId })
            .sort({ createdAt: 1 }) 
            .limit(7);

        const context = rawContext.map(
            (msg) => `User: ${msg.user_message}\nAI: ${msg.AI_message}`
        );

        const response = await axios.post("http://localhost:8000/query", {
            query,
            model_name,
            context,
            thread_id: converId 
        });

        if (!response.data) {
            return res.status(500).json({ message: "Internal server error" });
        }
        const ragSources = response.data.rag_sources;
        // Auto-generate title from first message (truncate to 50 chars)
        const title = isNewConversation 
            ? query.length > 50 ? query.slice(0, 50) + "..." : query
            : null;

        const chat = new Chat({
            userId,
            conversationId: converId,
            user_message: query,
            AI_message: response.data.response,
            ...(title && { title }),
            rag_sources:ragSources
        });

        await chat.save();

        const io = req.app.locals.io;
        io.to(userId.toString()).emit("aiMessage", { 
            userMessage: query, 
            aiMessage: response.data.response,
            rag_sources: ragSources
        });

        res.status(200).json({ 
            response: response.data.response, 
            conversationId: converId,
            ...(title && { title }),
            rag_sources: ragSources
        });
    } catch (error) {
        console.error("error in addChat controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getHistory = async (req, res) => {
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
        console.error("error in getHistory controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSessions = async (req, res) => {
    try {
        const userId = req.user._id;

        const sessions = await Chat.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
        console.error("error in getSessions controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSession = async (req, res) => {
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
        console.error("error in deleteSession controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};