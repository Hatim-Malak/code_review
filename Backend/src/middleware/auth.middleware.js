import User from "../models/user.model.js"
import jwt from "jsonwebtoken"
import logger from "../lib/logger.js"

export const protectRoute = async (req,res,next) =>{
    try {
        const token = req.cookies.jwt
        if(!token) return res.status(401).json({message:"User is unauthorize"})
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        
        if(!decoded) return res.status(401).json({message:"User is unauthorize"})

        req.user = { _id: decoded.userId };
        next();    
    } catch (error) {
        logger.error(`Error in protectroute middleware: ${error.message}`)
        res.status(500).json({message:"Internal server error"})
    }
}