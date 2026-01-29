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
        // timestamps: true দিলে createdAt এবং updatedAt ম্যানুয়ালি লিখতে হয় না, 
        // মঙ্গুজ নিজেই এটি হ্যান্ডেল করে।
        timestamps: true,
    }
);

/**
 * ডুপ্লিকেট কনভারসেশন রোধ করতে Unique Index:
 * এটি নিশ্চিত করবে যে একই দুই ইউজারের মধ্যে একাধিক 'direct' চ্যাট তৈরি হবে না।
 */
ConversationSchema.index(
    { participants: 1, type: 1 },
    {
        unique: true,
        // শুধুমাত্র direct চ্যাটের ক্ষেত্রে এই রুলটি কাজ করবে
        partialFilterExpression: { type: "direct" }
    }
);

// আপনার আগের pre-save হুকটির এখন আর প্রয়োজন নেই কারণ timestamps: true ব্যবহার করা হয়েছে।
// কিন্তু যদি আপনি রাখতে চান, তবে এভাবে রাখতে পারেন:
/*
ConversationSchema.pre("save", function (this: any) {
    this.updatedAt = new Date();
});
*/

export default model<ConversationProps>("Conversation", ConversationSchema);