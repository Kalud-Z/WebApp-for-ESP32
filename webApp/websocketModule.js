import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

const ws = new WebSocket('ws://localhost:8999');

ws.binaryType = 'arraybuffer';

ws.onopen = function (event) {
    console.log('WebSocket connection established');
};

//for 2 channels
// ws.onmessage = function (event) {
//     const arrayBuffer = event.data;
//     const view = new DataView(arrayBuffer);
//     const timestampNs = view.getBigUint64(0);
//     const rd = view.getUint32(8);
//     const ird = view.getUint32(12);
//
//     // Emit an event with the data
//     dataEmitter.emit('data', { timestampNs, rd, ird });
// };


//for 5 channels
ws.onmessage = function (event) {
    const arrayBuffer = event.data;
    const view = new DataView(arrayBuffer);

    // Reading the timestamp, which is at byte 0
    const timestampNs = view.getBigUint64(0);

    // Reading the sensor values, which are 4 bytes each, starting at byte 8
    const ch1 = view.getUint32(8);
    const ch2 = view.getUint32(12);
    const ch3 = view.getUint32(16);
    const ch4 = view.getUint32(20);
    const ch5 = view.getUint32(24);

    console.log(`Timestamp: ${timestampNs}ns, ch1: ${ch1}, ch2: ${ch2}, ch3: ${ch3}, ch4: ${ch4}, ch5: ${ch5}`);

    // Emit an event with the data or handle it as needed
    dataEmitter.emit('data', { timestampNs, ch1, ch2, ch3, ch4, ch5 });
};


ws.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};

ws.onclose = function (event) {
    console.log('WebSocket connection closed');
};

