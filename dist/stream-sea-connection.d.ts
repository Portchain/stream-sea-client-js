/// <reference types="node" />
import { EventEmitter } from 'events';
import { IStreamSeaSubscription } from './stream-sea-subscription';
import { IStreamSeaSocketFactory } from './stream-sea-socket';
export interface IStreamSeaConnection extends EventEmitter {
    addSubscription: (subscription: IStreamSeaSubscription) => void;
}
export interface StreamSeaConnectionOptions {
    url: string;
    appId: string;
    appSecret: string;
    fanout: boolean;
}
export declare enum StreamSeaConnectionStatus {
    init = "init",
    open = "open",
    closed = "closed"
}
declare type AuthenticationError = {
    type: 'AuthenticationError';
    error: any;
};
declare type ProtocolError = {
    type: 'ProtocolError';
    error: any;
};
declare type SocketError = {
    type: 'SocketError';
    error: any;
};
export declare type StreamSeaConnectionError = AuthenticationError;
export declare type StreamSeaConnectionWarning = ProtocolError | SocketError;
/**
 * A StreamSeaConnection gives a higher-level interface on top of StreamSeaSocket, taking
 * care of authentication and subscription messages
 *
 * Events:
 *   message
 *   open - a connection was established and authentication succeeded
 *   close - the underlying websocket has closed
 *   error - a non-recoverable error has occurred. The connection needs to be terminated
 *   warning - a recoverable error has occurred
 *
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
export declare class StreamSeaConnection extends EventEmitter implements IStreamSeaConnection {
    private msgCnt;
    status: StreamSeaConnectionStatus;
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
    private sendAndExpectSingleReply;
    /**
     * Send a message expecting multiple replies
     */
    private sendAndExpectMultiReply;
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
export {};
