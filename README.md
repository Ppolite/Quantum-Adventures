# Quantum Fun Adventures

This repo contains a small web prototype inspired by the original React Native snippet. It demonstrates a simple learning flow with lessons, quizzes, a short character guide, and fun quantum randomness features like coin flips and dice rolls. The goal is to inspire a revolutionary quantum curriculum for college students by showcasing interactive ideas in a lightweight web app.

## Running the demo

Open `index.html` in any modern web browser. The application is entirely client side and requires no build tools. After the first load it works offline thanks to a simple service worker. You can also install it to your home screen or desktop like a regular app.

Your progress and score are saved in `localStorage`, so you can continue where you left off. Use the **Reset Progress** button in the footer to clear saved data.

Each completed lesson reveals a random quantum fun fact and every quiz answer includes a short explanation so you learn even when you miss a question.

## Project structure

- `index.html` – main HTML file which loads the bundled React code.
- `app.js` – React components and application logic.
- `style.css` – basic styles used by the app.
- `manifest.json` – web app manifest for PWA support.
- `sw.js` – service worker enabling offline usage.
- `utils.js` – small helper functions used across the app.
- `test.js` – quick sanity checks for the helper functions.
- app icons are embedded directly in `manifest.json` as data URIs.
The utilities now include helpers like `applyHadamard()` and a hidden `secretSauceBonus()` used for bonus scoring.

The header displays a progress bar with a percentage indicator showing how far you've progressed through the available lessons and quizzes.

After each lesson a fun fact modal pops up, and quiz results explain the correct answer.
The footer includes buttons to **Flip Coin** and **Roll Dice**, both using quantum randomness for fun demonstrations.

## Quantum VR Adventure

The prototype also includes an experimental virtual reality scene powered by [A-Frame](https://aframe.io/). An AI agent creates a small timeline of events using the helper utilities so each visit feels a little different. Every five seconds a new object or message appears in the 3D scene to illustrate how quantum states can evolve over time. Open the page in any WebVR-enabled browser or a regular desktop browser to view the embedded scene.

### How the AI agent works

- `vr.js` builds a timeline with random shapes and colors chosen using the `quantumDice()` helper.
- Each event is scheduled to run in order, creating a short guided tour.
- The scene runs automatically when the page loads.

For additional study materials, the app also provides a **Resources** section with suggested textbooks and online tutorials.

### Running tests

With Node.js installed, run:

```bash
node test.js
```

This executes a few basic checks on the helper functions.

Feel free to expand the lesson and quiz data or adapt the components for a larger project.

## License AI Game Mode

The prototype doubles as a small "License AI Game" designed to keep learning fun.
Play through lessons and quizzes to earn points. Correct answers might trigger
a hidden bonus via the secret sauce algorithm. Use the **Rules** button or press
`r` on your keyboard at any time to read the game rules. Scores accumulate and
unlock extra objects in the VR adventure.

### User controls

- **Guide** or `g` – open the mascot guide.
- **Rules** or `r` – view how scoring works.
- **Reset Progress** – start over from the beginning.
- **Flip Coin** / **Roll Dice** – random quantum demos.
- **Resources** – suggested textbooks and tutorials.

## License

This repository is provided under the **Quantum Adventures Paid License (QAPL)**. Personal and non-commercial use is allowed at no cost. Any commercial use requires purchasing a license from the original author. See the `LICENSE` file for details.
