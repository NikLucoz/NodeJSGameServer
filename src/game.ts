import { playerData } from "./types";
import { Socket } from "socket.io-client";
const nodegames = require("nodegamesjs");
const { exit } = require('node:process');

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
            game.setWindowName("IRS");

            // Gestisce l'evento di chiusura del gioco e disconnessione dal server.
            game.on("close", () => {
                socket.disconnect();
                process.exit(0);
            });

            while (true) {
                // Invia l'aggiornamento della posizione del giocatore al server.
                socket.emit("getPlayersUpdate", JSON.stringify({ _id: this.playerId, pos: this.position }));

                // Gestisce l'evento di pressione di un tasto e invia il movimento al server.
                game.on("keypress", (event: any) => {
                    let key = event.key;
                    let pos: Array<number> = this.move(key);
                    let newData: playerData = { _id: this.playerId, pos: pos, socket_id: this.socket.id };
                    socket.emit("movement", JSON.stringify(newData));
                });

                // Disegna gli elementi del gioco.
                this.draw(game);

                // Gestisce l'evento di chiusura del gioco e disconnessione dal server.
                game.on("close", () => {
                    socket.emit("closeConnection", JSON.stringify({ _id: this.playerId, pos: this.position, socket_id: this.socket.id }))
                    exit();
                });

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
     * Muove il giocatore in base al tasto premuto.
     * @param key Tasto premuto.
     * @returns Nuova posizione del giocatore.
     */
    private move(key: any): Array<number> {
        switch (key) {
            case "w":
                this.position[1] -= 10;
                break;
            case "a":
                this.position[0] -= 10;
                break;
            case "s":
                this.position[1] += 10;
                break;
            case "d":
                this.position[0] += 10;
                break;
        }
        return this.position;
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

    /**
     * Invia una richiesta di aggiornamento dei giocatori al server.
     */
    public getPlayersUpdate(): void {
        this.socket.emit("getPlayersUpdate", JSON.stringify({ _id: this.playerId, pos: this.position }));
    }
}
