import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

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
        if (numberOfChannels === 5) {
            const arrayBuffer = event.data;
            const datapointSize = 32; // Each datapoint is 32 bytes for 5 channels
            const numberOfDataPoints = arrayBuffer.byteLength/datapointSize;

            let batchData = {
                timestamps: [],
                channelValues: Array.from({ length: 5 }, () => []), // Create 5 arrays for the 5 channels
                dataPointIDs: []
            };

            for (let i = 0; i < numberOfDataPoints; i++) {
                const offset = i * datapointSize;
                const view = new DataView(arrayBuffer, offset, datapointSize);

                batchData.timestamps.push(Number(view.getBigUint64(0)) / 1e9); // Convert to seconds
                // Retrieve and store data for each channel
                for (let j = 0; j < 5; j++) {
                    batchData.channelValues[j].push(view.getUint32(8 + (j * 4)));
                }
                batchData.dataPointIDs.push(view.getUint32(28));
            }

            // console.log('Batch data for 5 channels: ', batchData);
            dataEmitter.emit('dataBatch', batchData);
        }

        // Handling binary data for two channels, now with batches of 10 datapoints
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

            console.log('this is batchData : ', batchData);
            console.log('################################')
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






















