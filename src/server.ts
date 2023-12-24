import { Server, Socket } from "socket.io";
import { globes, movementData, playerData } from "./types";

/**
 * Classe che rappresenta il server del gioco.
 */
export class GameServer {
    private ip: string;
    private port: number;
    private server: Server;
    private players: Array<playerData>;
    private socketsOpen: Array<string>;
    private globes: Array<globes>;

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
        this.globes = new Array<globes>();

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
                    pos[1] -= 5;
                    break;
                case "a":
                    pos[0] -= 5;
                    break;
                case "s":
                    pos[1] += 5;
                    break;
                case "d":
                    pos[0] += 5;
                    break;
            }
            let data: playerData = {_id: updatedPlayer._id, socket_id: this.players[existingPlayerIndex].socket_id, pos: pos, points: this.players[existingPlayerIndex].points} 
            this.players.splice(existingPlayerIndex, 1, data);
            
            if (this.globes.length !== 0) {
                this.globes.forEach((globe, idx) => {
                    if (this.isGlobeInsidePlayer(globe, this.players[existingPlayerIndex])) {
                        this.players[existingPlayerIndex].points += 2;
                        this.globes.splice(idx, 1);
                        this.server.emit("globesUpdate", JSON.stringify(this.globes));
                    }
                });
            }

            /*if(this.players.length > 1) {
                let stopIteration = false;
                this.players.forEach((enemy, idx) => {
                    if(enemy._id != this.players[existingPlayerIndex]._id && !stopIteration) {
                        if(this.isPlayerInsidePlayer(this.players[existingPlayerIndex], enemy)) {
                            if(enemy.points < this.players[existingPlayerIndex].points) {
                                this.players[existingPlayerIndex].points += enemy.points;
                                this.server.sockets.sockets.get(enemy.socket_id)?.disconnect();
                                stopIteration = true;
                            }else if(enemy.points > this.players[existingPlayerIndex].points) {
                                this.players[idx].points += this.players[existingPlayerIndex].points;
                                this.server.sockets.sockets.get(this.players[existingPlayerIndex].socket_id)?.disconnect();
                                stopIteration = true;
                            }
                        }
                    }
                })
            }*/
            
            this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
        }
    }
    
    private isGlobeInsidePlayer(globe: globes, player: playerData): boolean {
        const distance = Math.sqrt((globe.pos[0] - player.pos[0]) ** 2 + (globe.pos[1] - player.pos[1]) ** 2);
        const playerRadius = (player.points * 2) - player.points; // Raggio del cerchio del giocatore
    
        return distance <= playerRadius;
    }

    private isPlayerInsidePlayer(player1: playerData, player2: playerData): boolean {
        const distance = Math.sqrt((player1.pos[0] - player2.pos[0]) ** 2 + (player1.pos[1] - player2.pos[1]) ** 2);
        const playerRadius = player2.points / 2; // Raggio del cerchio del giocatore
        
        return distance <= playerRadius;
    }

    public updateClients(): void {
        this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
    }

    private removeInactivePlayers(): playerData[] {
        this.players = this.players.filter(player => this.socketsOpen.includes(player.socket_id));
        return this.players;
    }
    
    public generateGlobes() {
        const minValue = 10;
        const maxValue = 700;
        let globesNumber: number =  Math.floor(Math.random() * (1 - 0 + 1)) + 0;
        if(this.globes.length + globesNumber >= 25) return;

        for(let i = 0; i < 1; i++) {
            const range = (maxValue - minValue) / 10; // Calcola il numero di incrementi di 10 nel range
            const randomIncrementX = Math.floor(Math.random() * (range + 1)); // Genera un incremento casuale
            const randomIncrementY = Math.floor(Math.random() * (range + 1)); // Genera un incremento casuale

            let x: number = minValue + randomIncrementX * 10;
            let y: number = minValue + randomIncrementY * 10;
            this.globes.push({pos: [x, y]});
        }
        this.server.emit("globesUpdate", JSON.stringify(this.globes));
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
            this.server.emit("globesUpdate", JSON.stringify(this.globes));
        });

        // Gestisce la disconnessione del client.
        socket.on("disconnect", () => {
            let socketIndex = this.socketsOpen.findIndex(sock => sock === socket.id);
            this.socketsOpen.splice(socketIndex, 1);
            this.server.emit("playersUpdate", JSON.stringify(this.removeInactivePlayers()));
            console.log("Client disconnected");
        });

        // Gestisce il messaggio di chiusura della connessione inviato dal client.
        socket.on("closeConnection", (msg: string) => {
            let message: playerData = JSON.parse(msg);
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
