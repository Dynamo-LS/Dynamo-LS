# DeepSeek Integration Guide

## Environment Variables
- DEEPSEEK_API_KEY
- DEEPSEEK_MODEL=deepseek-chat

## Backend Prompt Strategy
Use two prompt templates:
1. Initial plan generation
2. Weekly summary

Store templates in prompts/ and inject user context + current state JSON.

## Required LLM Output Contract
Force JSON-only response with this shape:
{
  "sessions": [
    {
      "date": "YYYY-MM-DD",
      "topic": "string",
      "durationMin": 30,
      "type": "learn|review|practice",
      "intensity": "light|medium|heavy",
      "reason": "why this placement"
    }
  ],
  "eta": "YYYY-MM-DD",
  "notes": ["string"]
}

## Validation Rules
- Duration cannot exceed remaining day capacity.
- Max 2 heavy sessions per day.
- Minimum 1 review session per week.
- Dates must stay within plan window unless extension is explicit.

## Fail-Safe Pattern
If LLM JSON parse fails:
- Retry once with stricter "JSON only" instruction.
- If still invalid or the API key is missing, fallback to rules-based scheduler and log error.

## Example Reschedule User Message
"I am traveling Mon-Wed and only have 15 minutes Thursday."

System should:
- mark blocked dates
- compress Thursday to one micro-session
- move heavy sessions to Fri/Sat
- update ETA and reason trail
