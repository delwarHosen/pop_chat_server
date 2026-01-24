import type { Request, Response } from "express";
import User from "../models/User.js";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, avatar } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ success: false, msg: "User already exists" });
        }

        user = new User({
            email,
            password,
            name,
            avatar
        })
        
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ success: false, msg: "server error" })
    }
}

export const loginUser = async (req: Request, res: Response): => {

}