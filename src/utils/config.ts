import { info } from "@/utils/logger";

/**
 * @description Checks if an environment variable exists
 * @param identifier Name of the environment variable
 * @returns Value of the environment variable if it exists, otherwise throws an error
 */
function checkVariable(identifier: string) {
  const variable = process.env[identifier];

  if (process.env.NODE_ENV !== "production")
    info(`Checking:\t${identifier} = '${variable}'`);
  if (typeof variable === "undefined") {
    throw new Error(`Environment variable "${identifier}" is not defined.`);
  } else return variable;
}

/**
 * @description Node environment. Could be 'production' or 'development'.
 */
export const NODE_ENV = checkVariable("NODE_ENV");

/**
 * @description Google API Client ID
 */
export const GOOGLE_CLIENT_ID = checkVariable("GOOGLE_CLIENT_ID");

/**
 * @description Google API Client Secret
 */
export const GOOGLE_CLIENT_SECRET = checkVariable("GOOGLE_CLIENT_SECRET");

/**
 * @description Google Sheet ID
 */
export const GOOGLE_SHEET_ID = checkVariable("GOOGLE_SHEET_ID");
