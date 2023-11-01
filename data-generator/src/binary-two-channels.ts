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
    ws.send(JSON.stringify({ type: 'configuration', channels: 2 }));

    let totalBytesSent = 0;
    let lastLoggedTime = Date.now();
    let secondsElapsed = 0;


    // Function to generate dummy sensor data with specific range
    const generateDummySensorData = () => {
        const ns = process.hrtime.bigint(); // Simulated nanoseconds [1]
        const min = 80479; // Lower bound of the random value
        const max = 119479; // Upper bound of the random value

        // Generate random values within the specified range for rd and ird
        const rd = Math.floor(Math.random() * (max - min + 1)) + min;
        const ird = Math.floor(Math.random() * (max - min + 1)) + min;

        // Create a buffer: 8 bytes for bigint, 4 bytes each for rd and ird
        const buffer = Buffer.alloc(16);

        // Write the timestamp as bigint (8 bytes)
        buffer.writeBigUInt64BE(ns, 0);

        // Write rd and ird as unsigned integers (4 bytes each) [2]
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
            secondsElapsed++; // Increment the seconds elapsed counter
            console.log(`${secondsElapsed}. Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0; // Reset the counter
            lastLoggedTime = Date.now();
        }
    }, 10);
    // 62.5ms = 16Hz : max Data rate: 441 bytes per second
    // 20ms   = 50Hz : max Data rate: 1,269 bytes per second (this is what the current sample rate of the dev board)
    // 1ms    = 1000Hz :max Data rate: 14,500 bytes per second ==> issues of latency and data loss


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




// ___________________________________________________________________________________________________________
//
// [1]
// It's quite common to use a 64-bit value to represent time. In various systems and protocols,
// a 64-bit timestamp is standard, providing enough granularity for most applications without
// being unnecessarily large.
//
// The writeBigUInt64BE Method: This specific method is designed to write a BigInt as a 64-bit
// big-endian unsigned integer. In Node.js, the BigInt type is used to represent integers
// larger than the 2^53 - 1 limit of the Number type. When dealing with high-resolution timestamps,
// especially ones represented in nanoseconds, using BigInt is a necessity to avoid losing precision,
// as the number of nanoseconds since the Unix epoch is too large to be represented accurately by a Number.


// --------------------------------------------------------

// [2]
// why 4 bytes for each channel ?
// Dealing with non-standard data sizes can add complexity to the code,
// as standard types and operations are typically designed
// to work with powers of two (8, 16, 32, 64 bits, etc.)

