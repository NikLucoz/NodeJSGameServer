import { GameServer } from "./server";

const ip = "192.168.0.245";
const port = 5555;
const gameServer = new GameServer(ip, port);

var tickrate = 2;
var interval = 1000 / tickrate; // Calcola l'intervallo in millisecondi

var intervalId = setInterval(function () {
    gameServer.updateClients();
    gameServer.generateGlobes();
}, interval);