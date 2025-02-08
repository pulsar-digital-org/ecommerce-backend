// import * as fs from 'fs';
import * as path from 'path';

const logLevels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR'
};

class Logger {
  private logLevel: string;
  private logFilePath: string;

  constructor() {
    this.logLevel = logLevels.info; // Default log level
    const executablePath = process.execPath; // Get the path to the Electron executable
    const executableDirectory = path.dirname(executablePath);
    this.logFilePath = path.join(executableDirectory, 'app.log'); // Define the log file path
  }

  setLogLevel(level: string) {
    if (Object.values(logLevels).includes(level.toUpperCase())) {
      this.logLevel = level.toUpperCase();
    } else {
      console.warn(`Invalid log level: ${level}. Using the default level.`);
    }
  }

  log(level: string, ...messages: any[]) {
    if (
      Object.values(logLevels).indexOf(level) >=
      Object.values(logLevels).indexOf(this.logLevel)
    ) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${
        this.logFilePath
      }][${timestamp}][${level}] ${messages.join(' ')}\n`;

      if (process.env.NODE_ENV !== 'test') {
        // Log to the console
        process.stdout.write(logMessage);
      }

      // Log to the file (in production)
      // if (process.env.NODE_ENV !== 'development') {
      // 	fs.appendFile(this.logFilePath, logMessage, (err) => {
      // 		if (err) {
      // 			console.error('Error writing to log file:', err);
      // 		}
      // 	});
      // }
    }
  }

  info(...messages: any[]) {
    this.log(logLevels.info, ...messages);
  }

  warn(...messages: any[]) {
    this.log(logLevels.warn, ...messages);
  }

  error(...messages: any[]) {
    this.log(logLevels.error, ...messages);
  }
}

const logger = new Logger();

export default logger;
