"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// client.ts
const socket_io_client_1 = require("socket.io-client");
const game_1 = require("./game");
const serverUrl = "http://127.0.0.1:5555";
const socket = (0, socket_io_client_1.io)(serverUrl);
let game = new game_1.Game(socket);
socket.on("connect", () => {
    console.log("Connected to the server & sending init");
    let init = {
        _id: game.getPlayerId(),
        pos: game.getPlayerPosition(),
        socket_id: socket.id
    };
    socket.emit("initMessage", JSON.stringify(init));
});
socket.on("playersUpdate", (msg) => {
    game.setPlayers(JSON.parse(msg));
    console.log(game.getPlayers());
});
socket.on("disconnect", () => {
    console.log("Disconnected from the server");
    game.getPlayersUpdate();
});
