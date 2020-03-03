import { Stream, Remote, SchemaDefinition } from './types';
import { StreamSeaSubscription } from './stream-sea-subscription';
export declare const subscribe: (args: Remote & Stream & {
    appSecret: string;
    fanout?: boolean | undefined;
}) => Promise<StreamSeaSubscription>;
export declare const subscribeWithJwt: (args: Remote & Stream & {
    jwt: string;
    fanout?: boolean | undefined;
}) => Promise<StreamSeaSubscription>;
export declare const publish: (args: Remote & Stream & {
    appSecret: string;
    payload: any;
}) => Promise<any>;
export declare const defineStream: (args: Remote & Stream & {
    appSecret: string;
} & SchemaDefinition) => Promise<any>;
export declare const describeStream: (args: Remote & Stream & {
    appSecret: string;
} & SchemaDefinition) => Promise<any>;
export declare const createClient: (args: Remote & {
    appSecret: string;
    description: string;
}) => Promise<any>;
export declare const deleteClient: (args: Remote & {
    appSecret: string;
    clientId: string;
}) => Promise<any>;
export declare const rotateClientSecret: (args: Remote & {
    appSecret: string;
    clientId: string;
}) => Promise<any>;
