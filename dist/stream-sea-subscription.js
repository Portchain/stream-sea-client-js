"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
/**
 * A StreamSeaSubscription represents a long-lasting logical subscription.
 * A StreamSeaSubscription may be transferred from one connection to another
 *
 * Events:
 *   message
 */
class StreamSeaSubscription extends events_1.EventEmitter {
    constructor(streamName) {
        super();
        this.streamName = streamName;
    }
}
exports.StreamSeaSubscription = StreamSeaSubscription;
