import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';


// Initialize a simple HTTP server
const app = express();
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocketServer({ server });

interface sentBatch {
    batchID: number;
    timestamp: string;
}


// const numberOfChannels: number = 15;
const numberOfChannels: number = parseInt(process.env.CH ?? '10');
const numberOfDataPointsPerBatch: number = 50;
const allSentBatches: sentBatch[] = [];  // Track all sent batches with their timestamps


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
    // let latestDataSentAt = new Date(Date.now());
    let latestDataSentAt = new Date();
    let latestDataSentAt_formatted: string;


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

    let batchID = 0;

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
                const angle = (2 * Math.PI * (totalDataPointsGenerated % totalPointsInPeriod)) / totalPointsInPeriod;
                const value = isSine
                    ? generateSineData(angle, min, max)
                    : generateSawtoothData(totalDataPointsGenerated, totalPointsInPeriod, min, max);

                buffer.writeUInt32BE(value, 8 + (j * 4));
            }

            buffer.writeUInt32BE(dataPointId++, 8 + (numberOfChannels * 4));
            dataPoints.push(buffer);

            ns = ns + nsGap;
        }

        const batchBuffer = Buffer.alloc(4); // Allocate 4 bytes for the batch ID
        batchBuffer.writeUInt32BE(batchID, 0); // Write the batch ID at the start

        const dataPointsBuffer = Buffer.concat(dataPoints); // Concatenate all data point buffers
        return Buffer.concat([batchBuffer, dataPointsBuffer]); // Prepend the batch ID to the data points buffer
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
                    // latestDataSentAt = new Date(Date.now());
                    latestDataSentAt = new Date();
                    // allSentBatches.push({ batchID: batchID++, timestamp: new Date(latestDataSentAt) });
                    allSentBatches.push({ batchID: batchID++, timestamp: formatTime(latestDataSentAt) });
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
        latestDataSentAt_formatted = formatTime(latestDataSentAt);
        console.log('Latest Data sent at : ', latestDataSentAt_formatted);
        console.log('#############################################')
        clearInterval(intervalId);

        // const dirPath = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results';
        const dirPath = __dirname;
        const fileName = `allSentBatches_${numberOfChannels}_channels_${numberOfDataPointsPerBatch}_dp_per_batch.json`;
        const filePath = path.join(dirPath, fileName);

        // Call the function to save allSentBatches to a file
        saveDataToFile(filePath, allSentBatches, (err) => {
            if (err) {
                console.error('An error occurred while writing JSON Object to File.', err);
            } else {
                console.log('JSON file has been saved.');
            }
        });

    });
});




//---------- HELPING FUNCTIONS ---------------------------------------------

function bytesToKilobytes(bytes: number) {
    return bytes / 1024;
}

function formatTime(date: Date) {
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let seconds = date.getSeconds().toString().padStart(2, '0');
    let milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

function saveDataToFile(filePath: string, data: any, callback: (error?: NodeJS.ErrnoException | null) => void) {
    // Convert the data to a JSON string with pretty printing
    const jsonData = JSON.stringify(data, null, 2);

    // Write the JSON string to the file system
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
        if (err) {
            // If an error occurs, execute the callback with the error as a parameter
            callback(err);
        } else {
            // If no error, execute the callback with no parameters to indicate success
            callback();
        }
    });
}

function deleteExistingBatchFiles() {
    const directoryPath = __dirname;
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Could not list the directory.', err);
            process.exit(1);
        }

        files.forEach(file => {
            if (file.includes('allSentBatches')) {
                const filePath = path.join(directoryPath, file);
                fs.unlink(filePath, unlinkErr => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', filePath, unlinkErr);
                    } else {
                        console.log('Deleted file:', filePath);
                    }
                });
            }
        });
    });
}

//#######################################################################################################################


// Call the function to delete existing batch files
deleteExistingBatchFiles();

// Start our server on all IPv4 addresses available to the operating system.
server.listen(Number(process.env.PORT) || 8999, '0.0.0.0', () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Server started on port ${port}`);
});


