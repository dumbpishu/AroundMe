import mongoose from "mongoose";

export const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["direct"],
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }]
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);