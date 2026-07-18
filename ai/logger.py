import logging
import sys
import os
from logging.handlers import TimedRotatingFileHandler
import json

logger = logging.getLogger("ai_layer")
logger.propagate = False

env = os.getenv("NODE_ENV", "development")
is_production = env == "production"

log_level = logging.INFO if is_production else logging.DEBUG
logger.setLevel(log_level)

console_format = logging.Formatter(
    fmt='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_format = logging.Formatter(
    fmt='%(asctime)s %(levelname)s [%(name)s]: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(log_level)
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "name": record.name
        }
        return json.dumps(log_obj)

# Then apply it to your console handler:
if is_production:
    console_handler.setFormatter(JSONFormatter(datefmt='%Y-%m-%d %H:%M:%S'))
else:
    console_handler.setFormatter(console_format)
logger.addHandler(console_handler)

if not is_production:
    logs_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    app_handler = TimedRotatingFileHandler(
        filename=os.path.join(logs_dir, "application.log"),
        when="midnight",
        interval=1,
        backupCount=14
    )
    app_handler.setLevel(log_level)
    app_handler.setFormatter(file_format)
    app_handler.suffix = "%Y-%m-%d"
    logger.addHandler(app_handler)
    
    error_handler = TimedRotatingFileHandler(
        filename=os.path.join(logs_dir, "error.log"),
        when="midnight",
        interval=1,
        backupCount=14
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_format)
    error_handler.suffix = "%Y-%m-%d"
    logger.addHandler(error_handler)
