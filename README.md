# Interview AI: Mock Interview Simulator (ANN project)

A browser app where students pick a role and level, answer questions out loud, and get a scored report.

## Run it
Use Chrome or Edge (speech recognition needs them).
```
cd interview-ai
python3 -m http.server 8000
# open http://localhost:8000
```
Or open `dist/interview-ai.html` directly.

## Features
- Roles: AI Engineer, ML Engineer, Python, Backend, Frontend, FDE (Forward Deployed Engineer), Other (custom)
- Levels: Fresher, Intern, Intermediate, Advanced
- Camera on/off, spoken questions (text to speech), speech to text, typed fallback
- Evaluation dashboard, per-answer review, delivery stats, saved history
- ANN Lab: network diagram, live training curve, feature playground

## The ANN
`src/ann.js` is a multi layer perceptron written from scratch: 13 inputs, 16 tanh, 8 tanh, 4 sigmoid outputs
(Content, Structure, Clarity, Delivery), trained with backpropagation and the Adam optimiser on mean squared error.
`src/evaluate.js` turns a transcript into the 13 input features (keyword coverage, similarity to a model answer,
filler words, structure markers, pace, duration, level and more).

Limitation: the training data is synthetic, labelled by a transparent rubric (`teacher()` in ann.js).
For a real examiner, collect human rated answers, replace `makeDataset`, and retrain.

## Files
src/questions.js (question bank), ann.js, evaluate.js, speech.js, app.js, interview.js, report.js, styles.css.
`python3 build.py` makes the single file build. `node tests/engine.test.js` tests the ANN.

## Privacy
Video is shown on screen only. Chrome and Edge send speech audio to their own speech service for recognition.
