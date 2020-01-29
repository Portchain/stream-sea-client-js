"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_sea_connection_1 = require("../stream-sea-connection");
const events_1 = require("events");
const assert = __importStar(require("assert"));
const stream_sea_subscription_1 = require("../stream-sea-subscription");
class BasicSocket extends events_1.EventEmitter {
    constructor() {
        super();
        this.sendCallbacks = [
            m => {
                expect(m.action).toBe('authenticate');
                if (m.password === 'test_app_secret') {
                    this.emit('message', JSON.stringify({
                        id: m.id,
                        action: 'authenticate',
                        success: true,
                        payload: {
                            jailId: 'some_jail',
                        },
                    }));
                }
                else {
                    this.emit('message', JSON.stringify({
                        id: m.id,
                        action: 'authenticate',
                        success: false,
                        error: {
                            message: 'Invalid credentials',
                        },
                    }));
                }
            },
            m => {
                expect(m.action).toBe('subscribe');
                this.subscriptionKey = m.id;
                this.emit('message', JSON.stringify({
                    id: m.id,
                    action: 'subscription',
                    success: true,
                    payload: m.id,
                }));
            },
        ];
        this.send = (m) => {
            const fn = this.sendCallbacks.shift();
            assert.ok(fn);
            setTimeout(() => fn(JSON.parse(m)));
        };
        setTimeout(() => this.emit('open'));
    }
    emitSubscriptionMessage() {
        assert.ok(this.subscriptionKey);
        this.emit('message', JSON.stringify({
            id: this.subscriptionKey,
            action: 'subscription',
            streamName: 'testStream',
            payload: {
                foo: 'bar',
            },
        }));
    }
}
class BasicSocketFactory {
    constructor() {
        this.sockets = [];
        this.createSocket = () => {
            const socket = new BasicSocket();
            this.sockets.push(socket);
            return socket;
        };
    }
}
describe('StreamSeaConnection', () => {
    it('basic flow', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            appId: 'test_app_id',
            appSecret: 'test_app_secret',
            socketFactory,
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify that all send callbacks have been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(0);
            // Verify that the connection is open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.open);
            // Verify that messages on the socket are forwarded to the subscription
            subscription.on('message', m => {
                expect(m.foo).toBe('bar');
                done();
            });
            socketFactory.sockets[0].emitSubscriptionMessage();
        }, 1000);
    });
    it('bad credentials', done => {
        const socketFactory = new BasicSocketFactory();
        const connection = new stream_sea_connection_1.StreamSeaConnection({
            url: 'test_url',
            appId: 'test_app_id',
            appSecret: 'test_app_secret',
            socketFactory,
        });
        const subscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        connection.addSubscription(subscription);
        // Verify the correct error is thrown
        const errorHandler = jest.fn((e) => expect(e.type).toBe('AuthenticationError'));
        connection.on('error', errorHandler);
        setTimeout(() => {
            // Verify a socket was created
            expect(socketFactory.sockets.length).toBe(1);
            // Verify that only the first send callback has been called
            expect(socketFactory.sockets[0].sendCallbacks.length).toBe(1);
            // Verify that the connection is not open
            expect(connection.status).toBe(stream_sea_connection_1.StreamSeaConnectionStatus.init);
            // Verify that the error handler was called
            expect(errorHandler.mock.calls.length).toBe(1);
            done();
        }, 1000);
    });
});
