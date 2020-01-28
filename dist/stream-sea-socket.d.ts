/// <reference types="node" />
import { EventEmitter } from "events";
export interface IStreamSeaSocket extends EventEmitter {
    send: (m: any) => void;
}
interface StreamSeaSocketOptions {
    url: string;
}
/**
 * A StreamSeaSocket encapsulates a WebSocket with automatic ping-pong.
 *
 * Events:
 *   open
 *   message
 *   close
 *   error
 *
 * Public methods:
 *   send(message: string)
 */
export declare class StreamSeaSocket extends EventEmitter implements IStreamSeaSocket {
    private ws;
    private heartbeatInterval?;
    private options;
    constructor(options: StreamSeaSocketOptions);
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private onWsError;
    send: (message: string) => void;
}
export interface IStreamSeaSocketFactory {
    createSocket: (options: StreamSeaSocketOptions) => IStreamSeaSocket;
}
export interface StreamSeaSocketFactoryOptions {
}
export declare class StreamSeaSocketFactory implements IStreamSeaSocketFactory {
    private options;
    constructor(options: StreamSeaSocketFactoryOptions);
    createSocket: (options: StreamSeaSocketOptions) => StreamSeaSocket;
}
export {};
