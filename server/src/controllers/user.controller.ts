import { Request, Response } from "express";
import { currentUserService, updateUserDetailsService, updateUserAvatarService } from "../services/user.service";
import { uploadBufferToCloudinary } from "../services/cloudinary.service";
import { uploadToCloudinary } from "./upload.controller";

export const currentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userData = await currentUserService(userId);

        return res.status(200).json({ success: true, data: userData, message: "Current user retrieved successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const updateUserDetails = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const updatedData = req.body;

        const updatedUser = await updateUserDetailsService(userId, updatedData);

        return res.status(200).json({ success: true, data: updatedUser, message: "User details updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const updateUserAvatar = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const file = req.file as Express.Multer.File;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const updatedResult = await uploadBufferToCloudinary(file, "aroundme/avatars");

        const result = await updateUserAvatarService(userId, updatedResult.url, updatedResult.public_id);

        return res.status(200).json({ success: true, data: result, message: "User avatar updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}