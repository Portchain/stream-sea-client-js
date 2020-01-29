/// <reference types="node" />
import { EventEmitter } from 'events';
export interface IStreamSeaSubscription extends EventEmitter {
    streamName: string;
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
    constructor(streamName: string);
}
