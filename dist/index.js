"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const stream_sea_client_1 = require("./stream-sea-client");
const stream_sea_subscription_1 = require("./stream-sea-subscription");
const utils_1 = require("./utils");
exports.subscribe = async (args) => {
    const client = stream_sea_client_1.getStreamSeaClient(args);
    const subscription = new stream_sea_subscription_1.StreamSeaSubscription(args.stream);
    client.addSubscription(subscription);
    return subscription;
};
exports.publish = async (args) => {
    return await request_promise_native_1.default({
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/publish`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { payload: args.payload },
    });
};
exports.defineStream = async (args) => {
    return await request_promise_native_1.default({
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/define`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { version: args.version, fields: args.fields },
    });
};
exports.describeStream = async (args) => {
    const a = {
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/schema`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'GET',
        gzip: true,
        json: true,
    };
    return await request_promise_native_1.default(a);
};
exports.createClient = async (args) => {
    return await request_promise_native_1.default({
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'POST',
        gzip: true,
        json: true,
        body: { description: args.description },
    });
};
exports.deleteClient = async (args) => {
    return await request_promise_native_1.default({
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'DELETE',
        gzip: true,
        json: true,
    });
};
exports.rotateClientSecret = async (args) => {
    return await request_promise_native_1.default({
        url: `${utils_1.getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
        headers: {
            'content-type': 'application/json',
            authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
        },
        method: 'PUT',
        gzip: true,
        json: true,
    });
};
