import { Socket, Server as SocketIOServer } from "socket.io";

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
    socket.on("testSocket", () => {
        socket.emit("testSocket", { msg: "Real time updated" })
    })
}