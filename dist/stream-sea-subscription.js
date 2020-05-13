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
    constructor(opts) {
        super();
        this.handleMessageOrBatch = (messageOrBatch) => {
            if (this.debatch && Array.isArray(messageOrBatch)) {
                // Debatch
                messageOrBatch.forEach(message => {
                    this.emit('message', message);
                });
            }
            else {
                // Don't debatch
                this.emit('message', messageOrBatch);
            }
        };
        this.streamName = opts.streamName;
        this.debatch = opts.debatch === false ? false : true; // defaults to true
    }
}
exports.StreamSeaSubscription = StreamSeaSubscription;
