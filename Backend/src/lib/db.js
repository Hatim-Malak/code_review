import mongoose from "mongoose"

export const connectdb =async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL)
        console.log(`your database has been connected ${conn.connection.host}`)
    } catch (error) {
        console.log("error with connecting with mongodb ",error)        
    }
}