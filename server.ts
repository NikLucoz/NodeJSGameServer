import { Server, Socket } from "socket.io";

export class GameServer {
    private ip: string;
    private port: number;
    private server: Server;

    constructor(ip: string, port: number) {
        this.ip = ip;
        this.port = port;
        this.server = new Server();
        try {
            this.server.listen(port);
            this.server.on("connection", this.handleConnection.bind(this));
            console.log("Server listening on port " + port);
        } catch (error) {
            console.error(error);
        }
    }

    private handleConnection(socket: Socket): void {
        console.log("Client connected");
        socket.emit("message", "connected");

        socket.on("message", (msg: string) => {
            console.log("Received:", msg);
            socket.emit("message", msg);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    }
}

