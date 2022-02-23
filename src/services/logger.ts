/**
 * Prints via the terminal if the environment is set to "development" via the NODE_ENV variable
 * @param args params to send to the console.log method
 */

function log (...args: any): void {
    process.env.NODE_ENV === 'development' && console.log(...args);
}

export default log;