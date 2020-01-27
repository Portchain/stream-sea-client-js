"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_socket_1 = require("./stream-sea-socket");
const logger = require('logacious')();
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
/**
 * A StreamSeaConnection gives a higher-level interface on top of StreamSeaSocket, taking
 * care of authentication and subscription messages
 *
 * Events:
 *   open
 *   message
 *   close
 *   error
 *
 * Public methods:
 *   addSubscription(subscription: StreamSeaSubscription) => void
 */
class StreamSeaConnection extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.msgCnt = 0;
        this.status = StreamSeaConnectionStatus.init;
        // Queue of subscribe requests that have not yet been sent to the server
        this.subscriptionsQueue = [];
        this.callbacksMap = new Map();
        this.onWsOpen = () => {
            this.sendSingleReply('authenticate', {
                username: this.options.appId,
                password: this.options.appSecret,
            })
                .then(() => {
                this.status = StreamSeaConnectionStatus.open;
                this.checkSubscriptionsQueue();
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
                    return;
                }
                if (!this.callbacksMap.has(msg.id)) {
                    const errMessage = `Server sent a response but the message id could not be resolved to a request. Message: ${JSON.stringify(msg)}`;
                    logger.error(errMessage);
                    this.emit('error', errMessage);
                    return;
                }
                const callbackRecord = this.callbacksMap.get(msg.id);
                if (callbackRecord.type === 'SingleReply') {
                    const promiseProxy = callbackRecord.callback;
                    if (msg.success) {
                        promiseProxy.resolve(msg.payload);
                    }
                    else {
                        promiseProxy.reject(msg.error);
                    }
                    this.callbacksMap.delete(msg.id);
                }
                else if (callbackRecord.type === 'MultiReply') {
                    if (!callbackRecord.receivedReply) {
                        callbackRecord.receivedReply = true;
                        const promiseProxy = callbackRecord.firstReplyCallback;
                        if (msg.success) {
                            promiseProxy.resolve(msg.payload);
                        }
                        else {
                            promiseProxy.reject(msg.error);
                        }
                    }
                    else {
                        const promiseProxy = callbackRecord.otherRepliesCallback;
                        promiseProxy.resolve(msg.payload);
                    }
                }
                else {
                    throw new Error('Not implemented');
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
            this.subscriptionsQueue.push(subscription);
            this.checkSubscriptionsQueue();
        };
        this.options = options;
        this.sss = new stream_sea_socket_1.StreamSeaSocket(options.url); // TODO: use factory method
        this.sss.on('open', this.onWsOpen);
        this.sss.on('message', this.onWsMessage);
        this.sss.on('close', this.onWsClose);
        this.sss.on('error', this.onWsError);
    }
    generateNextMessageId() {
        return ++this.msgCnt;
    }
    checkSubscriptionsQueue() {
        if (this.status === StreamSeaConnectionStatus.open) {
            for (const subscription = this.subscriptionsQueue.shift(); subscription;) {
                this.sendMultiReply('subscribe', subscription.streamName, {
                    resolve: (m) => { return; },
                    reject: (e) => this.onWsError(e),
                }, {
                    resolve: (m) => subscription.emit('message', m),
                    reject: (e) => this.onWsError(e),
                });
            }
        }
    }
    /**
     * Send a message expecting a single reply
     */
    async sendSingleReply(action, payload) {
        const msgId = this.generateNextMessageId();
        this.sss.send(JSON.stringify({
            id: msgId,
            action,
            payload,
        }));
        return new Promise((resolve, reject) => {
            this.callbacksMap.set(msgId, {
                type: 'SingleReply',
                callback: {
                    resolve,
                    reject,
                },
            });
        });
    }
    /**
     * Send a message expecting multiple replies
     */
    sendMultiReply(action, payload, firstReplyCallback, otherRepliesCallback) {
        const msgId = this.generateNextMessageId();
        this.sss.send(JSON.stringify({
            id: msgId,
            action,
            payload,
        }));
        this.callbacksMap.set(msgId, {
            type: 'MultiReply',
            firstReplyCallback,
            otherRepliesCallback,
            receivedReply: false,
        });
    }
}
exports.StreamSeaConnection = StreamSeaConnection;
