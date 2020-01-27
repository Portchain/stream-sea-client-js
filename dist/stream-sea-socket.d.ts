/// <reference types="node" />
import { EventEmitter } from "events";
export interface IStreamSeaSocket extends EventEmitter {
    send: (m: any) => void;
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
    constructor(url: string);
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private onWsError;
    send: (message: string) => void;
}
