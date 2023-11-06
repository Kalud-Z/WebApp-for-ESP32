import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

let totalReceivedBytes = 0;
let totalDataPointsReceived = 0;
let latestDataReceivedAt; let latestDataReceivedAt_formatted;

const ws = new WebSocket('ws://localhost:8999');
// const ws = new WebSocket('ws://185.237.15.90:8999');

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

        // Calculate the datapoint size based on the number of channels
        const datapointSize = 8 + (numberOfChannels * 4) + 4; // 8 bytes for timestamp, 4 for each channel, 4 for ID
        const numberOfDataPoints = arrayBuffer.byteLength / datapointSize;
        totalDataPointsReceived += numberOfDataPoints;
        latestDataReceivedAt = new Date(Date.now());
        latestDataReceivedAt_formatted = latestDataReceivedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let batchData = {
            timestamps: [],
            channelValues: Array.from({ length: numberOfChannels }, () => []),
            dataPointIDs: []
        };

        for (let i = 0; i < numberOfDataPoints; i++) {
            const offset = i * datapointSize;
            const view = new DataView(arrayBuffer, offset, datapointSize);

            batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds

            // Read each channel value
            for (let channelIndex = 0; channelIndex < numberOfChannels; channelIndex++) {
                batchData.channelValues[channelIndex].push(view.getUint32(8 + (channelIndex * 4)));
            }

            // Read the dataPointID at the end of the data point
            batchData.dataPointIDs.push(view.getUint32(8 + (numberOfChannels * 4)));
        }

        console.log('batchData : ', batchData);
        console.log('################################')
        dataEmitter.emit('dataBatch', batchData);
    }
};




function bytesToKilobytes(bytes) {
    return bytes / 1024;
}





















