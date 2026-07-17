import mongoose, { Schema } from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
        },
        conversationId:{
            type:String,
            required:true
        },
        title:{
            type:String,
            default:null
        },
        rag_sources:{
            type:[String]
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

chatSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });
chatSchema.index({ userId: 1, createdAt: 1 });

const Chat = mongoose.model("Chat",chatSchema)
export default Chat