import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/",
            "audio/",
            "video/",
        ];

        const isValid = allowedTypes.some(type => file.mimetype.startsWith(type));

        if (isValid) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only images, audio, and video files are allowed."));
        }
    }
});