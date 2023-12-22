import { Socket, io } from "socket.io-client";
import { playerData } from "./types";
import { Game } from "./game";

// URL del server
const serverUrl: string = "http://127.0.0.1:5555";

// Inizializza una connessione al server
const socket: Socket = io(serverUrl);

// Crea un'istanza del gioco e passa il socket come parametro
let game = new Game(socket);

// Gestisce l'evento di connessione al server
socket.on("connect", () => {
    console.log("Connected to the server & sending init");

    // Crea un messaggio di inizializzazione con i dati del giocatore
    let init: playerData = {
        _id: game.getPlayerId(),
        pos: game.getPlayerPosition(),
        socket_id: socket.id
    };

    // Invia il messaggio di inizializzazione al server
    socket.emit("initMessage", JSON.stringify(init));
});

// Gestisce l'evento di aggiornamento dei giocatori dal server
socket.on("playersUpdate", (msg: string) => {
    // Aggiorna la lista dei giocatori nel gioco
    game.setPlayers(JSON.parse(msg));
    console.log(game.getPlayers());
});

// Gestisce l'evento di disconnessione dal server
socket.on("disconnect", () => {
    console.log("Disconnected from the server");

    // Richiede un aggiornamento dei giocatori al server dopo la disconnessione
    game.getPlayersUpdate();
});
