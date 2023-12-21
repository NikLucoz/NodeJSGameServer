"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const socket_io_1 = require("socket.io");
class GameServer {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.server = new socket_io_1.Server();
        try {
            this.server.listen(port);
            this.server.on("connection", this.handleConnection.bind(this));
            console.log("Server listening on port " + port);
        }
        catch (error) {
            console.error(error);
        }
    }
    handleConnection(socket) {
        console.log("Client connected");
        socket.emit("message", "connected");
        socket.on("message", (msg) => {
            console.log("Received:", msg);
            socket.emit("message", msg);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    }
}
exports.GameServer = GameServer;
