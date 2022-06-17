import { svg } from 'lit-html';

function createValueToY(min, max, height) {
  return function(value) {
    const norm = (value - min) / (max - min);
    const y = height - (norm * height);
    return y;
  }
}

function createPath(values, width, valueToY) {
  let path = ``;

  function indexToX(i) {
    return (i / values.length) * width;
  }

  path += `M ${indexToX(0)} ${valueToY(values[0])}`;

  for (let i = 1; i < values.length; i++) {
    path += ` L ${indexToX(i)} ${valueToY(values[i])}`;
  }

  return path;
}

export default function createTempoStatsPlot(stack, stats, reference) {
  console.log(stack.length);
  console.log(stats);

  const width = window.innerWidth - 40;
  const height = 200;

  const min = stats.min - 5;
  const max = stats.max + 5;

  const valueToY = createValueToY(min, max, height);

  return svg`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      style="display: block; margin-top: 20px; outline: 1px solid #ababab"
    >

      <path d="${createPath(stack, width, valueToY)}" stroke="#0c7bdc" fill="none" />

      <!-- ref -->
      <line x1="0" y1="${valueToY(reference)}" x2="${width}" y2="${valueToY(reference)}" stroke="black" />

      <!-- min / max / mean-->
      <line x1="0" y1="${valueToY(stats.min)}" x2="${width}" y2="${valueToY(stats.min)}" stroke="#ffc20a" />
      <line x1="0" y1="${valueToY(stats.max)}" x2="${width}" y2="${valueToY(stats.max)}" stroke="#ffc20a" />
      <line x1="0" y1="${valueToY(stats.mean)}" x2="${width}" y2="${valueToY(stats.mean)}" stroke="#ffc20a" />

    </svg>
  `;
}
