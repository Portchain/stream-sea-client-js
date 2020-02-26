"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let LOGGER_ENABLED = process.env.NODE_ENV != 'test';
exports.debug = (...args) => { if (LOGGER_ENABLED)
    console.debug(...args); };
exports.info = (...args) => { if (LOGGER_ENABLED)
    console.info(...args); };
exports.warn = (...args) => { if (LOGGER_ENABLED)
    console.warn(...args); };
exports.error = (...args) => { if (LOGGER_ENABLED)
    console.error(...args); };
