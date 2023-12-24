import { globes, movementData, playerData } from "./types";
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
    private points: number;
    private globes: Array<globes>;
    private windowHeight: number;
    private windowWidth: number;

    /**
     * Costruttore della classe Game.
     * @param socket Oggetto Socket rappresentante la connessione al server.
     */
    constructor(socket: Socket, windowWidth: number, windowHeight: number) {
        // Inizializzazione del gioco e assegnazione di un ID univoco al giocatore.
        nodegames.init();
        this.playerId = Math.round(Math.random() * (999 - 0) + 999);
        this.position = [200, 200];
        this.players = new Array<playerData>();
        this.socket = socket;
        this.points = 10;
        this.globes = new Array<globes>;
        this.windowHeight = windowHeight;
        this.windowWidth = windowWidth;
        
        // Creazione del gioco utilizzando la libreria nodegamesjs.
        nodegames.newGame(async (game: any) => {
            this.game = game;
            game.setWindowName("IRS Client Test");

            // Gestisce l'evento di chiusura del gioco e disconnessione dal server.
            
            while (true) {
                // Gestisce l'evento di pressione di un tasto e invia il movimento al server.
                game.on("keypress", (event: any) => {
                    let key = event.key;
                    let data: movementData = {key: key, _id: this.playerId};
                    socket.emit("movement", JSON.stringify(data));
                });
                
                // Disegna gli elementi del gioco.
                this.draw(game);
                
                game.on("close", () => {
                    socket.emit("closeConnection", JSON.stringify({ _id: this.playerId, pos: this.position, socket_id: this.socket.id, points: this.points }))
                    socket.disconnect();
                    process.exit(0);
                });
                // Rende il frame del gioco.
                game.renderFrame();
                // Attendere 1 millisecondo prima del prossimo ciclo.
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 1)
                });
            }
        }, this.windowWidth, this.windowHeight);
    }

    /**
     * Disegna gli elementi del gioco.
     * @param game Oggetto rappresentante il gioco.
     */
    private draw(game: any) {
        game.clear();

        game.text(this.position[0] - 10, this.position[1] - this.points - 20, (this.playerId).toString(), [255, 255, 255], 10, "Arial")
        game.circle(this.position[0], this.position[1], this.points, [2, 12, 156]);
        
        this.players.forEach((player, idx) => {
            if (player._id != this.playerId) {
                game.text(player.pos[0] - 10, player.pos[1] - player.points - 20, (player._id).toString(), [255, 255, 255], 10, "Arial")
                game.circle(player.pos[0], player.pos[1], player.points, [255, 255, 255]);
            }
        });

        this.globes.forEach(globe => {
            game.circle(globe.pos[0], globe.pos[1], 5, [25, 122, 123])
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

    public setPlayerData(data: playerData): void {
        if(data != undefined) {
            this.position = data.pos; 
            this.points = data.points;
        }
    }

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

    public setGlobes(data: Array<globes>): void { if(data != undefined) this.globes = data; }
}
