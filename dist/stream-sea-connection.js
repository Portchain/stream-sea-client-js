"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
const logger = require('logacious')();
// States:
//   init
//   authenticating
//   open
//   closed
// Events:
//   close
//   error
// Public methods:
//   addSubscription(streamName: string): IStreamSeaSubscription
const PING_INTERVAL_MS = 15000; // Interval for ping messages in milliseconds
class StreamSeaConnectionFactory {
    constructor(options) {
        this.createConnection = (options) => {
            return new StreamSeaConnection(options);
        };
        this.options = options;
    }
}
exports.StreamSeaConnectionFactory = StreamSeaConnectionFactory;
var StreamSeaConnectionStatus;
(function (StreamSeaConnectionStatus) {
    StreamSeaConnectionStatus["init"] = "init";
    StreamSeaConnectionStatus["open"] = "open";
    StreamSeaConnectionStatus["closed"] = "closed";
})(StreamSeaConnectionStatus || (StreamSeaConnectionStatus = {}));
class StreamSeaConnection extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.msgCnt = 0;
        this.status = StreamSeaConnectionStatus.init;
        this.subscriptions = [];
        this.messagesCallbacks = new Map();
        this.onWsOpen = () => {
            this.ws.heartbeatInterval = setInterval(() => {
                this.ws.ping(() => { return; });
            }, PING_INTERVAL_MS);
            this.send('authenticate', {
                username: this.options.appId,
                password: this.options.appSecret,
            })
                .then(() => {
                this.status = StreamSeaConnectionStatus.open;
            })
                .catch(err => {
                this.emit('error', err);
            });
        };
        this.onWsMessage = (msgStr) => {
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
                            const subscriptionRecord = this.subscriptions.find(s => s.msgId === msg.id);
                            if (subscriptionRecord) {
                                // logger.debug('Emitting message related to subscription', msg.id)
                                subscriptionRecord.subscription.emit('message', msg.payload);
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
        };
        this.onWsClose = () => {
            this.emit('close');
        };
        this.onWsError = (e) => {
            this.emit('error', e);
        };
        this.addSubscription = (subscription) => {
            this.subscriptions.push({ msgId: null, isReady: false, subscription });
        };
        this.options = options;
        this.ws = new ws_1.default(options.url);
        this.ws.on('open', this.onWsOpen);
        this.ws.on('message', this.onWsMessage);
        this.ws.on('close', this.onWsClose);
        this.ws.on('error', this.onWsError);
    }
    generateNextMessageId() {
        return ++this.msgCnt;
    }
    // Must only be called when connection is established
    // private async subscribe(streamName: string) {
    //   logger.info(`Subscribing to stream ${streamName}`)
    //   // const subscriptionKey = await 
    //   this.send('subscribe', streamName)
    //   .then(subscriptionKey => {
    //     const subscriptionRecord = this.subscriptions.find(s => s.subscription.streamName === streamName)
    //     if (!subscriptionKey)
    //     subscriptionRecord.isReady = true
    //   })
    //   if (subscriptionKey) {
    //     this.subscriptions.set(subscriptionKey, eventEmitter)
    //     return eventEmitter
    //   } else {
    //     throw new Error('Failed to subscribe')
    //   }
    // }
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
}
exports.StreamSeaConnection = StreamSeaConnection;
