/**
 * Centralized Logger for GlobeNER 2.0
 */
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 
                   (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    return `${timestamp} ${level.padEnd(5)} ${ctx}${message}`;
  }

  info(message: string, context?: string) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: string) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  error(message: string, context?: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (error) {
        if (error.stack) console.error(error.stack);
        else console.error(error);
      }
    }
  }

  debug(message: string, context?: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }
}

export const logger = new Logger();
