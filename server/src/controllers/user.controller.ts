import { Request, Response } from "express";
import { updateUserDetailsService, updateUserAvatarService, deleteUserService } from "../services/user.service";
import { uploadBufferToCloudinary } from "../services/cloudinary.service";

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

        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        if (!file.mimetype.startsWith("image/")) {
            return res.status(400).json({ success: false, message: "Invalid file type. Only images are allowed." });
        }

        const uploadResult = await uploadBufferToCloudinary(file, "aroundme/avatars");

        const updatedUser = await updateUserAvatarService(userId, uploadResult?.url, uploadResult.public_id);

        return res.status(200).json({ success: true, data: updatedUser, message: "User avatar updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        await deleteUserService(userId);

        return res.status(200).json({ success: true, data: {}, message: "User account deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}