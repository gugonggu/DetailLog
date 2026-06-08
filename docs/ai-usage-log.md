# AI Usage Log

## 2026-05-19: AI Wash Routine Recommendation

- Feature: AI wash routine recommendation
- Route handler: `src/app/api/routines/route.ts`
- Model: `OPENAI_MODEL` when configured, otherwise `gpt-4.1-mini`
- Prompt purpose: generate a mobile-readable, step-by-step car wash routine from the user's selected car condition, wash environment, experience level, target time, goals, owned products, and cautions
- User data sent: `carId`, `carColor`, `coatingType`, `dirtLevel`, `environment`, `experienceLevel`, `targetTime`, `goals`, `ownedProducts`, `cautions`
- Structured output: OpenAI Responses API with `text.format.type = json_schema` and `strict = true`
- App validation: API route validates the model output with `routineResultSchema` before saving, and the detail page validates saved JSON again before rendering
- Persistence: validated input/result JSON is saved to Supabase table `routine_recommendations`
- Safety or privacy note: the prompt asks for safety cautions, avoids exposing `OPENAI_API_KEY` to the client, and does not send community feed data
- Fallback decision: if OpenAI returns invalid JSON or fails after the request is attempted, the API saves a conservative local safety routine and marks the response as fallback

## Required Environment Variables

- `OPENAI_API_KEY`: server-only OpenAI API key
- `OPENAI_MODEL`: optional model override
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
