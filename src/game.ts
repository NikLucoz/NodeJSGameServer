import { movementData, playerData } from "./types";
import { Socket } from "socket.io-client";
const nodegames = require("nodegamesjs");
/**
 * Classe che rappresenta il gioco lato client.
 */
export class Game {
    private playerId: number;
    private position: Array<number>;
    private players: Array<playerData>;
    private game: any;
    private socket: Socket;

    /**
     * Costruttore della classe Game.
     * @param socket Oggetto Socket rappresentante la connessione al server.
     */
    constructor(socket: Socket) {
        // Inizializzazione del gioco e assegnazione di un ID univoco al giocatore.
        nodegames.init();
        this.playerId = Math.round(Math.random() * (999 - 0) + 999);
        this.position = [200, 200];
        this.players = new Array<playerData>();
        this.socket = socket;
        
        // Creazione del gioco utilizzando la libreria nodegamesjs.
        this.game = nodegames.newGame(async (game: any) => {
            game.setWindowName("IRS Client Test");

            // Gestisce l'evento di chiusura del gioco e disconnessione dal server.
            game.on("close", () => {
                socket.emit("closeConnection", JSON.stringify({ _id: this.playerId, pos: this.position, socket_id: this.socket.id }))
                socket.disconnect();
                process.exit(0);
            });

            while (true) {
                // Gestisce l'evento di pressione di un tasto e invia il movimento al server.
                game.on("keypress", (event: any) => {
                    let key = event.key;
                    let data: movementData = {key: key, _id: this.playerId};
                    socket.emit("movement", JSON.stringify(data));
                });
                
                // Disegna gli elementi del gioco.
                this.draw(game);
                
                // Rende il frame del gioco.
                game.renderFrame();
                // Attendere 1 millisecondo prima del prossimo ciclo.
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 1)
                });
            }
        }, 400, 400);
    }

    /**
     * Disegna gli elementi del gioco.
     * @param game Oggetto rappresentante il gioco.
     */
    private draw(game: any) {
        game.clear();
        game.circle(this.position[0], this.position[1], 10, [2, 12, 156]);
        game.text(this.position[0] - 10, this.position[1] - 20, (this.playerId).toString(), [255, 255, 255], 10, "Arial")
        this.players.forEach(playerpos => {
            if (playerpos._id != this.playerId) {
                game.text(playerpos.pos[0] - 10, playerpos.pos[1] - 20, (playerpos._id).toString(), [255, 255, 255], 10, "Arial")
                game.circle(playerpos.pos[0], playerpos.pos[1], 10, [255, 255, 255]);
            }
        });
    }

    /**
     * Restituisce la posizione del giocatore.
     * @returns Posizione del giocatore.
     */
    public getPlayerPosition(): number[] { return this.position; }

    /**
     * Imposta la lista dei giocatori.
     * @param players Lista dei giocatori.
     */
    public setPlayers(players: playerData[]) { this.players = players; }

    public setPlayerPos(data: playerData): void { this.position = data.pos; }

    /**
     * Restituisce l'ID del giocatore.
     * @returns ID del giocatore.
     */
    public getPlayerId(): number { return this.playerId; }

    /**
     * Restituisce la lista dei giocatori.
     * @returns Lista dei giocatori.
     */
    public getPlayers(): playerData[] { return this.players; }
}
