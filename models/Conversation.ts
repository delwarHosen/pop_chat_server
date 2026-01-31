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


ConversationSchema.index(
    { participants: 1, type: 1 },
    {
        unique: true,
        
        partialFilterExpression: { type: "direct" }
    }
);

export default model<ConversationProps>("Conversation", ConversationSchema);