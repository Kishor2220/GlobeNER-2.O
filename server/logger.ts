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
  private formatMessage(level: LogLevel, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    return `${timestamp} ${level.padEnd(5)} ${ctx}${message}`;
  }

  info(message: string, context?: string) {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, context?: string, error?: any) {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));
    if (error) {
      if (error.stack) console.error(error.stack);
      else console.error(error);
    }
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }
}

export const logger = new Logger();
