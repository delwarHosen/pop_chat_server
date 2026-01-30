import dotenv from "dotenv";
import { Socket, Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { registerUserEvents } from "./userEvents.js";
import { registerChatEvents } from "./chatEvents.js";
import Conversation from "../models/Conversation.js";

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*" // Allow all origin
        }
    });

    //  Authentication middleware
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }

            // Attach user data to socket
            let userData = decoded.user;
            socket.data = userData;
            socket.data.userId = userData.id;
            next();
        });
    });

    //  Connection handler - middleware out
    io.on("connection", async (socket: Socket) => {
        const userId = socket.data.userId;
        console.log(`User Connected: ${userId}, userName: ${socket.data.name}`);

        // Register events
        registerChatEvents(io, socket);
        registerUserEvents(io, socket);

        // Join all the conversations the user is part of
        try {
            const conversations = await Conversation.find({
                participants: userId,
            }).select("_id");

            conversations.forEach((conversation) => {
                socket.join(conversation._id.toString());
                console.log(`User ${userId} joined conversation: ${conversation._id}`);
            });

            console.log(`User ${userId} joined ${conversations.length} conversations`);
        } catch (error: any) {
            console.log("Error joining conversations: ", error);
        }

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId}`);
        });
    });

    return io;
}