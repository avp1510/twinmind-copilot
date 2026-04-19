from django.urls import path
from .views import TranscriptionView, SuggestionsView, ChatView

urlpatterns = [
    path('transcribe/', TranscriptionView.as_view(), name='transcribe'),
    path('suggestions/', SuggestionsView.as_view(), name='suggestions'),
    path('chat/', ChatView.as_view(), name='chat'),
]
