import { Server, Socket } from "socket.io";
import { movementData, playerData } from "./types";

/**
 * Classe che rappresenta il server del gioco.
 */
export class GameServer {
    private ip: string;
    private port: number;
    private server: Server;
    private players: Array<playerData>;
    private socketsOpen: Array<string>;

    /**
     * Costruttore della classe GameServer.
     * @param ip Indirizzo IP del server.
     * @param port Porta su cui il server ascolta le connessioni.
     */
    constructor(ip: string, port: number) {
        this.ip = ip;
        this.port = port;
        this.server = new Server();
        this.players = new Array<playerData>();
        this.socketsOpen = new Array<string>();

        try {
            // Avvia il server e gestisce le connessioni in entrata.
            this.server.listen(this.port);
            this.server.on("connection", this.handleConnection.bind(this));
            console.log("Server listening on port " + this.port);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Aggiorna i dati del giocatore.
     * @param updatedPlayer Dati aggiornati del giocatore.
     */
    private updatePlayer(updatedPlayer: movementData): void {
        const existingPlayerIndex = this.players.findIndex(player => player._id === updatedPlayer._id);
        if (existingPlayerIndex !== -1) {
            let pos = this.players[existingPlayerIndex].pos;
            switch (updatedPlayer.key) {
                case "w":
                    pos[1] -= 10;
                    break;
                case "a":
                    pos[0] -= 10;
                    break;
                case "s":
                    pos[1] += 10;
                    break;
                case "d":
                    pos[0] += 10;
                    break;
            }
            let data: playerData = {_id: updatedPlayer._id, socket_id: this.players[existingPlayerIndex].socket_id, pos: pos} 
            this.players.splice(existingPlayerIndex, 1, data);
            this.server.emit("playersUpdate", this.removeInactivePlayers());
        }
    }

    private removeInactivePlayers(): playerData[] {
        this.players = this.players.filter(player => this.socketsOpen.includes(player.socket_id));
        return this.players;
    }

    /**
     * Gestisce una nuova connessione da un client.
     * @param socket Oggetto Socket rappresentante la connessione.
     */
    private handleConnection(socket: Socket): void {
        console.log("Client connected");

        // Gestisce il messaggio di movimento inviato dal client.
        socket.on("movement", (msg: string) => {
            let message: movementData = JSON.parse(msg);
            this.updatePlayer(message);
        });

        // Gestisce il messaggio di inizializzazione inviato dal client.
        socket.on("initMessage", (msg: string) => {
            let message: playerData = JSON.parse(msg);
            console.log("Client " + message._id + " initialized");
            this.socketsOpen.push(message.socket_id.toString());
            if (message._id >= 0) this.players.splice(message._id, 0, message);
            this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
        });

        // Gestisce la disconnessione del client.
        socket.on("disconnect", () => {
            let socketIndex = this.socketsOpen.findIndex(sock => sock === socket.id);
            this.socketsOpen.slice(socketIndex, 1);
            const existingPlayerIndex = this.players.findIndex(player => player.socket_id === socket.id);
            this.players.splice(existingPlayerIndex, 1);
            this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
            console.log("Client disconnected");
        });

        // Gestisce il messaggio di chiusura della connessione inviato dal client.
        socket.on("closeConnection", (msg: string) => {
            let message: playerData = JSON.parse(msg);
            const existingPlayerIndex = this.players.findIndex(player => player._id === message._id);
            this.players.splice(existingPlayerIndex, 1);
            let socketIndex = this.socketsOpen.findIndex(socket => socket === message.socket_id);
            this.socketsOpen.slice(socketIndex, 1);
            this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
            socket.disconnect();
        });

        // Gestisce la richiesta di aggiornamento dei giocatori inviata dal client.
        /*socket.on("getPlayersUpdate", (msg: string) => {
            let message: playerData = JSON.parse(msg);

            // Filtra i giocatori che hanno un ID diverso da quello ricevuto.
            let updatedPlayers: playerData[] = this.players.filter(player => player._id !== message._id);

            // Mantieni solo i giocatori il cui socket_id è contenuto in socketsOpen.
            updatedPlayers = updatedPlayers.filter(player => this.socketsOpen.includes(player.socket_id));

            // Invia agli altri giocatori l'aggiornamento dei giocatori.
            socket.emit("playersUpdate", JSON.stringify(updatedPlayers));
        });
        */
    }
}
