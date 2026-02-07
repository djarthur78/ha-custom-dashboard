/**
 * Logger Utility
 * Log levels: debug, info, warn, error
 * In production (import.meta.env.PROD), only warn and error are output.
 * In development, all levels are output.
 */

const isDev = import.meta.env.DEV;

function createLogger(prefix) {
  return {
    debug(...args) {
      if (isDev) console.log(`[${prefix}]`, ...args);
    },
    info(...args) {
      if (isDev) console.log(`[${prefix}]`, ...args);
    },
    warn(...args) {
      console.warn(`[${prefix}]`, ...args);
    },
    error(...args) {
      console.error(`[${prefix}]`, ...args);
    },
  };
}

export default createLogger;
