"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const PING_INTERVAL_MS = 15000; // Interval for ping messages in milliseconds
class StreamSeaSocket extends events_1.EventEmitter {
    constructor(url) {
        super();
        this.onWsOpen = () => {
            this.heartbeatInterval = setInterval(() => {
                this.ws.ping(() => { return; });
            }, PING_INTERVAL_MS);
            this.emit('open');
        };
        this.onWsMessage = (m) => {
            this.emit('message', m);
        };
        this.onWsClose = () => {
            this.emit('close');
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                delete this.heartbeatInterval;
            }
        };
        this.onWsError = (e) => {
            this.emit('error', e);
        };
        this.send = (m) => {
            this.ws.send(m);
        };
        this.ws = new ws_1.default(url);
        this.ws.on('open', this.onWsOpen);
        this.ws.on('message', this.onWsMessage);
        this.ws.on('close', this.onWsClose);
        this.ws.on('error', this.onWsError);
    }
}
exports.StreamSeaSocket = StreamSeaSocket;
