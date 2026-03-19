import { Request, Response } from "express";
import { uploadBufferToCloudinary } from "../services/cloudinary.service";
import { getFileType } from "../utils/getFileType";

export const uploadToCloudinary = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: "No files uploaded" });
        }

        if (files.length > 10) {
            return res.status(400).json({ success: false, error: "Maximum 10 files allowed" });
        }

        const folder = "aroundme/chats";

        const uploadedFiles =  await Promise.all(
            files.map(async (file) => {
                const result = await uploadBufferToCloudinary(file, folder);
                return {
                    url: result.url,
                    public_id: result.public_id,
                    type: getFileType(file.mimetype),
                    size: file.size
                }
            })
        );

        return res.status(200).json({ success: true, data: uploadedFiles, message: "Files uploaded successfully" });
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        res.status(500).json({ success: false, error: "Failed to upload file" });
    }
}