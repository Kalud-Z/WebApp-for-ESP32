import express = require('express');
import http = require('http');
import WebSocket = require('ws');
import { AddressInfo } from 'ws';

// Initialize a simple HTTP server
const app = express();
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
    res.send('Hello, this is a WebSocket server!');
});




wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');

    let totalBytesSent = 0;
    let lastLoggedTime = Date.now();

    // Function to generate dummy sensor data with specific range
    const generateDummySensorData = () => {
        const ns = process.hrtime.bigint(); // Simulated nanoseconds
        const rd = Math.floor(Math.random() * (10000 - 750 + 1)) + 750; // Random RD value between 750 and 10000
        const ird = Math.floor(Math.random() * (10000 - 750 + 1)) + 750; // Random IRD value between 750 and 10000
        return `${ns}ns ${rd} ${ird}`;
    };

    // Send sensor data at a rate of 16Hz (every 62.5ms)
    const intervalId = setInterval(() => {
        const data = generateDummySensorData();
        const dataSize = Buffer.byteLength(data);
        totalBytesSent += dataSize;
        ws.send(data);

        // Every second, log the data rate and reset the counter
        if (Date.now() - lastLoggedTime >= 1000) {
            console.log(`Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0; // Reset the counter
            lastLoggedTime = Date.now();
        }
    }, 62.5);

    // Stop sending after 30 seconds
    setTimeout(() => {
        clearInterval(intervalId);
        ws.close(); // Optionally close the connection when done
    }, 30000);

    // Set up event listener for client messages, if needed
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId); // Make sure to clear interval on client disconnection
    });
});








// ###################################################################################################################
// Start our server
server.listen(process.env.PORT || 8999, () => {
    let port = (server.address() as AddressInfo).port;
    console.log(`Server started on port ${port} :)`);
});
