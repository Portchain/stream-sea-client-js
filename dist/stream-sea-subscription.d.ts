/// <reference types="node" />
import { EventEmitter } from 'events';
export interface StreamSeaSubscriptionOptions {
    streamName: string;
    debatch?: boolean;
}
export interface IStreamSeaSubscription extends EventEmitter {
    streamName: string;
    handleMessageOrBatch: (messageOrBatch: any) => void;
}
/**
 * A StreamSeaSubscription represents a long-lasting logical subscription.
 * A StreamSeaSubscription may be transferred from one connection to another
 *
 * Events:
 *   message
 */
export declare class StreamSeaSubscription extends EventEmitter implements IStreamSeaSubscription {
    streamName: string;
    private debatch;
    constructor(opts: StreamSeaSubscriptionOptions);
    handleMessageOrBatch: (messageOrBatch: any) => void;
}
