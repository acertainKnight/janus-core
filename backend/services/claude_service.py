import os
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def generate(model, system_prompt, user_prompt, conversation, settings):
    messages = [
        {"role": "system", "content": system_prompt},
        *[{"role": msg['role'], "content": msg['content']} for msg in conversation],
        {"role": "user", "content": user_prompt}
    ]

    response = client.messages.create(
        model=model,
        messages=messages,
        max_tokens=int(settings['maxTokens']),
        temperature=float(settings['temperature']),
        top_p=float(settings['topP']),
    )

    return response.content[0].text
