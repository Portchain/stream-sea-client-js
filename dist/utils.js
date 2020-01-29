"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHttpURLScheme = (secure) => (secure ? 'https' : 'http');
exports.getWsURLScheme = (secure) => (secure ? 'wss' : 'ws');
