"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class StreamSeaConnectionFactory {
    constructor(options) {
        this.createConnection = () => {
            return new StreamSeaConnection({});
        };
        this.options = options;
    }
}
exports.StreamSeaConnectionFactory = StreamSeaConnectionFactory;
class StreamSeaConnection extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.subscriptions = [];
        this.addSubscription = (subscription) => {
            this.subscriptions.push({ isReady: false, subscription });
        };
    }
}
exports.StreamSeaConnection = StreamSeaConnection;
