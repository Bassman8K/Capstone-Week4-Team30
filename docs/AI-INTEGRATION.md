# Proposed AI Integration

## Application Input

The application will send:
- Child name
- Age
- Category
- Current situation
- Recent context
- Known triggers
- Previous strategies

## Expected AI Response

The AI should return:
- possibleContext
- suggestedActions
- followUpQuestion

## Proposed Flow

Frontend
↓
Express Backend
↓
Ollama API
↓
Hermes 3
↓
Structured JSON Response
↓
Frontend Recommendation Display

## Configuration

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=hermes3:3b

## Sprint 2 Integration

The Express backend can later send the user’s situation and stored Firestore context to Ollama. Hermes 3 will generate a structured response that can be returned to the frontend and displayed as recommendations.