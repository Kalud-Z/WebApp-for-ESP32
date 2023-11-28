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
    let totalBytesSentFinal = 0;
    let lastLoggedTime = Date.now();
    let secondsElapsed = 0;
    let dataPointId = 0; // Initialize the ID counter
    const gapBetweenTimeStamps_inMilliSeconds = 1;


    // Function to generate dummy sensor data with specific range
    const generateDummySensorDataBatch = () => {
        const dataPoints = [];
        let ns = process.hrtime.bigint(); // Initial timestamp in nanoseconds
        const nsGap = BigInt(gapBetweenTimeStamps_inMilliSeconds) * BigInt(1_000_000); // 50ms gap in nanoseconds

        for (let i = 0; i < 5; i++) {
            const min = 80479;
            const max = 119479;
            const rd = Math.floor(Math.random() * (max - min + 1)) + min;
            const ird = Math.floor(Math.random() * (max - min + 1)) + min;

            const buffer = Buffer.alloc(20);
            buffer.writeBigUInt64BE(ns, 0);
            buffer.writeUInt32BE(rd, 8);
            buffer.writeUInt32BE(ird, 12);
            buffer.writeUInt32BE(dataPointId++, 16);
            dataPoints.push(buffer);

            ns = ns + nsGap; // Increment timestamp by the gap for the next data point
        }

        return Buffer.concat(dataPoints);
    };

    // Send sensor data at a rate of 16Hz (every 62.5ms)
    const intervalId = setInterval(() => {
        const dataBufferBatch = generateDummySensorDataBatch();
        totalBytesSent += dataBufferBatch.length;
        totalBytesSentFinal += dataBufferBatch.length;
        ws.send(dataBufferBatch); // Send the batch as binary data

        // Every second, log the data rate and reset the counter
        if (Date.now() - lastLoggedTime >= 1000) {
            secondsElapsed++; // Increment the seconds elapsed counter
            console.log(`${secondsElapsed}. Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0; // Reset the counter
            lastLoggedTime = Date.now();
            console.log(`Current bufferedAmount: ${ws.bufferedAmount}`); //[3]
        }
    }, gapBetweenTimeStamps_inMilliSeconds * 10);
    // 62.5ms = 16Hz : max Data rate: 441 bytes per second
    // 20ms   = 50Hz : max Data rate: 1,269 bytes per second (this is what the current sample rate of the dev board)
    // 1ms    = 1000Hz :max Data rate: 14,500 bytes per second ==> issues of latency and data loss (~100s latency)
    // 4ms => ~6s latency introduced.
    // 5ms => ~1s latency introduced.
    // starting from 6ms => 0s  latency introduced.


    // Stop sending after 30 seconds
    setTimeout(() => {
        clearInterval(intervalId);
        ws.close(); // Optionally close the connection when done
        console.log(`Total amount of data sent: ${bytesToKilobytes(totalBytesSentFinal) } kb.`);
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



function bytesToKilobytes(bytes: number) {
    return bytes / 1024;
}




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

// ------------------------------------------------------------------------
//
// [3]
// In the context of network programming and WebSockets, a buffer is a temporary storage area, usually in memory,
// where data is held while it's being transferred from one place to another. The buffer allows for handling differences in
// speed between the producer and consumer of the data stream.
//
// Here's a more detailed look at how buffers work in the context of your WebSocket server and client communication:
//
// ### What is a Buffer?
//     A buffer is akin to a queue where data can "wait in line" until the receiving side (the client, in this case) is ready
//     to process it. When you send data over a WebSocket connection, it doesn't go directly to the network. First, it gets placed into this buffer,
//     and from there, it's sent over the network to the client in a controlled manner.
//
// ### Why are Buffers Needed?
//     1. **Speed Matching:** Devices and applications usually operate at different speeds. The server might be able to produce data much
//     faster than the network can transmit it, or the client can consume it. Buffers help to even out these differences.
    // 2. **Burst Handling:** Sometimes data is generated in bursts rather than a steady stream. Buffers accumulate this data and then
    // send it out at a steady pace.
    // 3. **Efficiency:** Network resources are used more efficiently when data is sent in larger chunks, rather than many small ones.
    // This is because there's an overhead with each message sent, so it's better to send fewer, larger messages than many small ones.
//
// ### How Does a Buffer Work in WebSocket?
//
//     When you use `ws.send()` to send data to the client, the data is first added to the WebSocket's send buffer.
//     The WebSocket protocol then handles transmitting this data across the network to the client.
//
// The `bufferedAmount` property of a WebSocket gives you the size, in bytes, of all data currently queued to be sent.
// When this property is `0`, it means there is no data waiting to be sent.
//
// ### What Happens When a Buffer Gets Full?
//     If you keep adding data to the buffer faster than it can be sent out, eventually you'll reach a point where the buffer is full.
//     When this happens:
// - Further attempts to send data may cause your application to block or slow down, waiting for space to become available in the buffer.
// - If the buffer isn't able to empty because the client can't keep up, you might start seeing increased memory usage,
// which can lead to other issues or even crash your server if it runs out of memory.
// - In some implementations, if you try to send data when the buffer is full, it might simply drop the new data, leading to data loss.
//
// ### Monitoring and Managing the Buffer
// To avoid issues related to the buffer getting full, you can monitor the `bufferedAmount`. If it starts to get too large, you can implement backpressure, as previously discussed, to slow down or pause sending data until the buffer size decreases to a manageable level.
//     In summary, buffers are essential for managing data flow between entities that produce and consume data at different rates. By effectively monitoring and controlling these buffers, you can ensure that your WebSocket server remains responsive and efficient, even under high loads or with slow clients.
