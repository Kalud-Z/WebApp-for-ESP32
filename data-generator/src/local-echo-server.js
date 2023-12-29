const WebSocket = require('ws');


const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('Client connected');
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        ws.send(message);  // Echo the received message back
    });
});

console.log('WebSocket server started on ws://localhost:8080');
