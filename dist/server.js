"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const socket_io_1 = require("socket.io");
class GameServer {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.server = new socket_io_1.Server();
        this.players = new Array();
        this.socketsOpen = new Array();
        try {
            this.server.listen(port);
            this.server.on("connection", this.handleConnection.bind(this));
            console.log("Server listening on port " + port);
        }
        catch (error) {
            console.error(error);
        }
    }
    updatePlayer(updatedPlayer) {
        // Check if player with the given _id already exists
        const existingPlayerIndex = this.players.findIndex(player => player._id === updatedPlayer._id);
        if (existingPlayerIndex !== -1) {
            // If player exists, update the values
            this.players.splice(existingPlayerIndex, 1, updatedPlayer);
        }
        else {
            // If player doesn't exist, add it to the array
            this.players.push(updatedPlayer);
        }
    }
    handleConnection(socket) {
        console.log("Client connected");
        //socket.emit("message", "connected");
        socket.on("movement", (msg) => {
            let message = JSON.parse(msg);
            console.log("Player " + message._id + " moved to " + message.pos);
            this.updatePlayer(message);
            console.log(this.players);
        });
        socket.on("initMessage", (msg) => {
            let message = JSON.parse(msg);
            console.log("Client + " + message._id + "configured");
            this.socketsOpen.push(message.socket_id.toString());
            console.log(this.socketsOpen);
            if (message._id >= 0)
                this.players.splice(message._id, 0, message);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
        socket.on("closeConnection", (msg) => {
            let message = JSON.parse(msg);
            const existingPlayerIndex = this.players.findIndex(player => player._id === message._id);
            this.players.splice(existingPlayerIndex, 1);
            let socketIndex = this.socketsOpen.findIndex(socket => socket === message.socket_id);
            this.socketsOpen.slice(socketIndex, 1);
            socket.disconnect();
        });
        socket.on("getPlayersUpdate", (msg) => {
            let message = JSON.parse(msg);
            // Filtra i giocatori che hanno un ID diverso da quello ricevuto
            let updatedPlayers = this.players.filter(player => player._id !== message._id);
            // Mantieni solo i giocatori il cui socket_id è contenuto in socketsOpen
            updatedPlayers = updatedPlayers.filter(player => this.socketsOpen.includes(player.socket_id));
            socket.emit("playersUpdate", JSON.stringify(updatedPlayers));
        });
    }
}
exports.GameServer = GameServer;
