import mongoose from "mongoose"
const repoSchema = new mongoose.Schema(
    {
        installationId:{
            type:Number,
            required:true
        },
        owner:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        defaultBranch:{
            type:String,
            default:"main"
        },
        namespace:{
            type:String,
            required:true
        },
        lastIndexedSha:{
            type:String,
            default:null
        }
    },
    {timestamps:true}
);

const Repo = mongoose.model("Repo",repoSchema)
export default Repo;