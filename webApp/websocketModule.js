import { EventEmitterModule } from './eventEmitterModule.js';
class WebSocketEmitter extends EventEmitterModule {}

export const dataEmitter = new WebSocketEmitter();

export let numberOfChannels;


function startTheApp() {
    const numberOfDataPointsPerBatch = 20; //TODO : calculate this dynamically.

    let totalReceivedBytes = 0;
    let totalDataPointsReceived = 0;
    let latestDataReceivedAt; let latestDataReceivedAt_formatted;
    let allBatchesReceived = [];


    const ws = new WebSocket('ws://localhost:8999');
    // const ws = new WebSocket('ws://192.168.3.5:8999'); //Youssou-Laptop
    // const ws = new WebSocket('ws://185.237.15.90:8999'); //Ubuntu-remote-server
    // const ws = new WebSocket('ws://192.168.3.5:8999'); //rp-ubuntu-server

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

            const batchTimestamp = formatTime(new Date()); // Format the current timestamp
            allBatchesReceived.push({ batchID: batchID, timestamp: batchTimestamp });

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

            dataEmitter.emit('dataBatch', batchData);
        }

    };

    ws.onerror = function (error) {
        console.error('WebSocket Error: ', error);
    };

    ws.onclose = function (event) {
        console.log('WebSocket connection closed');
        console.log(`Total size of date received: ${bytesToKilobytes(totalReceivedBytes)} kb.`);
        console.log(`Total data points received: ${totalDataPointsReceived}`);
        console.log(`Latest Data received at: ${latestDataReceivedAt_formatted}`);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        downloadJSON(allBatchesReceived, `allReceivedBatches_${numberOfChannels}_channels_${numberOfDataPointsPerBatch}_dp_per_batch.json`);
    };

}

//--------------------------------  HELPING FUNCTIONS -----------------------------------------------------

document.getElementById('startButton').addEventListener('click', function() {
    startTheApp(); // This will call the function when the button is clicked
});


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

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link element
    const a = document.createElement('a');
    // Set link's href to point to the Blob URL
    a.href = url;
    a.download = filename;
    // Append link to the body
    document.body.appendChild(a);
    // Dispatch click event on the link
    // This is necessary because link.click() does not work on some browsers
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    // Remove link from body
    document.body.removeChild(a);
    // Release the Blob URL
    URL.revokeObjectURL(url);
}
