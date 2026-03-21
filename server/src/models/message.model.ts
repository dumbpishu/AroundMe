import mongoose from "mongoose";
import { IAttachment, IMessage } from "../types/message.type";

const attachmentSchema = new mongoose.Schema<IAttachment>(
    {
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["image", "audio", "video"],
            required: true
        }
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema<IMessage>(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        geohash: {
            type: String,
            required: true,
            index: true
        },
        content: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        attachments: {
            type: [attachmentSchema],
            validate: {
                validator: function (attachments: IAttachment[]) {
                    return attachments.length <= 10; 
                },
                message: "A message can have a maximum of 10 attachments."
            }
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        reactions: {
            type: Map,
            of: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    }
            ],
            default: {}
        },
        mentions: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: {
            type: Date
        },
        deliveredTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

messageSchema.index({ geohash: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ mentions: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
