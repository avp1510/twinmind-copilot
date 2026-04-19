import os
import re
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from .services.groq_service import GroqService


class TranscriptionView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        audio_file = request.FILES.get('file')
        api_key = request.data.get('api_key') or request.headers.get('X-Groq-API-Key')

        if not audio_file:
            return Response({"error": "No audio file provided"}, status=status.HTTP_400_BAD_REQUEST)

        groq_service = GroqService(api_key=api_key)
        transcript = groq_service.transcribe(audio_file)

        if isinstance(transcript, str) and transcript.startswith("Error"):
            return Response({"error": transcript}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"transcript": transcript})


class SuggestionsView(APIView):
    parser_classes = (JSONParser,)

    def post(self, request):
        context = request.data.get('context', '')
        prompt_template = request.data.get('prompt_template')
        api_key = request.data.get('api_key') or request.headers.get('X-Groq-API-Key')

        if not context:
            return Response({"error": "No transcript context provided"}, status=status.HTTP_400_BAD_REQUEST)

        groq_service = GroqService(api_key=api_key)
        suggestions_raw = groq_service.generate_suggestions(context, prompt_template)

        # Robust extraction: find the longest substring that looks like a JSON array
        suggestions = []
        try:
            # Search for anything between [ and ] (inclusive), taking the longest match
            # which usually handles nested brackets or fragments correctly
            arrays = re.findall(r'\[.*\]', suggestions_raw, re.DOTALL)
            if arrays:
                # Target the largest array found
                target_raw = max(arrays, key=len).strip()
                # Strip markdown code fences if they managed to get inside the match
                target_raw = re.sub(r'^```[a-z]*\n?', '', target_raw)
                target_raw = re.sub(r'\n?```$', '', target_raw)
                
                parsed = json.loads(target_raw)
                if isinstance(parsed, list):
                    suggestions = [str(s).strip() for s in parsed[:3]]
                elif isinstance(parsed, dict):
                    # Fallback for dict with list
                    for val in parsed.values():
                        if isinstance(val, list):
                            suggestions = [str(s).strip() for s in val[:3]]
                            break
        except Exception as e:
            print(f"DEBUG: JSON extraction attempt failed: {str(e)}")

        if not suggestions:
            # Fallback 2: regex extract anything that looks like a quoted string
            matches = re.findall(r'"([^"]{5,})"', suggestions_raw)
            if matches:
                 suggestions = matches[:3]
            else:
                # Absolute fallback: treat the raw text as a single suggestion if short, 
                # or first 200 chars
                suggestions = [suggestions_raw.strip()[:200]]

        return Response({"suggestions": suggestions})


class ChatView(APIView):
    parser_classes = (JSONParser,)

    def post(self, request):
        history = request.data.get('history', [])
        context = request.data.get('context', '')
        query = request.data.get('query', '')
        prompt_template = request.data.get('prompt_template')
        api_key = request.data.get('api_key') or request.headers.get('X-Groq-API-Key')

        if not query:
            return Response({"error": "No query provided"}, status=status.HTTP_400_BAD_REQUEST)

        groq_service = GroqService(api_key=api_key)
        answer = groq_service.get_chat_response(history, context, query, prompt_template)

        return Response({"answer": answer})
