/// <reference types="node" />
import { EventEmitter } from "events";
export declare class StreamSeaSubscription extends EventEmitter {
    streamName: string;
    constructor(streamName: string);
}
