from flask import Blueprint, request, jsonify
from backend.models import db, Conversation, Message, Prompt
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from backend.services import gpt_service  # Import the GPT service
from sqlalchemy.exc import IntegrityError  # Add this import
from sqlalchemy import desc

logger = logging.getLogger(__name__)

bp = Blueprint('conversation', __name__)

def generate_conversation_title(messages):
    system_prompt = "You are a helpful assistant that generates short, concise titles for conversations. Please provide a title of 5 words or less based on the following conversation:"
    conversation_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    user_prompt = f"Generate a title for this conversation:\n{conversation_text}"
    
    title = gpt_service.generate(
        model="gpt-3.5-turbo",
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        conversation=[],
        settings={"temperature": 0.7, "maxTokens": 20, "topP": 1, "frequencyPenalty": 0, "presencePenalty": 0}
    )
    
    return title.strip()

@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    conversations = Conversation.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': c.id,
        'messages': [{
            'role': m.role,
            'content': m.content,
            'model': m.model
        } for m in c.messages]
    } for c in conversations])

@bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.json
    logger = logging.getLogger(__name__)
    try:
        # Generate a title for the conversation
        title = generate_conversation_title(data.get('messages', []))

        new_conversation = Conversation(user_id=user_id, title=title)
        db.session.add(new_conversation)
        db.session.flush()  # This will assign an ID to the new conversation

        for message in data.get('messages', []):
            new_message = Message(
                role=message['role'],
                content=message['content'],
                conversation_id=new_conversation.id
            )
            db.session.add(new_message)

        db.session.commit()
        logger.info(f"Conversation '{title}' saved successfully for user {user_id}")
        return jsonify({'id': new_conversation.id, 'title': title, 'message': 'Conversation saved successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving conversation for user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to save conversation'}), 500

@bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@jwt_required()
def add_message(conversation_id):
    user_id = get_jwt_identity()
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"message": "Conversation not found"}), 404
    
    data = request.json
    new_message = Message(
        role=data['role'],
        content=data['content'],
        conversation_id=conversation_id
    )
    db.session.add(new_message)
    db.session.commit()
    return jsonify({'id': new_message.id}), 201

@bp.route('/conversations', methods=['POST'])
@jwt_required()
def save_conversation():
    user_id = get_jwt_identity()
    data = request.json
    messages = data.get('messages')
    title = data.get('title')

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    logger.info(f"Received title: {title}")
    # Use the provided title if it exists, otherwise generate one
    if not title or title.strip() == "":
        title = generate_conversation_title(messages)
    else:
        title = title.strip()

    try:
        new_conversation = Conversation(user_id=user_id, title=title)
        db.session.add(new_conversation)
        db.session.flush()  # This will assign an ID to the new conversation

        for message in messages:
            new_message = Message(
                role=message['role'],
                content=message['content'],
                model=message.get('model'),
                conversation_id=new_conversation.id
            )
            db.session.add(new_message)

        db.session.commit()
        logger.info(f"Conversation '{title}' saved successfully for user {user_id}")
        return jsonify({
            "message": "Conversation saved successfully",
            "id": new_conversation.id,
            "title": title
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving conversation for user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to save conversation'}), 500

from sqlalchemy.exc import IntegrityError

@bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    user_id = get_jwt_identity()
    try:
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
        if not conversation:
            logger.warning(f"Attempt to delete non-existent conversation {conversation_id} by user {user_id}")
            return jsonify({"error": "Conversation not found or you don't have permission to delete it"}), 404

        # Log the conversation details before deletion
        logger.info(f"Deleting conversation {conversation_id} for user {user_id}. Title: {conversation.title}")

        # Delete all messages associated with this conversation
        message_count = Message.query.filter_by(conversation_id=conversation_id).delete()
        logger.info(f"Deleted {message_count} messages for conversation {conversation_id}")
        
        # Delete the conversation itself
        db.session.delete(conversation)
        db.session.commit()
        
        logger.info(f"Conversation {conversation_id} deleted successfully for user {user_id}")
        return jsonify({"message": "Conversation deleted successfully"}), 200
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Database integrity error while deleting conversation {conversation_id}: {str(e)}")
        return jsonify({"error": "Database integrity error. Could not delete conversation."}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting conversation {conversation_id}: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the conversation"}), 500

@bp.route('/conversations/<int:conversation_id>/fork', methods=['POST'])
@jwt_required()
def fork_conversation(conversation_id):
    user_id = get_jwt_identity()
    data = request.json
    fork_index = data.get('forkIndex')

    if fork_index is None:
        return jsonify({"error": "Fork index not provided"}), 400

    try:
        # Get the original conversation
        original_conversation = Conversation.query.filter_by(id=conversation_id).first()
        if not original_conversation:
            return jsonify({"error": "Original conversation not found"}), 404

        # Get messages up to the fork point
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.id).limit(fork_index + 1).all()

        # Generate a new title for the forked conversation
        forked_title = f"Fork of: {original_conversation.title}"

        # Create a new conversation
        new_conversation = Conversation(user_id=user_id, title=forked_title)
        db.session.add(new_conversation)
        db.session.flush()  # This will assign an ID to the new conversation

        # Copy messages to the new conversation
        for message in messages:
            new_message = Message(
                role=message.role,
                content=message.content,
                model=message.model,
                conversation_id=new_conversation.id
            )
            db.session.add(new_message)

        db.session.commit()
        logger.info(f"Conversation '{forked_title}' forked successfully for user {user_id}")
        return jsonify({
            "message": "Conversation forked successfully",
            "id": new_conversation.id,
            "title": forked_title
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error forking conversation for user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fork conversation'}), 500