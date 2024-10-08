import os
import logging

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///your_database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key'
    
    # Logging configuration
    LOG_FILE = 'logs/backend.log'
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @staticmethod
    def init_app(app):
        # Ensure the logs directory exists
        os.makedirs('logs', exist_ok=True)
        
        # Set up file handler
        file_handler = logging.FileHandler(Config.LOG_FILE)
        file_handler.setLevel(Config.LOG_LEVEL)
        file_handler.setFormatter(logging.Formatter(Config.LOG_FORMAT))
        
        # Set up console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(Config.LOG_LEVEL)
        console_handler.setFormatter(logging.Formatter(Config.LOG_FORMAT))
        
        # Configure root logger
        logging.basicConfig(level=Config.LOG_LEVEL, handlers=[file_handler, console_handler])

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
