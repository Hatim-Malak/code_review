import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import {generateToken} from "../lib/util.js"

export const signup = async (req,res) =>{
    const {fullName,email,password} = req.body
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }
        if(password.length < 6){
            return res.status(400).json({message:"Password must be greater than 6 characters"})
        }
        const user = await User.findOne({email})
        if(user) return res.status(400).json({message:"email already exits"})

        const salt = await bcrypt.genSalt(10)
        const hashpassword  = await bcrypt.hash(password,salt)

        const newUser = new User(
            {
                email,
                fullName,
                password:hashpassword
            }
        )
        if(newUser){
            await generateToken(newUser._id,res)
            await newUser.save()

            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email
            })
        }else{
            res.status(400).json({message:"Invalid user data"})
        }
    } catch (error) {
        console.log("error in signup controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export const login = async (req,res) =>{
    const {email,fullName,password} = req.body
    try {
        if(password.length<6) return res.status(400).json({message:"The password must be greater than 6 characters"})
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"Invalid credentials"})
        }
        const ispassword = await bcrypt.compare(password,user.password)
        if(!ispassword) return res.status(400).json({message:"Invalid credentials"})

        generateToken(user._id,res)
        res.status(200).json({
            _id:user._id,
            email:user.email,
            fullName:user.fullName
        })
    } catch (error) {
        console.log("Error in login controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export const logout = async (req,res) =>{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Loged out Succesfully"})
    } catch (error) {
        console.log("Error in logout controller ",error.message)
        res.status(500).json({message:"Internal server error"})        
    }
}

export const check = async (req,res) =>{
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log("error in checkAuth controller",error.message)
        res.status(500).json({message:"Internal server error"})
    }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be greater than 6 characters" });
    }
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password confirmation required" });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    session.startTransaction();
    await Installation.updateMany({ userId: req.user._id }, { $set: { userId: null } }, { session });
    await Repo.updateMany(
      { claimedByUserId: req.user._id },
      { $set: { claimedByUserId: null, claimedAt: null } },
      { session }
    );
    await Chat.deleteMany({ userId: req.user._id }, { session });
    await User.findByIdAndDelete(req.user._id, { session });
    await session.commitTransaction();

    res.cookie("jwt", "", { maxAge: 0 }); // matches your existing logout() pattern exactly
    res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};