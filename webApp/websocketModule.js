import { EventEmitter } from './event-emitter.js';
class WebSocketEmitter extends EventEmitter {}

export const dataEmitter = new WebSocketEmitter();

const ws = new WebSocket('ws://localhost:8999');

export let numberOfChannels;

ws.binaryType = 'arraybuffer';

ws.onopen = function (event) {
    console.log('WebSocket connection established');
};

ws.onmessage = function (event) {
    if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'configuration') {
            numberOfChannels = message.channels;
            dataEmitter.emit('configuration', numberOfChannels);
        }
    }
    else {
        if(numberOfChannels === 5) {
            const arrayBuffer = event.data;
            const view = new DataView(arrayBuffer);
            const timestampNs = view.getBigUint64(0);
            const ch1 = view.getUint32(8);
            const ch2 = view.getUint32(12);
            const ch3 = view.getUint32(16);
            const ch4 = view.getUint32(20);
            const ch5 = view.getUint32(24);
            // console.log(`Timestamp: ${timestampNs}ns, ch1: ${ch1}, ch2: ${ch2}, ch3: ${ch3}, ch4: ${ch4}, ch5: ${ch5}`);
            dataEmitter.emit('data', { timestampNs, ch1, ch2, ch3, ch4, ch5 });
        }
        if(numberOfChannels === 2) {
            const arrayBuffer = event.data;
            const view = new DataView(arrayBuffer);
            const timestampNs = view.getBigUint64(0);
            const rd = view.getUint32(8);
            const ird = view.getUint32(12);
            dataEmitter.emit('data', { timestampNs, rd, ird });
        }
    }
};

ws.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};

ws.onclose = function (event) {
    console.log('WebSocket connection closed');
};

