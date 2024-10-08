from flask import Blueprint, request, jsonify
from backend.services import claude_service, gpt_service
import logging

bp = Blueprint('llm', __name__)

@bp.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        model = data.get('model', 'gpt-4')
        system_prompt = data.get('systemPrompt', '')
        user_prompt = data.get('userPrompt', '')
        conversation = data.get('conversation', [])
        # Extract settings from data
        settings = {
            'temperature': data.get('temperature', 1.0),
            'maxTokens': data.get('maxTokens', 2048),
            'topP': data.get('topP', 1.0),
            'frequencyPenalty': data.get('frequencyPenalty', 0.0),
            'presencePenalty': data.get('presencePenalty', 0.0),
        }
        # Ensure conversation messages are in the correct format
        conversation = [
            {
                "role": m.get("role", "unknown"),
                "content": m.get("content", "")
            } for m in conversation
        ]
        # Log the conversation for debugging
        logging.debug(f"Processed conversation: {conversation}")
        # Ensure conversation messages are in the correct format
        conversation = [
            {"role": m["role"], "content": m["content"]} for m in conversation
        ]

        try:
            if model.startswith('gpt-'):
                response_content = gpt_service.generate(
                    model, system_prompt, user_prompt, conversation, settings
                )
            elif model.startswith('claude-'):
                response_content = claude_service.generate(
                    model, system_prompt, user_prompt, conversation, settings
                )
            else:
                return jsonify({"error": "Invalid model selected"}), 400

            return jsonify({"response": response_content})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        logging.error(f"Error in generate function: {str(e)}")
        return jsonify({"error": "An error occurred while processing the request"}), 500
