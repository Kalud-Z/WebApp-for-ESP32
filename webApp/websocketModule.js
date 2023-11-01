import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

const ws = new WebSocket('ws://localhost:8999');

ws.binaryType = 'arraybuffer';

ws.onopen = function (event) {
    console.log('WebSocket connection established');
};

ws.onmessage = function (event) {
    const arrayBuffer = event.data;
    const view = new DataView(arrayBuffer);
    const timestampNs = view.getBigUint64(0);
    const rd = view.getUint32(8);
    const ird = view.getUint32(12);

    // Emit an event with the data
    dataEmitter.emit('data', { timestampNs, rd, ird });
};

ws.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};

ws.onclose = function (event) {
    console.log('WebSocket connection closed');
};

