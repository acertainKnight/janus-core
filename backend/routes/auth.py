import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import db, User

logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    logger.info(f"Register attempt for user: {data.get('username')}")
    if User.query.filter_by(username=data['username']).first():
        logger.warning(f"Registration failed: Username {data['username']} already exists")
        return jsonify({"message": "Username already exists"}), 400
    new_user = User(username=data['username'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    logger.info(f"New user registered: {data['username']}")
    return jsonify({"message": "User registered successfully"}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    logger.info(f"Login attempt for user: {data.get('username')}")
    try:
        user = User.query.filter_by(username=data.get('username')).first()
        if user:
            logger.debug(f"User found: {user.username}")
            if user.check_password(data.get('password')):
                logger.info(f"Login successful for user: {user.username}")
                access_token = create_access_token(identity=user.id)
                return jsonify(token=access_token), 200
            else:
                logger.warning(f"Login failed: Incorrect password for user {user.username}")
                return jsonify({"message": "Invalid username or password"}), 401
        else:
            logger.warning(f"Login failed: User {data.get('username')} not found")
            return jsonify({"message": "Invalid username or password"}), 401
    except Exception as e:
        logger.exception(f"Error during login: {str(e)}")
        return jsonify({"message": "An error occurred during login"}), 500

@bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    logger.info(f"Protected route accessed by user ID: {current_user_id}")
    return jsonify(logged_in_as=current_user_id), 200
