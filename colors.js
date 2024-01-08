//file to generate colors

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Function to convert an integer number to a lightness value between 80 and 90
function intToLightness(i) {
  let lightness = (i % 11) + 80;
  return lightness;
}

// Function to convert an integer number to a chroma value between 0 and 0.2 (for pastel colors)
function intToChroma(i) {
  const chroma = (i % 21) / 100 + 0.1; // Scale and shift to 0.1 to 0.3 range
  return chroma;
}

// Function to convert an integer number to a hue value between 0 and 360
function intToHue(i) {
  let hue = (i * 12) % 360; // Spread hues more evenly
  return hue;
}

export default function generatePastelColor(seedText) {
  const hash = hashCode(seedText);
  const lightness = intToLightness(hash);
  const chroma = intToChroma(hash);
  const hue = intToHue(hash);
  return `oklch(${lightness}% ${chroma} ${hue})`; // OKLCH syntax
}
