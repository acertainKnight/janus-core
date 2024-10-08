import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import db, Prompt

bp = Blueprint('prompts', __name__)
logger = logging.getLogger(__name__)

@bp.route('/prompts', methods=['GET'])
@jwt_required()
def get_prompts():
    user_id = get_jwt_identity()
    prompts = Prompt.query.filter_by(user_id=user_id).all()
    return jsonify(prompts=[prompt.to_dict() for prompt in prompts])

@bp.route('/prompts', methods=['POST'])
@jwt_required()
def create_prompt():
    user_id = get_jwt_identity()
    data = request.json
    new_prompt = Prompt(
        name=data['name'],
        system_prompt=data['systemPrompt'],
        user_prompt=data['userPrompt'],
        user_id=user_id
    )
    db.session.add(new_prompt)
    db.session.commit()
    return jsonify(message="Prompt saved successfully", prompt=new_prompt.to_dict()), 201

@bp.route('/prompts/<int:prompt_id>', methods=['DELETE'])
@jwt_required()
def delete_prompt(prompt_id):
    user_id = get_jwt_identity()
    prompt = Prompt.query.filter_by(id=prompt_id, user_id=user_id).first()
    if not prompt:
        logger.warning(f"Prompt not found: id={prompt_id}, user_id={user_id}")
        return jsonify({"message": "Prompt not found"}), 404
    try:
        db.session.delete(prompt)
        db.session.commit()
        logger.info(f"Prompt deleted successfully: id={prompt_id}")
        return jsonify({"message": "Prompt deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting prompt: id={prompt_id}, error={str(e)}")
        return jsonify({"message": f"Error deleting prompt: {str(e)}"}), 500
