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
    let dataPointId = 0; // Initialize the ID counter
    const gapBetweenTimeStamps_inMilliSeconds = 1;



    // Function to generate dummy sensor data as a binary buffer
    const generateDummySensorDataBatch = () => {
        const dataPoints = [];
        let ns = process.hrtime.bigint(); // Initial timestamp in nanoseconds
        const nsGap = BigInt(gapBetweenTimeStamps_inMilliSeconds) * BigInt(1_000_000); // Gap in nanoseconds

        for (let i = 0; i < 10; i++) {
            const min = 10000000; // Minimum value for the channel data
            const max = 16777215; // Maximum value for the channel data

            const buffer = Buffer.alloc(32);
            buffer.writeBigUInt64BE(ns, 0);

            // Write the data for the five channels
            for (let j = 0; j < 5; j++) {
                const channelValue = Math.floor(Math.random() * (max - min + 1)) + min;
                buffer.writeUInt32BE(channelValue, 8 + (j * 4));
            }

            buffer.writeUInt32BE(dataPointId++, 28); // Write the ID at the end
            dataPoints.push(buffer);

            ns = ns + nsGap; // Increment timestamp by the gap for the next data point
        }

        return Buffer.concat(dataPoints);
    };


    // Send binary sensor data at a specified rate
    const intervalId = setInterval(() => {
        const dataBufferBatch = generateDummySensorDataBatch();
        totalBytesSent += dataBufferBatch.length;
        ws.send(dataBufferBatch); // Send the batch as binary data

        // Logging the data rate
        if (Date.now() - lastLoggedTime >= 1000) {
            secondsElapsed++; // Increment the seconds elapsed counter
            console.log(`${secondsElapsed}. Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0;
            lastLoggedTime = Date.now();
            console.log(`Current bufferedAmount: ${ws.bufferedAmount}`);
        }
    }, gapBetweenTimeStamps_inMilliSeconds * 10); // adjust the interval as needed

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
server.listen(process.env.PORT || 8999, () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Binary - Five channels | Server started on port ${port} :)`);
});
