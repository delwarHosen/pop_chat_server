import { Socket, Server as SocketIOServer } from "socket.io";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {

    socket.on("getConversations", async () => {
        console.log("getConversations event");
        try {
            const userId = socket.data.userId;

            if (!userId) {
                socket.emit("getConversations", {
                    success: false,
                    msg: "Unauthorized",
                });
                return;
            }

            // find all conversations where user is a participant
            const conversations = await Conversation.find({
                participants: userId,
            })
                .sort({ updatedAt: -1 })
                .populate({
                    path: "lastMessage",
                    select: "content senderId attachement createdAt",
                })
                .populate({
                    path: "participants",
                    select: "name avatar email",
                })
                .lean();

            socket.emit("getConversations", {
                success: true,
                data: conversations,
            });


        } catch (error: any) {
            console.log("getConversations error: ", error);
            socket.emit("getConversations", {
                success: false,
                msg: "Failed to fetch conversations",
            });
        }
    });


    socket.on("newConversation", async (data) => {
        console.log("newConversation event: ", data);

        try {

            if (!data.participants || !Array.isArray(data.participants)) {
                return socket.emit("newConversation", { success: false, msg: "Invalid data" });
            }



            const sortedParticipants = [...data.participants].sort();

            if (data.type === "direct") {

                const existingConversation = await Conversation.findOne({
                    type: "direct",
                    participants: { $all: sortedParticipants, $size: 2 },
                })
                    .populate({
                        path: "participants",
                        select: "name avatar email",
                    })
                    .lean();

                if (existingConversation) {
                    return socket.emit("newConversation", {
                        success: true,
                        data: { ...existingConversation, isNew: false },
                    });
                }
            }


            const conversation = await Conversation.create({
                type: data.type,
                participants: sortedParticipants,
                name: data.name || "",
                avatar: data.avatar || "",
                createdBy: socket.data.userId,
            });


            const connectedSockets = Array.from(io.sockets.sockets.values());
            connectedSockets.forEach((participantSocket) => {
                if (sortedParticipants.includes(participantSocket.data.userId)) {
                    participantSocket.join(conversation._id.toString());
                }
            });


            const populatedConversation = await Conversation.findById(conversation._id)
                .populate({
                    path: "participants",
                    select: "name avatar email",
                })
                .lean();

            if (!populatedConversation) {
                throw new Error("Failed to populate conversation");
            }


            io.to(conversation._id.toString()).emit("newConversation", {
                success: true,
                data: { ...populatedConversation, isNew: true },
            });

        } catch (error: any) {
            console.log("newConversation error: ", error);


            if (error.code === 11000) {
                return socket.emit("newConversation", {
                    success: false,
                    msg: "Conversation already exists",
                });
            }

            socket.emit("newConversation", {
                success: false,
                msg: "Failed to create conversation",
            });
        }
    });

    // <---------New chat---------->
    socket.on("newMessage", async (data) => {
        console.log("newMessage event: ", data);
        try {
            const message = await Message.create({
                conversationId: data.conversationId,
                senderId: data.sender.id,
                content: data.content,
                attachment: data.attachment,
            });

            io.to(data.conversationId).emit("newMessage", {
                success: true,
                data: {
                    id: message._id,
                    content: data.content,
                    sender: {
                        id: data.sender.id,
                        name: data.sender.name,
                        avatar: data.sender.avatar,
                    },
                    attachement: data.attachement,
                    createdAt: new Date().toISOString(),
                    conversationId: data.conversationId,
                },
            });


            // update conversation's last message
            await Conversation.findByIdAndUpdate(data.conversationId, {
                lastMessage: message._id,
            });

        } catch (error) {
            console.log("newMessage error: ", error);
            socket.emit("newMessage", {
                success: false,
                msg: "Failed to send message",
            });
        }
    });


    // <------message history------>
    socket.on(
        "getMessages",
        async (data: { conversationId: string }) => {
            console.log("getMessages event: ", data);
            try {
                const messages = await Message.find({
                    conversationId: data.conversationId,
                })
                    .sort({ createdAt: -1 }) // newest first
                    .populate<{
                        senderId: { _id: string; name: string; avatar: string };
                    }>({
                        path: "senderId",
                        select: "name avatar",
                    }).lean();

                const messagesWithSender = messages.map(message => ({
                    ...message,
                    id: message._id,
                    sender: {
                        id: message.senderId._id,
                        name: message.senderId.name,
                        avatar: message.senderId.avatar,
                    },
                }));

                socket.emit("getMessages", {
                    success: true,
                    data: messagesWithSender,
                });


            } catch (error) {
                console.log("getMessages error: ", error);
                socket.emit("getMessages", {
                    success: false,
                    msg: "Failed to fetch messages",
                });
            }
        }
    );


}