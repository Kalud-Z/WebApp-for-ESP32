import { EventEmitterModule } from './eventEmitterModule.js';
class WebSocketEmitter extends EventEmitterModule {}

export const dataEmitter = new WebSocketEmitter();

// export let numberOfChannels;
export let numberOfChannels;


let allBatchesReceived = [];


function startTheApp()   {
    const numberOfDataPointsPerBatch = 20; //TODO : calculate this dynamically.

    let totalReceivedBytes = 0;
    let totalDataPointsReceived = 0;
    let latestDataReceivedAt_formatted;
    // let allBatchesReceived = [];


    // const ws = new WebSocket('ws://localhost:8999');
    const ws = new WebSocket('ws://192.168.3.5:8999/ws'); //ESP32
    // const ws = new WebSocket('ws://192.168.43.253:8999/ws'); //ESP32
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

        console.log('data : ', event.data);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')

        if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            if (message.type === 'configuration') {
                numberOfChannels = message.channels;
                dataEmitter.emit('configuration', numberOfChannels);
            }

            if (message.type === 'simulationState') {
                if(message.value === "DONE") {
                    console.log(`Total size of date received: ${bytesToKilobytes(totalReceivedBytes)} kb.`);
                    console.log(`Total data points received: ${totalDataPointsReceived}`);
                    console.log(`Latest Data received at: ${latestDataReceivedAt_formatted}`);
                    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
                    downloadJSON(allBatchesReceived, `allReceivedBatches_${numberOfChannels}_channels_${numberOfDataPointsPerBatch}_dp_per_batch.json`);
                }
            }

            if (message.type === 'timestampData') {
            const timestampArray = message.value; // Assuming message.value contains the timestamp array
            console.log('Timestamp Array:', timestampArray);
        }

        } else {
            // Handle binary data
            const receivedBytes = event.data.byteLength;
            totalReceivedBytes += receivedBytes;
            const arrayBuffer = event.data;

            // Define the sizes
            const sendingTimestampSize = 8; // Size of the sending timestamp in bytes
            const batchIdSize = 4; // Size of the batch ID in bytes
            const timestampSize = 8; // Size of the timestamp in bytes
            const channelValueSize = 4; // Size of each channel value in bytes
            const idSize = 4; // Size of the data point ID in bytes
            const datapointSize = timestampSize + (numberOfChannels * channelValueSize) + idSize;

            // Create a DataView for the arrayBuffer
            const view = new DataView(arrayBuffer);

            // Read the sending timestamp
            const sendingTimestamp = Number(view.getBigUint64(0, true)); // Convert to milliseconds
            console.log('Sending Timestamp:', formatTimestamp(sendingTimestamp));
            console.log('Sending Timestamp:', sendingTimestamp);


            // Read the batch ID (now starts after the sending timestamp)
            const batchID = view.getUint32(sendingTimestampSize, true); // Read as little-endian

            // Calculate the number of data points
            const numberOfDataPoints = Math.floor((arrayBuffer.byteLength - sendingTimestampSize - batchIdSize) / datapointSize);

            // Initialize the batchData object
            let batchData = {
                batchID: batchID,
                // sendingTimestamp: sendingTimestamp,
                timestamps: [],
                dataPointIDs: [],
                // Add an array for each channel
            };

            for (let channel = 1; channel <= numberOfChannels; channel++) {
                batchData[`channel${channel}Values`] = [];
            }

            // Adjust the loop to start reading after the batch ID and sending timestamp
            for (let i = 0; i < numberOfDataPoints; i++) {
                const offset = sendingTimestampSize + batchIdSize + (i * datapointSize);
                const dataView = new DataView(arrayBuffer, offset, datapointSize);

                const dataTimestamp = Number(dataView.getBigUint64(0, true)) / 1e6; // Read timestamp as little-endian and convert to seconds
                batchData.timestamps.push(dataTimestamp);

                // Populate each channel's values
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const value = dataView.getUint32(timestampSize + (channel * channelValueSize), true);
                    batchData[`channel${channel + 1}Values`].push(value);
                }

                const dataPointID = dataView.getUint32(timestampSize + (numberOfChannels * channelValueSize), true); // Read ID as little-endian
                batchData.dataPointIDs.push(dataPointID);
            }

            console.log('Processed Batch Data:', batchData);
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
// document.getElementById('showBatches').addEventListener('click', function() {
//     console.log('allBatchesReceived : ', allBatchesReceived)
// });



function bytesToKilobytes(bytes) {
    return bytes / 1024;
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


function formatTimestamp(timestampMilliseconds) {
    // Create a new Date object using the milliseconds timestamp
    const date = new Date(timestampMilliseconds);

    // Format hours, minutes, seconds, and milliseconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    // Combine the parts into a formatted string
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

