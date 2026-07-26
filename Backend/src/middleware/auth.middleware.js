import User from "../models/user.model.js"
import jwt from "jsonwebtoken"
import logger from "../lib/logger.js"

export const protectRoute = async (req,res,next) =>{
    try {
        const token = req.cookies.accessToken; // Use accessToken
        if(!token) return res.status(401).json({message:"User is unauthorized"});
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
        if(!decoded) return res.status(401).json({message:"User is unauthorized"});

        // Note: We intentionally do NOT query the DB here to check tokenVersion
        // to preserve the performance benefits of stateless JWTs.
        // tokenVersion is enforced during the /refresh flow.
        req.user = { _id: decoded.userId };
        next();    
    } catch (error) {
        logger.error(`Error in protectroute middleware: ${error.message}`)
        res.status(500).json({message:"Internal server error"})
    }
}