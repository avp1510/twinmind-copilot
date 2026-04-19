import os
import json
from django.conf import settings
from groq import Groq


# Optimal default prompts — hardcoded as required by the assignment
SUGGESTION_PROMPT = """You are a focused meeting assistant. Based on the transcript, return exactly 3 useful, specific suggestions for the listener.

Rules:
- ONE sentence each, max 15 words.
- Specific to current topic (no generic advice).
- Format ONLY as a JSON array of strings: ["...", "...", "..."]
- Do not include any other text or explanation.
"""

DETAILED_PROMPT = """You are a helpful meeting assistant. Provide a clear, readable summary or expansion of the suggested topic based on the transcript.

Format:
- Use 3-5 concise bullet points.
- Use plain, professional English.
- Avoid long code blocks or complex LaTeX math unless the user specifically asked for them.
- Focus on the "Why" and "What next".
"""

CHAT_PROMPT = """You are a real-time meeting assistant. The user is asking a question while a conversation is in progress.

Answer using the transcript context provided. Be direct and specific.
Use Markdown formatting for clarity. Stay grounded in what was actually said — do not fabricate details.
"""


class GroqService:
    def __init__(self, api_key=None):
        # Priority: user-provided key → settings.py hardcoded (dev only) → env var
        resolved_key = (
            api_key
            or getattr(settings, "GROQ_API_KEY", None)
            or os.environ.get("GROQ_API_KEY")
        )
        self.client = Groq(api_key=resolved_key)

    def transcribe(self, audio_file):
        """Transcribes audio using Whisper Large V3 as required by the assignment."""
        try:
            # Groq SDK requires (filename, bytes) tuple for Django InMemoryUploadedFile
            file_data = (audio_file.name, audio_file.read())
            transcription = self.client.audio.transcriptions.create(
                file=file_data,
                model="whisper-large-v3",
                response_format="text",
            )
            return transcription
        except Exception as e:
            return f"Error during transcription: {str(e)}"

    def generate_suggestions(self, transcript_context, prompt_template=None):
        """
        Generates exactly 3 context-aware suggestions.
        Uses openai/gpt-oss-120b as required by the assignment.
        Note: this model does not support response_format=json_object, so we parse JSON from text.
        """
        prompt = prompt_template or SUGGESTION_PROMPT
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Meeting transcript:\n\n{transcript_context}"},
                ],
                model="openai/gpt-oss-120b",
                temperature=0.7,
                max_tokens=512,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating suggestions: {str(e)}"

    def get_chat_response(self, history, context, query, prompt_template=None):
        """
        Returns a detailed answer grounded in the full transcript context.
        Maintains conversation history for one continuous chat per session.
        """
        is_suggestion_expansion = prompt_template and "suggestion" in prompt_template.lower()
        prompt = prompt_template or (DETAILED_PROMPT if is_suggestion_expansion else CHAT_PROMPT)

        messages = [
            {"role": "system", "content": prompt},
            {"role": "system", "content": f"Full meeting transcript so far:\n\n{context}"},
        ]
        # Append conversation history then the new query
        messages.extend(history)
        messages.append({"role": "user", "content": query})

        try:
            response = self.client.chat.completions.create(
                messages=messages,
                # Model: openai/gpt-oss-120b as explicitly required by the assignment
                model="openai/gpt-oss-120b",
                temperature=0.5,
                max_tokens=1024,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
