import Chat from "../models/chat.model.js";
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
        
        if (!converId) {
            converId = uuid4();
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

        const chat = new Chat({
            userId,
            conversationId: converId,
            user_message: query,
            AI_message: response.data.response
        });

        await chat.save();

        const io = req.app.locals.io;
        io.to(userId.toString()).emit("aiMessage", { 
            userMessage: query, 
            aiMessage: response.data.response 
        });

        res.status(200).json({ response: response.data.response, conversationId: converId });
    } catch (error) {
        console.error("error in addChat controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const { converId } = req.body; 

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