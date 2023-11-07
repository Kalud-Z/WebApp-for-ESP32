import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { AddressInfo } from 'net';

// Initialize a simple HTTP server
const app = express();
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocketServer({ server });

const numberOfChannels: number = 15;
const numberOfDataPointsPerBatch: number = 20;


app.get('/', (req, res) => {
    res.send('Hello, this is a WebSocket server!');
});

wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');
    // Send the configuration message to the client
    ws.send(JSON.stringify({ type: 'configuration', channels: numberOfChannels }));

    const intervalBetweenDataPoints_inMilliSeconds = 1;

    // console.log('the Data is sent at rate of 'intervalBetweenDataPoints_inMilliSeconds * numberOfDataPointsPerBatch)
    console.log(`Settings : data sent as ${numberOfDataPointsPerBatch} datapoints per batch every ${intervalBetweenDataPoints_inMilliSeconds * numberOfDataPointsPerBatch}ms | ${numberOfChannels} Channels`)

    let totalBytesSent = 0;
    let totalBytesSentFinal = 0;
    let lastLoggedTime = Date.now();
    let secondsElapsed = 0;
    let dataPointId = 0; // Initialize the ID counter
    let totalDataPointsGenerated = 0;
    let totalDataPointsSent = 0;
    let latestDataReceivedAt = new Date(Date.now());
    let latestDataReceivedAt_formatted: string;



    // Function to generate sine wave data
    const generateSineData = (angle: number, min: number, max: number) => {
        const sineValue = Math.sin(angle);
        return Math.round(((sineValue + 1) / 2) * (max - min) + min);
    };

    // Function to generate sawtooth wave data
    const generateSawtoothData = (dataPointIndex: number, totalPoints: number, min: number, max: number) => {
        const value = (dataPointIndex % totalPoints) / totalPoints;
        return Math.round(value * (max - min) + min);
    };

    const channelWaveTypes = Array.from({ length: numberOfChannels }, () => Math.random() < 0.5);

    // Function to generate dummy sensor data as a binary buffer
    const generateDummySensorDataBatch = () => {
        const dataPoints = [];
        let ns = process.hrtime.bigint(); // Initial timestamp in nanoseconds
        const nsGap = BigInt(intervalBetweenDataPoints_inMilliSeconds) * BigInt(1_000_000); // Gap in nanoseconds
        const totalPointsInPeriod = 1000; // Points in one period

        const min = 10000000;
        const max = 16777215;

        for (let i = 0; i < numberOfDataPointsPerBatch; i++) {
            totalDataPointsGenerated++; // Increment total data points generated

            const bufferSize = 8 + (numberOfChannels * 4) + 4;
            const buffer = Buffer.alloc(bufferSize);
            buffer.writeBigUInt64BE(ns, 0);

            for (let j = 0; j < numberOfChannels; j++) {
                const isSine = channelWaveTypes[j];

                // Calculate the angle for the wave based on the current data point and the total points in a period
                const angle = (2 * Math.PI * (totalDataPointsGenerated % totalPointsInPeriod)) / totalPointsInPeriod;

                // Use the appropriate function to generate the data based on the type
                const value = isSine
                    ? generateSineData(angle, min, max)
                    : generateSawtoothData(totalDataPointsGenerated, totalPointsInPeriod, min, max);

                buffer.writeUInt32BE(value, 8 + (j * 4));
            }

            buffer.writeUInt32BE(dataPointId++, 8 + (numberOfChannels * 4));
            dataPoints.push(buffer);

            ns = ns + nsGap;
        }

        return Buffer.concat(dataPoints);
    };



    // Send binary sensor data at a specified rate
    const intervalId = setInterval(() => {
        const dataBufferBatch = generateDummySensorDataBatch();
        totalBytesSent += dataBufferBatch.length;
        totalBytesSentFinal += dataBufferBatch.length;

        // ws.send(dataBufferBatch); // Send the batch as binary data
        try {
            ws.send(dataBufferBatch, (err) => {
                if (err) { console.error('Send error: ', err) } else {
                    totalDataPointsSent += numberOfDataPointsPerBatch;
                    latestDataReceivedAt = new Date(Date.now());
                }
            });
        } catch (e) {
            console.error('Caught error during send: ', e);
        }

        // Logging the data rate and bufferedAmount state.
        if (Date.now() - lastLoggedTime >= 1000) {
            secondsElapsed++; // Increment the seconds elapsed counter
            console.log(`${secondsElapsed}. Data rate: ${totalBytesSent} bytes per second`);
            totalBytesSent = 0;
            lastLoggedTime = Date.now();
            console.log(`Current bufferedAmount: ${ws.bufferedAmount}`);
        }
    }, intervalBetweenDataPoints_inMilliSeconds * numberOfDataPointsPerBatch); // adjust the interval as needed

    // Stop sending after 30 seconds
    setTimeout(() => {
        clearInterval(intervalId);
        ws.close();
        console.log(`Total amount of data sent: ${ bytesToKilobytes(totalBytesSentFinal)} kb.`);
    }, 30000);

    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        console.log('totalDataPointsGenerated : ', totalDataPointsGenerated);
        console.log('Total data points sent successfully: ' ,totalDataPointsSent);
        latestDataReceivedAt_formatted = latestDataReceivedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        console.log('Latest Data sent at : ', latestDataReceivedAt_formatted);
        clearInterval(intervalId);
    });
});

function bytesToKilobytes(bytes: number) {
    return bytes / 1024;
}


//#######################################################################################################################

// Start our server on all IPv4 addresses available to the operating system.
server.listen(Number(process.env.PORT) || 8999, '0.0.0.0', () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Server started on port ${port}`);
});


