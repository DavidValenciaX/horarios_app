//file to generate colors

function hashCode(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char; // Equivalent to hash * 33 + char
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

export default function generatePastelColor(seedText) {
  const hash = hashCode(seedText);
  
  // Extract different parts of the hash for each component
  const huePart = hash & 0xFFFF;        // Use lower 16 bits for hue
  const saturationPart = (hash >> 16) & 0xFF; // Next 8 bits for saturation
  const lightnessPart = (hash >> 24) & 0xFF;  // Upper 8 bits for lightness

  // Map to HSL ranges
  const hue = (huePart / 65535) * 360;               // 0-360 degrees
  const saturation = 40 + (saturationPart / 255) * 30; // 40-70%
  const lightness = 80 + (lightnessPart / 255) * 15;   // 80-95%

  return `hsl(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;
}