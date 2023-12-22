import { Server, Socket } from "socket.io";
import { playerData } from "./types";

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
    private updatePlayer(updatedPlayer: playerData): void {
        const existingPlayerIndex = this.players.findIndex(player => player._id === updatedPlayer._id);
        if (existingPlayerIndex !== -1) {
            // Sostituisci il giocatore esistente con i nuovi dati del giocatore.
            this.players.splice(existingPlayerIndex, 1, updatedPlayer);
        } else {
            // Aggiungi un nuovo giocatore se non esiste già.
            this.players.push(updatedPlayer);
        }
    }

    /**
     * Gestisce una nuova connessione da un client.
     * @param socket Oggetto Socket rappresentante la connessione.
     */
    private handleConnection(socket: Socket): void {
        console.log("Client connected");

        // Gestisce il messaggio di movimento inviato dal client.
        socket.on("movement", (msg: string) => {
            let message: playerData = JSON.parse(msg);
            console.log("Player " + message._id + " moved to " + message.pos);
            this.updatePlayer(message);
        });

        // Gestisce il messaggio di inizializzazione inviato dal client.
        socket.on("initMessage", (msg: string) => {
            let message: playerData = JSON.parse(msg);
            console.log("Client " + message._id + " configured");
            this.socketsOpen.push(message.socket_id.toString());
            console.log(this.socketsOpen);
            if (message._id >= 0) this.players.splice(message._id, 0, message);
        });

        // Gestisce la disconnessione del client.
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });

        // Gestisce il messaggio di chiusura della connessione inviato dal client.
        socket.on("closeConnection", (msg: string) => {
            let message: playerData = JSON.parse(msg);
            const existingPlayerIndex = this.players.findIndex(player => player._id === message._id);
            this.players.splice(existingPlayerIndex, 1);
            let socketIndex = this.socketsOpen.findIndex(socket => socket === message.socket_id);
            this.socketsOpen.slice(socketIndex, 1);
            socket.disconnect();
        });

        // Gestisce la richiesta di aggiornamento dei giocatori inviata dal client.
        socket.on("getPlayersUpdate", (msg: string) => {
            let message: playerData = JSON.parse(msg);

            // Filtra i giocatori che hanno un ID diverso da quello ricevuto.
            let updatedPlayers: playerData[] = this.players.filter(player => player._id !== message._id);

            // Mantieni solo i giocatori il cui socket_id è contenuto in socketsOpen.
            updatedPlayers = updatedPlayers.filter(player => this.socketsOpen.includes(player.socket_id));

            // Invia agli altri giocatori l'aggiornamento dei giocatori.
            socket.emit("playersUpdate", JSON.stringify(updatedPlayers));
        });
    }
}
