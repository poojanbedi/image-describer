function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  log: (...args) => console.log(`[${timestamp()}]`, ...args),
  info: (...args) => console.info(`[${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}]`, ...args),
  error: (...args) => console.error(`[${timestamp()}]`, ...args),
  debug: (...args) => console.debug(`[${timestamp()}]`, ...args),
};

export const log = logger.log;
export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;
export const debug = logger.debug;
