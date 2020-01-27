/// <reference types="node" />
import { EventEmitter } from "events";
import { StreamSeaSubscription } from "./stream-sea-subscription";
export interface IStreamSeaConnectionFactory {
    createConnection: (options: StreamSeaConnectionOptions) => IStreamSeaConnection;
}
export interface StreamSeaConnectionFactoryOptions {
}
export declare class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
    private options;
    constructor(options: StreamSeaConnectionFactoryOptions);
    createConnection: (options: StreamSeaConnectionOptions) => StreamSeaConnection;
}
export interface IStreamSeaConnection extends EventEmitter {
    addSubscription: (subscription: StreamSeaSubscription) => void;
}
export interface StreamSeaConnectionOptions {
    url: string;
    appId: string;
    appSecret: string;
}
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
export declare class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
    private msgCnt;
    private status;
    private subscriptionsQueue;
    private callbacksMap;
    private sss;
    private options;
    constructor(options: StreamSeaConnectionOptions);
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private onWsError;
    private generateNextMessageId;
    addSubscription: (subscription: StreamSeaSubscription) => void;
    private checkSubscriptionsQueue;
    /**
     * Send a message expecting a single reply
     */
    private sendSingleReply;
    /**
     * Send a message expecting multiple replies
     */
    private sendMultiReply;
}
