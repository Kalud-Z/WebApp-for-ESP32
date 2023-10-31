import express = require('express');
import http = require('http');
import WebSocket = require('ws');
import { AddressInfo } from 'ws';


// Initialize a simple HTTP server
const app = express();
const server = http.createServer(app);


// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ noServer: true });

// Setup the server to handle HTTP GET requests
app.get('/', (req, res) => {
    res.send('Hello, this is a WebSocket server!');
});

// Handle upgrade of the request to a WebSocket connection
server.on('upgrade', (request, socket, head) => {
    console.log('Upgrading to WebSocket...');

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// When a WebSocket connection is established
wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');
    ws.send('The WebSocket is connected and working properly');

    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });
});

// Start our server
server.listen(process.env.PORT || 8999, () => {
    let port = (server.address() as AddressInfo).port;
    console.log(`Server started on port ${port} :)`);
});
