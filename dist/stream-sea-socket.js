"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require('isomorphic-ws');
const events_1 = require("events");
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
            this.emit('open');
        };
        this.onWsMessage = (m) => {
            // console.log('StreamSeaSocket.onWsMessage:', JSON.stringify(m, null, 4))
            this.emit('message', m);
        };
        this.onWsClose = () => {
            // console.log('StreamSeaSocket.onWsClose')
            this.emit('close');
        };
        this.onWsError = (e) => {
            this.emit('error', e);
        };
        this.send = (message) => {
            // console.log('StreamSeaSocket.send', JSON.stringify(message, null, 4))
            this.ws.send(message);
        };
        this.close = () => {
            this.ws.close();
        };
        this.options = options;
        this.ws = new WebSocket(this.options.url);
        this.ws.onopen = this.onWsOpen;
        this.ws.onmessage = this.onWsMessage;
        this.ws.onclose = this.onWsClose;
        this.ws.onerror = this.onWsError;
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
