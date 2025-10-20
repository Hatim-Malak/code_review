import mongoose, { Schema } from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
        },
        user_message:{
            type:String,
        },
        AI_message:{
            type:String,
        }
    },
    {timestamps:true}
)

const Chat = mongoose.model("Chat",chatSchema)
export default Chat