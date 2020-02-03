"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const PING_INTERVAL_MS = 15000; // Interval for ping messages in milliseconds
/**
 * A StreamSeaSocket encapsulates a WebSocket with automatic ping-pong.
 *
 * Events:
 *   open
 *   message
 *   close
 *   error
 *
 * Public methods:
 *   send(message: string)
 */
class StreamSeaSocket extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.onWsOpen = () => {
            this.heartbeatInterval = setInterval(() => {
                this.ws.ping(() => {
                    return;
                });
            }, PING_INTERVAL_MS);
            this.emit('open');
        };
        this.onWsMessage = (m) => {
            // console.log('StreamSeaSocket.onWsMessage:', JSON.stringify(m, null, 4))
            this.emit('message', m);
        };
        this.onWsClose = () => {
            // console.log('StreamSeaSocket.onWsClose')
            this.emit('close');
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                delete this.heartbeatInterval;
            }
        };
        this.onWsError = (e) => {
            this.emit('error', e);
        };
        this.send = (message) => {
            // console.log('StreamSeaSocket.send', JSON.stringify(message, null, 4))
            this.ws.send(message);
        };
        this.options = options;
        this.ws = new ws_1.default(this.options.url);
        this.ws.on('open', this.onWsOpen);
        this.ws.on('message', this.onWsMessage);
        this.ws.on('close', this.onWsClose);
        this.ws.on('error', this.onWsError);
    }
}
exports.StreamSeaSocket = StreamSeaSocket;
class StreamSeaSocketFactory {
    constructor(options) {
        this.createSocket = (options) => {
            return new StreamSeaSocket(options);
        };
        this.options = options;
    }
}
exports.StreamSeaSocketFactory = StreamSeaSocketFactory;
