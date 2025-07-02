# Quantum Adventures

This repo contains a small web prototype inspired by the original React Native snippet. It demonstrates a simple learning flow with lessons, quizzes, a short character guide and a mock upgrade dialog.

## Running the demo

Open `index.html` in any modern web browser. The application is entirely client side and requires no build tools.

Your progress and score are saved in `localStorage`, so you can continue where you left off. Use the **Reset Progress** button in the footer to clear saved data.

## Project structure

- `index.html` – main HTML file which loads the bundled React code.
- `app.js` – React components and application logic.
- `style.css` – basic styles used by the app.

The header displays a progress bar with a percentage indicator showing how far you've progressed through the available lessons and quizzes.

Feel free to expand the lesson and quiz data or adapt the components for a larger project.
