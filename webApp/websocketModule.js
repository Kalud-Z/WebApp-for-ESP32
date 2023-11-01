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
            const view = new DataView(arrayBuffer);
            const timestampNs = view.getBigUint64(0);
            const ch1 = view.getUint32(8);
            const ch2 = view.getUint32(12);
            const ch3 = view.getUint32(16);
            const ch4 = view.getUint32(20);
            const ch5 = view.getUint32(24);
            // console.log(`Timestamp: ${timestampNs}ns, ch1: ${ch1}, ch2: ${ch2}, ch3: ${ch3}, ch4: ${ch4}, ch5: ${ch5}`);
            dataEmitter.emit('data', {timestampNs, ch1, ch2, ch3, ch4, ch5});
        }

        // Handling binary data for two channels, now with batches of 10 datapoints
        if (numberOfChannels === 2) {
            const arrayBuffer = event.data;
            const datapointSize = 20; // Each datapoint is 20 bytes
            const numberOfDataPoints = arrayBuffer.byteLength / datapointSize;

            if (numberOfChannels === 2) {
                const arrayBuffer = event.data;
                const datapointSize = 20; // Each datapoint is 20 bytes
                const numberOfDataPoints = arrayBuffer.byteLength / datapointSize;

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
    }

    ws.onerror = function (error) {
        console.error('WebSocket Error: ', error);
    };

    ws.onclose = function (event) {
        console.log('WebSocket connection closed');
    };
}
