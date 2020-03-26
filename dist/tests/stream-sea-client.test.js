"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_client_1 = require("../stream-sea-client");
const stream_sea_subscription_1 = require("../stream-sea-subscription");
class GoodConnection extends events_1.EventEmitter {
    constructor(addSubscription) {
        super();
        this.close = () => undefined;
        this.addSubscription = addSubscription;
    }
}
class UnconnectableConnection extends events_1.EventEmitter {
    constructor(addSubscription) {
        super();
        this.close = () => undefined;
        this.addSubscription = addSubscription;
        setTimeout(() => {
            this.emit('warning', 'Could not connect');
            this.emit('close');
        });
    }
}
/**
 * Factory that creates good connections
 */
class GoodConnectionFactory {
    constructor(addSubscription) {
        this.tries = 0;
        this.createConnection = () => {
            this.tries++;
            if (this.tries === 1) {
                return new GoodConnection(this.addSubscription);
            }
            else {
                throw Error('Expected 1 try only');
            }
        };
        this.addSubscription = addSubscription;
    }
}
/**
 * Factory that creates two bad connections followed by a good connection
 */
class ThirdTimeLuckyConnectionFactory {
    constructor(addSubscription) {
        this.tries = 0;
        this.createConnection = () => {
            this.tries++;
            if (this.tries < 3) {
                return new UnconnectableConnection(this.addSubscription);
            }
            else if (this.tries === 3) {
                return new GoodConnection(this.addSubscription);
            }
            else {
                throw Error('Expected 3 tries only');
            }
        };
        this.addSubscription = addSubscription;
    }
}
describe('StreamSeaClient', () => {
    it('subscription is passed through to the connection', done => {
        const mockAddSubscription = jest.fn();
        const connectionFactory = new GoodConnectionFactory(mockAddSubscription);
        const client = new stream_sea_client_1.StreamSeaClient({
            credentialOptions: {
                type: 'basic',
                clientId: 'mockId',
                clientSecret: 'mockSecret',
            },
            remoteServerHost: 'mockHost',
            remoteServerPort: '101',
            secure: false,
            connectionFactory,
        });
        const testSubscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        client.addSubscription(testSubscription);
        setTimeout(() => {
            // Verify that a connection was created
            expect(connectionFactory.tries).toBe(1);
            // Verify that the subscription was added to the connection
            expect(mockAddSubscription.mock.calls.length).toBe(1);
            expect(mockAddSubscription.mock.calls[0][0]).toBe(testSubscription);
            done();
        }, 1000);
    });
    it('client reconnects on the third attempt if the first two attempts fail', done => {
        const mockAddSubscription = jest.fn();
        const connectionFactory = new ThirdTimeLuckyConnectionFactory(mockAddSubscription);
        const client = new stream_sea_client_1.StreamSeaClient({
            credentialOptions: {
                type: 'basic',
                clientId: 'mockId',
                clientSecret: 'mockSecret',
            },
            remoteServerHost: 'mockHost',
            remoteServerPort: '101',
            secure: false,
            connectionFactory,
        });
        const testSubscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        client.RECONNECT_INTERVAL_MS = 1;
        client.addSubscription(testSubscription);
        setTimeout(() => {
            // Verify that 3 connections were created
            expect(connectionFactory.tries).toBe(3);
            // Verify that the subscription was added to each of the 3 connections
            expect(mockAddSubscription.mock.calls.length).toBe(3);
            expect(mockAddSubscription.mock.calls.map(c => c[0] === testSubscription)).toEqual([true, true, true]);
            done();
        }, 1000);
    });
});
