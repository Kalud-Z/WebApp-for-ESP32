import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

let totalReceivedBytes = 0;
let totalDataPointsReceived = 0;
let latestDataReceivedAt; let latestDataReceivedAt_formatted;

const ws = new WebSocket('ws://localhost:8999');
// const ws = new WebSocket('ws://185.237.15.90:8999');
// const ws = new WebSocket('ws://192.168.3.5:8999');


export let numberOfChannels;

ws.binaryType = 'arraybuffer';

ws.onopen = function (event) {
    console.log('WebSocket connection established');
};

let lastFrameTime = Date.now();

ws.onmessage = function (event) {
    let now = Date.now();
    let frameDelay = now - lastFrameTime;
    lastFrameTime = now;

    // Handle configuration message
    if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'configuration') {
            numberOfChannels = message.channels;
            dataEmitter.emit('configuration', numberOfChannels);
        }
    } else { // Handle binary data
        const receivedBytes = event.data.byteLength;
        totalReceivedBytes += receivedBytes;
        const arrayBuffer = event.data;

        // Define the sizes
        const batchIdSize = 4; // Size of the batch ID in bytes
        const timestampSize = 8; // Size of the timestamp in bytes
        const channelValueSize = 4; // Size of each channel value in bytes
        const idSize = 4; // Size of the data point ID in bytes
        const datapointSize = timestampSize + (numberOfChannels * channelValueSize) + idSize;

        const view = new DataView(arrayBuffer);
        const batchID = view.getUint32(0); // Read the batch ID from the start of the buffer

        // Calculate the number of data points, subtracting the batchIdSize from the buffer length first
        const numberOfDataPoints = (arrayBuffer.byteLength - batchIdSize) / datapointSize;
        totalDataPointsReceived += numberOfDataPoints;
        latestDataReceivedAt = new Date();
        latestDataReceivedAt_formatted = formatTime(latestDataReceivedAt)

        // Initialize the batchData object
        let batchData = {
            batchID: batchID,
            timestamps: [],
            dataPointIDs: [],
            // Add an array for each channel
        };

        for (let channel = 1; channel <= numberOfChannels; channel++) {
            batchData[`channel${channel}Values`] = [];
        }

        // Adjust the loop to start reading after the batch ID
        for (let i = 0; i < numberOfDataPoints; i++) {
            const offset = batchIdSize + (i * datapointSize);
            const view = new DataView(arrayBuffer, offset, datapointSize);

            batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds

            // Populate each channel's values
            for (let channel = 0; channel < numberOfChannels; channel++) {
                batchData[`channel${channel + 1}Values`].push(view.getUint32(timestampSize + (channel * channelValueSize)));
            }

            // Add the data point ID
            batchData.dataPointIDs.push(view.getUint32(timestampSize + (numberOfChannels * channelValueSize)));
        }

        console.log('this is batchData : ', batchData);
        dataEmitter.emit('dataBatch', batchData);
    }



    // { // Handle binary data
    //     const receivedBytes = event.data.byteLength;
    //     totalReceivedBytes += receivedBytes;
    //     const arrayBuffer = event.data;
    //
    //     // Define the size of one data point based on the number of channels
    //     const timestampSize = 8; // Size of the timestamp in bytes
    //     const channelValueSize = 4; // Size of each channel value in bytes
    //     const idSize = 4; // Size of the data point ID in bytes
    //     const datapointSize = timestampSize + (numberOfChannels * channelValueSize) + idSize;
    //
    //     const numberOfDataPoints = arrayBuffer.byteLength / datapointSize;
    //     totalDataPointsReceived += numberOfDataPoints;
    //     latestDataReceivedAt = new Date();
    //     latestDataReceivedAt_formatted = formatTime(latestDataReceivedAt)
    //
    //     // Initialize the batchData object
    //     let batchData = {
    //         timestamps: [],
    //         dataPointIDs: [],
    //     };
    //
    //     // Add an array for each channel
    //     for (let channel = 1; channel <= numberOfChannels; channel++) {
    //         batchData[`channel${channel}Values`] = [];
    //     }
    //
    //     for (let i = 0; i < numberOfDataPoints; i++) {
    //         const offset = i * datapointSize;
    //         const view = new DataView(arrayBuffer, offset, datapointSize);
    //
    //         batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds
    //
    //         // Populate each channel's values
    //         for (let channel = 0; channel < numberOfChannels; channel++) {
    //             batchData[`channel${channel + 1}Values`].push(view.getUint32(timestampSize + (channel * channelValueSize)));
    //         }
    //
    //         // Add the data point ID
    //         batchData.dataPointIDs.push(view.getUint32(timestampSize + (numberOfChannels * channelValueSize)));
    //     }
    //
    //     dataEmitter.emit('dataBatch', batchData);
    // }



};


ws.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};

ws.onclose = function (event) {
    console.log('WebSocket connection closed');
    console.log(`Total size of date received: ${bytesToKilobytes(totalReceivedBytes)} kb.`);
    console.log(`Total data points received: ${totalDataPointsReceived}`);
    console.log(`Latest Data received at: ${latestDataReceivedAt_formatted}`);
};




function bytesToKilobytes(bytes) {
    return bytes / 1024;
}


function formatTime(date) {
    if (!(date instanceof Date)) {
        throw new Error('Input must be a Date object.');
    }

    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let seconds = date.getSeconds().toString().padStart(2, '0');
    let milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

