import { model, Schema } from "mongoose";
import type { ConversationProps } from "../types.js";

const ConversationSchema = new Schema<ConversationProps>(
    {
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true,
        },
        name: {
            type: String,
            default: "",
        },
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        avatar: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// এখানে আমরা কোনো ইউনিক ইনডেক্স রাখবো না, যাতে ডুপ্লিকেট কী এরর না আসে
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ type: 1 });

export default model<ConversationProps>("Conversation", ConversationSchema);