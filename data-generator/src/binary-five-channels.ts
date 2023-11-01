import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { AddressInfo } from 'net';

// Initialize a simple HTTP server
const app = express();
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocketServer({ server });

app.get('/', (req, res) => {
    res.send('Hello, this is a WebSocket server!');
});

wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');

    // Send the configuration message to the client
    ws.send(JSON.stringify({ type: 'configuration', channels: 5 }));

    let totalBytesSent = 0;
    let lastLoggedTime = Date.now();
    let secondsElapsed = 0;

    // Function to generate dummy sensor data as a binary buffer
    const generateDummySensorDataBinary = () => {
        const ns = process.hrtime.bigint(); // Simulated nanoseconds

        // Creating a buffer with 8 bytes for bigint and 4 bytes for each sensor value
        const buffer = Buffer.alloc(8 + 4 * 5);

        // Write the timestamp as bigint (8 bytes)
        buffer.writeBigUInt64BE(ns, 0);

        // Generating and writing random values for 5 channels, each between 10,000,000 and 16,777,215
        for (let i = 0; i < 5; i++) {
            const value = Math.floor(Math.random() * (16777215 - 10000000 + 1)) + 10000000;
            buffer.writeUInt32BE(value, 8 + i * 4); // Write each value as a 4-byte unsigned integer
        }

        return buffer;
    };

    // Send binary sensor data at a specified rate
    const intervalId = setInterval(() => {
        const dataBuffer = generateDummySensorDataBinary();
        totalBytesSent += dataBuffer.length;
        ws.send(dataBuffer);

        // Logging the data rate
        if (Date.now() - lastLoggedTime >= 1000) {
            secondsElapsed++; // Increment the seconds elapsed counter
            console.log(`${secondsElapsed}. Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0;
            lastLoggedTime = Date.now();
        }
    }, 1); // adjust the interval as needed
    //10ms = max Data rate: 5,795 bytes per second                    => latency : 0ms.
    //5ms  = max Data rate: 11,712 bytes per second                   => latency : 0ms
    //1ms  = max Data rate: 54,412 bytes per second  [rate of 1000Hz] => latency : +30s + data loss i think.

    // Stop sending after 30 seconds
    setTimeout(() => {
        clearInterval(intervalId);
        ws.close();
    }, 30000);

    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});


//#######################################################################################################################
// Start our server
server.listen(process.env.PORT || 8999, () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Binary - Five channels | Server started on port ${port} :)`);
});
