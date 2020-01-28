"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_client_1 = require("../stream-sea-client");
const stream_sea_subscription_1 = require("../stream-sea-subscription");
class GoodConnection extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.addSubscription = () => { return; };
    }
}
class UnconnectableConnection extends events_1.EventEmitter {
    constructor() {
        super();
        this.addSubscription = () => { return; };
        setTimeout(() => {
            this.emit('error', 'Could not connect');
            this.emit('close');
        });
    }
}
/**
 * Factory that creates good connections
 */
class GoodConnectionFactory {
    constructor() {
        this.tries = 0;
        this.createConnection = () => {
            this.tries++;
            if (this.tries === 1) {
                return new GoodConnection();
            }
            else {
                throw Error('Expected 1 try only');
            }
        };
    }
}
/**
 * Factory that creates two bad connections followed by a good connection
 */
class ThirdTimeLuckyConnectionFactory {
    constructor() {
        this.tries = 0;
        this.createConnection = () => {
            this.tries++;
            if (this.tries < 3) {
                return new UnconnectableConnection();
            }
            else if (this.tries === 3) {
                return new GoodConnection();
            }
            else {
                throw Error('Expected 3 tries only');
            }
        };
    }
}
describe('StreamSeaClient', () => {
    it('subscription is passed through to the connection', done => {
        const connectionFactory = new GoodConnectionFactory();
        const client = new stream_sea_client_1.StreamSeaClient({
            appId: 'mockId',
            appSecret: 'mockSecret',
            remoteServerHost: 'mockHost',
            remoteServerPort: '101',
            secure: false,
            connectionFactory,
        });
        const testSubscription = new stream_sea_subscription_1.StreamSeaSubscription('testStream');
        client.connection.addSubscription = (s) => {
            // Verify that testSubscription was added to the connection
            expect(s).toBe(testSubscription);
            done();
        };
        client.addSubscription(testSubscription);
        setTimeout(() => {
            expect(connectionFactory.tries).toBe(1);
            done();
        }, 1000);
    });
    it('client reconnects on the third attempt if the first two attempts fail', done => {
        const connectionFactory = new ThirdTimeLuckyConnectionFactory();
        const client = new stream_sea_client_1.StreamSeaClient({
            appId: 'mockId',
            appSecret: 'mockSecret',
            remoteServerHost: 'mockHost',
            remoteServerPort: '101',
            secure: false,
            connectionFactory,
        });
        client.RECONNECT_INTERVAL_MS = 1;
        setTimeout(() => {
            expect(connectionFactory.tries).toBe(3);
            done();
        }, 1000);
    });
});
