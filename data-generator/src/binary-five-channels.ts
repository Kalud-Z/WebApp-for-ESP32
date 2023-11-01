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

    let totalBytesSent = 0;
    let lastLoggedTime = Date.now();

    // Function to generate dummy sensor data for ECG with 24-bit resolution
    const generateDummyECGData = () => {
        const ns = process.hrtime.bigint(); // Simulated nanoseconds

        // Generating random values for 5 channels, each between 10,000,000 and 16,777,215
        const values = Array.from({ length: 5 }, () =>
            Math.floor(Math.random() * (16777216 - 10000000 + 1)) + 10000000
        );
        return `${ns}ns ${values.join(' ')}`;
    };

    // Send ECG sensor data at a rate of 1000Hz (every 1ms)
    const intervalId = setInterval(() => {
        const data = generateDummyECGData();
        const dataSize = Buffer.byteLength(data);
        totalBytesSent += dataSize;
        ws.send(data);

        // Every second, log the data rate and reset the counter
        if (Date.now() - lastLoggedTime >= 1000) {
            console.log(`Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0; // Reset the counter
            lastLoggedTime = Date.now();
        }
    }, 1);
    //10ms = max Data rate: 5,795 bytes per second
    //5ms  = max Data rate: 11,712 bytes per second
    //1ms  = max Data rate: 54,412 bytes per second  [rate of 1000Hz]

    // Stop sending after 30 seconds
    setTimeout(() => {
        clearInterval(intervalId);
        ws.close(); // Optionally close the connection when done
    }, 30000);

    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId); // Make sure to clear interval on client disconnection
    });
});







//########################################################################################################################################
// Start our server
server.listen(process.env.PORT || 8999, () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Binary - Five channels | Server started on port ${port} :)`);
});

