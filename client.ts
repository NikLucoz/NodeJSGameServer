// client.ts
import { Socket, io } from "socket.io-client";

const serverUrl = "http://127.0.0.1:5555"; // Replace with your server's IP and port

// Connect to the server
const socket: Socket = io(serverUrl);

// Handle connection event
socket.on("connect", () => {
    console.log("Connected to the server");

    // Send a message to the server
    console.log("Sending: Hello, server!")
    socket.emit("message", "Hello, server!");
});

// Handle message event from the server
socket.on("message", (msg: string) => {
    console.log("Received from server:", msg);
});

// Handle disconnection event
socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});