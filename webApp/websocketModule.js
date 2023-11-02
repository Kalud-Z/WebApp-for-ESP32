import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

let totalReceivedBytes = 0;

const ws = new WebSocket('ws://localhost:8999');

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

    // Log or display the delay somewhere
    // console.log(`Time since last frame: ${frameDelay}ms`);

    if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'configuration') {
            numberOfChannels = message.channels;
            dataEmitter.emit('configuration', numberOfChannels);
        }
    } else {
        const receivedBytes = event.data.byteLength;
        totalReceivedBytes += receivedBytes;
        console.log(`Received ${receivedBytes} bytes in this message. Total received: ${bytesToKilobytes(totalReceivedBytes)} kb.`);

        if (numberOfChannels === 2) {
            const arrayBuffer = event.data;
            const datapointSize = 20; // Each datapoint is 20 bytes
            const numberOfDataPoints = arrayBuffer.byteLength/datapointSize;

            let batchData = {
                timestamps: [],
                rdValues: [],
                irdValues: [],
                dataPointIDs: []
            };

            for (let i = 0; i < numberOfDataPoints; i++) {
                const offset = i * datapointSize;
                const view = new DataView(arrayBuffer, offset, datapointSize);

                batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds
                batchData.rdValues.push(view.getUint32(8));
                batchData.irdValues.push(view.getUint32(12));
                batchData.dataPointIDs.push(view.getUint32(16));
            }

            dataEmitter.emit('dataBatch', batchData);
        }
    }

    ws.onerror = function (error) {
        console.error('WebSocket Error: ', error);
    };

    ws.onclose = function (event) {
        console.log('WebSocket connection closed');
    };
}




function bytesToKilobytes(bytes) {
    return bytes / 1024;
}





















