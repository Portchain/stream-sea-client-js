/// <reference types="node" />
import { EventEmitter } from "events";
import { IStreamSeaSubscription } from "./stream-sea-subscription";
import { IStreamSeaSocketFactory } from "./stream-sea-socket";
export interface IStreamSeaConnection extends EventEmitter {
    addSubscription: (subscription: IStreamSeaSubscription) => void;
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
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export declare class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
    private msgCnt;
    private status;
    private subscriptionsQueue;
    private callbacksMap;
    private socket;
    private options;
    constructor(options: StreamSeaConnectionOptions & {
        socketFactory: IStreamSeaSocketFactory;
    });
    private onSocketOpen;
    private onSocketMessage;
    private onSocketClose;
    private onSocketError;
    private generateNextMessageId;
    addSubscription: (subscription: IStreamSeaSubscription) => void;
    /**
     * Send out queued subscriptions if possible
     */
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
export interface IStreamSeaConnectionFactory {
    createConnection: (options: StreamSeaConnectionOptions) => IStreamSeaConnection;
}
export interface StreamSeaConnectionFactoryOptions {
}
export declare class StreamSeaConnectionFactory implements IStreamSeaConnectionFactory {
    private options;
    private socketFactory;
    constructor(options: StreamSeaConnectionFactoryOptions);
    createConnection: (options: StreamSeaConnectionOptions) => StreamSeaConnection;
}
