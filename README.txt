DBD MINIGAME WEBSITE

Files:
- index.html
- style.css
- script.js

How to run:
1. Keep your existing index.py unchanged.
2. Start your FastAPI server, for example:
   uvicorn index:app --reload
   If your Python filename contains spaces or parentheses, rename a COPY for running,
   or use the module name you already use in your current project.
3. The JavaScript expects:
   http://127.0.0.1:8000
4. Open index.html using VS Code Live Server or another local web server.

Important:
The API key is already required by your existing index.py. Because this is a browser
frontend, the same key appears in script.js. That is suitable for a school/local project,
but a client-side API key should not be treated as a secret on a public production site.

Game modes:
- Description
- Perks
- Zoomed Image

Image mode:
- Guess 1: 5.2x zoom
- After first wrong guess: 4x
- After second wrong guess: 2.8x
- After third wrong guess: character is revealed
