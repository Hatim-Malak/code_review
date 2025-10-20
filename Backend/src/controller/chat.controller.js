import Chat from "../models/chat.model.js";
import {v4 as uuidv4} from "uuid"
import axios from "axios"

export const addChat =async(req,res)=>{
    try {
        console.log("hello")
        const userId  = req.user._id
        const { query,model_name } = req.body

    if(!query){
        return res.status(400).json({message:"user query is required"})
    }
    if(!model_name){
        return res.status(400).json({message:"model_name is required"})
    }
    const thread_id = uuidv4();
    const response = await axios.post("http://localhost:8000/query", {
        query,
        model_name,
        thread_id
    });
    if(!response.data){
        return res.status(500).json({message:"Internal server error"})
    }
    const chat = new Chat({
        userId,
        user_message:query,
        AI_message:response.data.response
    })
    await chat.save()

    const io = req.app.locals.io;
    io.to(userId.toString()).emit("aiMessage", { userMessage: query, aiMessage: response.data.response });

    res.status(200).json(response.data.response)
    } catch (error) {
        console.log("error in addChat controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export const getHistory = async(req,res) =>{
    try {
        const userId = req.user._id
        if(!userId){
            return res.status(400).json({message:"user id is required"})
        }
        const all_chat = await Chat.find({ userId })
            .select("-userId -createdAt -updatedAt -__v")
            .sort({ createdAt: 1 });
        
        if(all_chat.length === 0){
            return res.status(404).json({message:"no chat found"})
        }
        res.status(200).json(all_chat);
    } catch (error) {
        console.log("error in addChat controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}