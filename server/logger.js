const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, errors } = format;
const path = require('path');

// Define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: path.join("../", 'logs', 'app.log'), // Ensure logs directory exists
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// Define the format for the log messages
const logFormat = printf(({ level, message, label, timestamp, stack }) => {
  return `${timestamp} [${label}] ${level}: ${stack || message}`;
});

// Create the logger
const logger = createLogger({
  format: combine(
    label({ label: 'rainbow' }),
    timestamp(),
    errors({ stack: true }), // Log the full stack in case of an error
    logFormat
  ),
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
