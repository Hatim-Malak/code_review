import mongoose from "mongoose";

const installationSchema = new mongoose.Schema(
    {
        installationId:{
            type:Number,
            required:true,
            unique:true
        },
        accountLogin:{
            type:String,
            required:true,
        },
        accountType:{
            type:String,
            enum:["User","Organization"],
        },
    },
    {timestamps:true}
);

const Installation = mongoose.model("Installation",installationSchema)
export default Installation