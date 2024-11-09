/* eslint-disable no-console */

/**
 * Generic logger function type.
 */
type LoggerFunction = (...args: any[]) => void;

const priorities = {
  ERROR: 3,
  WARN: 4,
  INFO: 6,
};

const prefix = (type: keyof typeof priorities) =>
  `<${priorities[type]}> [${new Date().toLocaleString()} - ${type}]:`;

/**
 * Interface for `console.log`. Won't print on 'production' mode
 * @param args Same arguments as `console.log`
 */
export const info: LoggerFunction = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(prefix("INFO"), ...args);
  }
};

/**
 * Interface for `console.error`. Always print
 * @param args Same arguments as `console.error`
 */
export const error: LoggerFunction = (...args) => {
  console.error(prefix("ERROR"), ...args);
};

/**
 * Interface for `console.warn`
 * @param args Same arguments as `console.warn`
 */
export const warn: LoggerFunction = (...args) => {
  console.warn(prefix("WARN"), ...args);
};
