import { dataEmitter } from './websocketModule.js';
import setupCharting from './chartingModule.js';

setupCharting(dataEmitter);
