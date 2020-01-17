"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const events_1 = require("events");
const logger = require('logacious')();
const WebSocket = require('ws');
class WSClient extends events_1.EventEmitter {
    constructor(args, readyCb) {
        super();
        this.msgCnt = 0;
        this.messagesCallbacks = new Map();
        this.subscriptions = new Map();
        const url = `${getWsURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams`;
        this.readyCb = readyCb;
        this.ws = new WebSocket(url);
        this.ws.on('open', async () => {
            console.log('Connected to server');
            await this.authenticate(args.appId, args.appSecret);
        });
        this.ws.on('message', (msgStr) => {
            // TODO: catch parse error
            try {
                const msg = JSON.parse(msgStr);
                if (!msg.id) {
                    const errMessage = `Server sends a message without an id ${JSON.stringify(msg)}`;
                    logger.error(errMessage);
                    this.emit('error', errMessage);
                }
                else {
                    if (this.messagesCallbacks.has(msg.id) && this.messagesCallbacks.get(msg.id) === null) {
                        if (msg.action === 'subscription') {
                            // logger.debug('Subscription related message')
                            const eventEmitter = this.subscriptions.get(msg.id);
                            if (eventEmitter) {
                                // logger.debug('Emitting message related to subscription', msg.id)
                                eventEmitter.emit('message', msg.payload);
                            }
                            else {
                                const errMessage = `Could not resolve subscription related event to an existing subscription ${JSON.stringify(msg)}`;
                                logger.error(errMessage);
                                this.emit('error', errMessage);
                            }
                        }
                        else {
                            const errMessage = `Server sent multiple response for a request that has already been processed. Message: ${JSON.stringify(msg)}`;
                            logger.error(errMessage);
                            this.emit('error', errMessage);
                        }
                    }
                    else if (this.messagesCallbacks.get(msg.id)) {
                        const promiseProxy = this.messagesCallbacks.get(msg.id);
                        if (msg.success) {
                            promiseProxy.resolve(msg.payload);
                        }
                        else {
                            promiseProxy.reject(msg.error);
                        }
                        this.messagesCallbacks.set(msg.id, null);
                    }
                    else {
                        const errMessage = `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`;
                        logger.error(errMessage);
                        this.emit('error', errMessage);
                    }
                }
            }
            catch (err) {
                logger.error(err);
                this.emit('error', err);
            }
        });
    }
    generateNextMessageId() {
        return ++this.msgCnt;
    }
    async send(action, payload) {
        // TODO: add message timeouts
        return new Promise((resolve, reject) => {
            const msgId = this.generateNextMessageId();
            this.messagesCallbacks.set(msgId, {
                resolve,
                reject,
            });
            this.ws.send(JSON.stringify({
                id: msgId,
                action,
                payload,
            }));
        });
    }
    async authenticate(username, password) {
        const response = await this.send('authenticate', {
            username,
            password,
        });
        if (response && response.jailId) {
            console.info('Authentication succeeded');
            if (this.readyCb) {
                const readyCb = this.readyCb;
                delete this.readyCb;
                readyCb();
            }
        }
        else {
            console.error('Authentication failed');
        }
    }
    async subscribe(streamName) {
        logger.info(`Subscribing to stream ${streamName}`);
        const eventEmitter = new events_1.EventEmitter();
        const subscriptionKey = await this.send('subscribe', streamName);
        if (subscriptionKey) {
            this.subscriptions.set(subscriptionKey, eventEmitter);
            return eventEmitter;
        }
        else {
            throw new Error('Failed to subscribe');
        }
    }
}
exports.subscribe = async (args) => {
    const eventEmitter = new events_1.EventEmitter();
    let client = new WSClient(args, async () => {
        //TODO: return th right event emitter instead of manually piping 2 event emitters
        const ee = await client.subscribe(args.stream);
        ee.on('message', d => eventEmitter.emit('message', d));
        ee.on('error', d => eventEmitter.emit('error', d));
        ee.on('close', d => eventEmitter.emit('close', d));
    });
    return eventEmitter;
};
const getHttpURLScheme = (secure) => (secure ? 'https' : 'http');
const getWsURLScheme = (secure) => (secure ? 'wss' : 'ws');
exports.publish = async (args) => {
    return await request_promise_native_1.default({
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/publish`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { payload: args.payload },
    });
};
exports.defineStream = async (args) => {
    return await request_promise_native_1.default({
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/define`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { version: args.version, fields: args.fields },
    });
};
exports.describeStream = async (args) => {
    const a = {
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/schema`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'GET',
        gzip: true,
        json: true,
    };
    return await request_promise_native_1.default(a);
};
exports.createClient = async (args) => {
    return await request_promise_native_1.default({
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { description: args.description },
    });
};
exports.deleteClient = async (args) => {
    return await request_promise_native_1.default({
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'DELETE',
        gzip: true,
        json: true,
    });
};
exports.rotateClientSecret = async (args) => {
    return await request_promise_native_1.default({
        url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.appId}:${args.appSecret}`).toString('base64'),
        },
        method: 'PUT',
        gzip: true,
        json: true,
    });
};
