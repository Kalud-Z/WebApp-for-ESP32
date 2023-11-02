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
        //logging how much data received so far.
        // console.log(`Received ${receivedBytes} bytes in this message. Total received: ${bytesToKilobytes(totalReceivedBytes)} kb.`);

        if (numberOfChannels === 2) {
            const arrayBuffer = event.data;
            const datapointSize = 20; // Each datapoint is 20 bytes
            const numberOfDataPoints = arrayBuffer.byteLength/datapointSize;

            let batchData = {
                timestamps: [],
                channel1Values: [],
                channel2Values: [],
                dataPointIDs: []
            };

            for (let i = 0; i < numberOfDataPoints; i++) {
                const offset = i * datapointSize;
                const view = new DataView(arrayBuffer, offset, datapointSize);

                batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds
                batchData.channel1Values.push(view.getUint32(8));
                batchData.channel2Values.push(view.getUint32(12));
                batchData.dataPointIDs.push(view.getUint32(16));
            }

            dataEmitter.emit('dataBatch', batchData);
        }

        if (numberOfChannels === 5) {
            const arrayBuffer = event.data;
            const datapointSize = 32; // Corrected datapoint size according to server code
            const numberOfDataPoints = arrayBuffer.byteLength / datapointSize;

            let batchData = {
                timestamps: [],
                channel1Values: [],
                channel2Values: [],
                channel3Values: [],
                channel4Values: [],
                channel5Values: [],
                dataPointIDs: []
            };

            for (let i = 0; i < numberOfDataPoints; i++) {
                const offset = i * datapointSize;
                const view = new DataView(arrayBuffer, offset, datapointSize);

                batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds
                // Correctly reading each channel value which takes up 4 bytes
                batchData.channel1Values.push(view.getUint32(8));
                batchData.channel2Values.push(view.getUint32(12));
                batchData.channel3Values.push(view.getUint32(16));
                batchData.channel4Values.push(view.getUint32(20));
                batchData.channel5Values.push(view.getUint32(24));
                // Correctly reading the dataPointID which takes up the last 4 bytes of the 32-byte data point
                batchData.dataPointIDs.push(view.getUint32(28));
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





















