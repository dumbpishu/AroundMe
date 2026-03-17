import mongoose from "mongoose";

export const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        geohash: {
            type: String,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["text", "image", "audio", "video"],
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

messageSchema.index({ geohash: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);