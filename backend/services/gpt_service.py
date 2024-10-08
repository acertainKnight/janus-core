import os
from openai import OpenAI
from typing import List, Dict, Any

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def generate(model: str, system_prompt: str, user_prompt: str, conversation: List[Dict[str, str]], settings: Dict[str, Any]) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        *conversation,
        {"role": "user", "content": user_prompt}
    ]

    params = {
        "model": model,
        "messages": messages,
        "max_tokens": int(settings['maxTokens']),
        "temperature": float(settings['temperature']),
        "top_p": float(settings['topP']),
        "frequency_penalty": float(settings['frequencyPenalty']),
        "presence_penalty": float(settings['presencePenalty'])
    }

    if model.startswith("gpt-"):
        response = client.chat.completions.create(**params)
        return response.choices[0].message.content
    else:
        raise ValueError(f"Unsupported model: {model}")
