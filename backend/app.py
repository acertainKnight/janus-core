import logging
from logging.handlers import RotatingFileHandler
import os
from flask import Flask, jsonify
from flask_cors import CORS  # Add this import
from flask_jwt_extended import JWTManager
from backend.routes import auth, conversation, llm, prompts
from backend.models import db, User  # Adjust the import path based on your project structure
from backend.config import config

# Configure logging
log_directory = 'logs'
if not os.path.exists(log_directory):
    os.makedirs(log_directory)
log_file = os.path.join(log_directory, 'backend.log')

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

file_handler = RotatingFileHandler(log_file, maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.DEBUG)

logger.addHandler(file_handler)

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)  # Make sure this line is present
    
    # Enable CORS for all routes
    CORS(app)  # Add this line
    
    # Initialize database
    db.init_app(app)

    # Initialize JWT
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(auth.bp, url_prefix='/auth')
    app.register_blueprint(conversation.bp, url_prefix='/api')
    app.register_blueprint(llm.bp, url_prefix='/api')
    app.register_blueprint(prompts.bp, url_prefix='/api')

    @app.route('/')
    def index():
        logger.info("Index route accessed")
        return "LLM Playground API"

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if isinstance(e, Exception):
            return e

        # Now you're handling non-HTTP exceptions only
        logger.exception("An error occurred: %s", str(e))
        return jsonify(error=str(e)), 500

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            admin_user = User(username='admin')
            admin_user.set_password('pw')
            db.session.add(admin_user)
            db.session.commit()
            logger.info(f"Admin user created with username: admin")
        else:
            logger.info("Admin user already exists")
        
        users = User.query.all()
        for user in users:
            logger.info(f"User in database: {user.username}")

    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)