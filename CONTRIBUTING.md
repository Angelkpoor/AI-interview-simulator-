# Contributing to Interview AI

Interview AI is plain HTML, CSS and JavaScript. There is no framework and no package install needed to run it.

## Run it locally
    python3 -m http.server 8000
Open http://localhost:8000 (use Chrome or Edge for speech to text).

## Where things live
- `src/questions.js`: roles, levels and the question bank (add questions here)
- `src/ann.js`: the neural network (MLP, multi-layer perceptron), features and synthetic training data
- `src/evaluate.js`: feature extraction and the feedback text
- `src/speech.js`: speech to text, text to speech, camera and mic
- `src/interview.js`, `src/report.js`, `src/app.js`: the screens
- `src/styles.css`: all styling

## After you edit anything in src/
    python3 build.py
This rebuilds `dist/interview-ai.html` (a single file with everything inlined) and you should copy it to `dist/index.html`, which is what Vercel serves:
    cp dist/interview-ai.html dist/index.html

## Tests
    node tests/engine.test.js     # neural network and scoring
    python3 tests/ui.py           # full browser flow (needs Playwright and Chrome)

## Ideas for contributors
- Add questions for a role or level
- Replace the synthetic training data with human-rated answers
- Add more roles
