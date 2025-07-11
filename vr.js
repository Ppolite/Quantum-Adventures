// Simple AI-driven VR adventure using A-Frame
// Events are scheduled in time to illustrate quantum concepts.

// Generate a timeline of VR events using quantum randomness
function createTimeline() {
  const shapes = ['box', 'sphere', 'cone'];
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  const timeline = [];
  for (let i = 0; i < 4; i++) {
    const geom = shapes[quantumDice() % shapes.length];
    const color = colors[quantumDice() % colors.length];
    timeline.push({
      time: i * 5,
      type: 'entity',
      geometry: geom,
      color,
      position: `${i - 1} 1.5 -3`
    });
  }
  timeline.push({ time: 20, type: 'text', value: 'Thanks for exploring!' });
  return timeline;
}

function runEvent(scene, evt) {
  if (evt.type === 'entity') {
    const el = document.createElement('a-entity');
    el.setAttribute('geometry', { primitive: evt.geometry });
    el.setAttribute('material', { color: evt.color });
    el.setAttribute('position', evt.position);
    scene.appendChild(el);
  } else if (evt.type === 'text') {
    const textEl = document.createElement('a-text');
    textEl.setAttribute('value', evt.value);
    textEl.setAttribute('position', '0 2 -2');
    scene.appendChild(textEl);
  }
}

function startAdventure() {
  const scene = document.getElementById('vr-scene');
  const timeline = createTimeline();
  timeline.forEach((evt) => {
    setTimeout(() => runEvent(scene, evt), evt.time * 1000);
  });
}

document.addEventListener('DOMContentLoaded', startAdventure);
