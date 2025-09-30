/**
 * Production-safe logger utility
 * Disables console.log in production while keeping errors and warnings
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';

export const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    warn: (...args) => {
        console.warn(...args); // Always show warnings
    },
    error: (...args) => {
        console.error(...args); // Always show errors
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};

export default logger;