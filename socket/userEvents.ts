import { Socket, Server as SocketIOServer } from "socket.io";
import { generateToken } from "../utils/token.js";
import User from "../models/User.js";

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
    socket.on("testSocket", () => {
        socket.emit("testSocket", { msg: "Real time updated" })
    });

    socket.on(
        "updateProfile",
        async (data: { name?: string; avatar?: string }) => {
            console.log('updateprofile event: ', data);

            if (!data) {
                return socket.emit('updateProfile', {
                    success: false,
                    msg: "No data provided",
                });
            }

            const userId = socket.data.userId;
            if (!userId) {
                return socket.emit('updateProfile', {
                    success: false,
                    msg: "Unauthorized",
                });
            }

            try {
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { name: data.name, avatar: data.avatar },
                    { new: true } // will return the user with updated values
                );

                if (!updatedUser) {
                    return socket.emit("updateProfile", {
                        success: false,
                        msg: "User not found",
                    });
                }

                // gen token with updated value
                const newToken = generateToken(updatedUser);
                // const newToken = generateToken(updatedUser);

                socket.emit("updateProfile", {
                    success: true,
                    data: { token: newToken },
                    msg: "Profile updated successfully"
                });

            } catch (error) {
                console.log('Error updating profile: ', error);
                socket.emit('updateProfile', {
                    success: false,
                    msg: "Error updating profile",
                });
            }
        });

    socket.on("getContacts", async () => {
        try {
            const currentUserId = socket.data.userId;

            if (!currentUserId) {
                socket.emit("getContacts", {
                    success: false,
                    msg: "Unauthorized",
                });
                return;
            }

            const users = await User.find(
                { _id: { $ne: currentUserId } },
                { password: 0 } // exclude password field
            ).lean(); // will fetch js object

            const contacts = users.map((user) => ({
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
            }));

            socket.emit("getContacts", {
                success: true,
                data: contacts,
            });

        } catch (error: any) {
            console.log("getContacts error: ", error);
            socket.emit("getContacts", {
                success: false,
                msg: "Failed to fetch contacts",
            });
        }
    });

}



