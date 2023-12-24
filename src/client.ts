import { Socket, io } from "socket.io-client";
import { globes, playerData } from "./types";
import { Game } from "./game";

// URL del server
const serverUrl: string = "http://192.168.0.245:5555";

// Inizializza una connessione al server
const socket: Socket = io(serverUrl);

const windowWidth: number = 800;
const windowHeight: number = 800;

// Crea un'istanza del gioco e passa il socket come parametro
let game = new Game(socket, windowWidth, windowHeight);

// Gestisce l'evento di connessione al server
socket.on("connect", () => {
    console.log("Connected to the server & sending init");

    // Crea un messaggio di inizializzazione con i dati del giocatore
    let init: playerData = {
        _id: game.getPlayerId(),
        pos: game.getPlayerPosition(),
        socket_id: socket.id,
        points: 10
    };

    // Invia il messaggio di inizializzazione al server
    socket.emit("initMessage", JSON.stringify(init));
});

// Gestisce l'evento di aggiornamento dei giocatori dal server
socket.on("playersUpdate", (msg: string) => {
    // Aggiorna la lista dei giocatori nel gioco
    let players: playerData[] = JSON.parse(msg);
    const existingPlayerIndex = players.findIndex(player => player._id === game.getPlayerId());
    game.setPlayerData(players[existingPlayerIndex]);
    let updatedPlayers: playerData[] = players.filter(player => player._id !== game.getPlayerId());

    game.setPlayers(updatedPlayers);
});

socket.on("globesUpdate", (msg: string) => {
    let message: Array<globes> = JSON.parse(msg);
    console.log(message);
    game.setGlobes(message);
})

// Gestisce l'evento di disconnessione dal server
socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});
