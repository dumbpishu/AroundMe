import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

export const uploadBufferToCloudinary = (file: Express.Multer.File, folder: string): Promise<{ url: string; public_id: string}> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto" },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error("Cloudinary upload failed"));
                }

                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
    });
}

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
}