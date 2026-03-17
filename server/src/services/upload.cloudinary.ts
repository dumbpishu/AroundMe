import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";
import { getFileType } from "../utils/getFileType";

export const uploadToCloudinary = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const uploadPromise = files.map(file => {
            return new Promise<{ url: string; type: string }>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "auto", folder: "aroundme_uploads" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        }

                        resolve({ url: result?.secure_url || "", type: getFileType(file.mimetype) });
                    }
                );

                streamifier.createReadStream(file.buffer).pipe(stream);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromise);
        res.json({
            success: true,
            data: uploadedFiles,
            message: "Files uploaded successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to upload files" });
    }
}