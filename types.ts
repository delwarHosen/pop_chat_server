
import Types = require("mongoose");
import Document = require("mongoose");
import mongoose = require("mongoose");

export interface UserProps extends Document {
  id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationProps extends Document {
  _id: mongoose.Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
