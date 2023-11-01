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
        const rd = Math.floor(Math.random() * (16777216 - 10000000 + 1)) + 10000000;
        const ird = Math.floor(Math.random() * (16777216 - 10000000 + 1)) + 10000000;

        // Create a buffer: 8 bytes for bigint, 4 bytes each for rd and ird
        const buffer = Buffer.alloc(16);

        // Write the timestamp as bigint (8 bytes)
        buffer.writeBigUInt64BE(ns, 0);

        // Write rd and ird as unsigned integers (4 bytes each)
        buffer.writeUInt32BE(rd, 8);
        buffer.writeUInt32BE(ird, 12);

        return buffer;
    };

    // Send sensor data at a rate of 16Hz (every 62.5ms)
    const intervalId = setInterval(() => {
        const dataBuffer = generateDummySensorData();
        totalBytesSent += dataBuffer.length;
        ws.send(dataBuffer); // Send the buffer as binary data

        // Every second, log the data rate and reset the counter
        if (Date.now() - lastLoggedTime >= 1000) {
            console.log(`Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0; // Reset the counter
            lastLoggedTime = Date.now();
        }
    }, 20);
    // 62.5ms = 16Hz : max Data rate: 441 bytes per second
    // 20ms   = 50Hz : max Data rate: 1269 bytes per second


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
    console.log(`Binary - Two Channels | Server started on port ${port} :)`);
});
