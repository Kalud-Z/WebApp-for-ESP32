import { dataEmitter } from './websocketModule.js';
import setupCharting from './chartingModule.js';

dataEmitter.on('configuration', (numberOfChannel) => {
    console.log(`Received configuration: numberOfChannel is ${numberOfChannel}`);
    setupCharting(dataEmitter);
});
