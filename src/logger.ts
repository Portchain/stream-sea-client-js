let LOGGER_ENABLED = process.env.NODE_ENV != 'test'

export const debug = (...args: any[]) => {if (LOGGER_ENABLED) console.debug(...args)}
export const info = (...args: any[]) => {if (LOGGER_ENABLED) console.info(...args)}
export const warn = (...args: any[]) => {if (LOGGER_ENABLED) console.warn(...args)}
export const error = (...args: any[]) => {if (LOGGER_ENABLED) console.error(...args)}