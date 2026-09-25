# Workflow: Deploy for the resume demo

## Steps
1. Backend: containerize with the provided `backend/Dockerfile` (or deploy directly) to
   Render/Railway/Fly.io free tier. Set environment variables for the LLM API key —
   never commit keys, use `.env` (already gitignored).
2. Frontend: deploy to Vercel/Netlify, pointing `VITE_API_BASE_URL` at the deployed
   backend.
3. Smoke-test all four API endpoints against the deployed backend URL, not just
   localhost.
4. Record a 60–90 second demo video/GIF for the resume/portfolio: show the risk lookup,
   then an AskRights query with its citation, in both English and Hindi.
5. Update the root `README.md` "Live demo" section with the deployed URL and the demo
   clip.

## Definition of done
- Public URL works end-to-end from a cold load, on a throttled mobile network
  simulation (Chrome DevTools "Slow 3G") — this product's real users are on slow
  connections, so this is not optional polish.
