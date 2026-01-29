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
            origin: "*" //Allow all origin
        }
    });//Socket io server instance

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        };

        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) {
                return next(new Error("Authentication error: No token provided"));
            }

            // attach user data to socket
            let userData = decoded.user;
            socket.data = userData;
            socket.data.userId = userData.id;
            next()

        });
        // when socket contacts register events
        io.on("connection", async (socket: Socket) => {
            const userId = socket.data.userId;
            console.log(`User Connected: ${userId}, useName: ${socket.data.name}`);

            // register event
            registerChatEvents(io, socket);
            registerUserEvents(io, socket);

            // join all the conversations the user is part of
            try {
                const conversations = await Conversation.find({
                    participants: userId,
                }).select("_id");

                conversations.forEach((conversation) => {
                    socket.join(conversation._id.toString());
                });
            } catch (error: any) {
                console.log("Error joining conversations: ", error);
            }


            socket.on("disconnect", () => {
                console.log(`User disconnected: ${userId}`)
            })
        })
    })

    return io;
}