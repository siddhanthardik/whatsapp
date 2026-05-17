const SystemLog = require('../models/SystemLog');

const logger = {
  log: async (level, service, message, err = null, metadata = {}) => {
    try {
      // Standard output print
      const timestamp = new Date().toISOString();
      const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}`;
      if (level === 'error' || level === 'critical') {
        console.error(consoleMsg, err ? err.stack || err : '');
      } else if (level === 'warning') {
        console.warn(consoleMsg);
      } else {
        console.log(consoleMsg);
      }

      // Safe metadata serialization
      let safeMeta = {};
      if (metadata) {
        try {
          safeMeta = JSON.parse(JSON.stringify(metadata));
        } catch (e) {
          safeMeta = { raw: String(metadata) };
        }
      }

      const logData = {
        level,
        service,
        message: message || (err ? err.message : 'Unknown event'),
        stack: err ? err.stack : undefined,
        metadata: safeMeta
      };

      if (metadata && metadata.organizationId) {
        logData.organizationId = metadata.organizationId;
      }

      // Write asynchronously to prevent blocking threads
      await SystemLog.create(logData);
    } catch (e) {
      console.error('Logger failed to save to database:', e.message);
    }
  },

  info: (service, message, metadata) => logger.log('info', service, message, null, metadata),
  warn: (service, message, err, metadata) => logger.log('warning', service, message, err, metadata),
  error: (service, message, err, metadata) => logger.log('error', service, message, err, metadata),
  critical: (service, message, err, metadata) => logger.log('critical', service, message, err, metadata)
};

module.exports = logger;
