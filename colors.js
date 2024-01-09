//file to generate colors

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Función para convertir un número entero en un valor de tono (hue) entre 0 y 360
function intToHue(i) {
  return i % 360;
}

// Función para convertir un número entero en un valor de saturación entre 80 y 100
function intToSaturation(i) {
  return (i % 21) + 80;
}

// Función para convertir un número entero en un valor de luminosidad entre 70 y 90
function intToLightness(i) {
  return (i % 21) + 70;
}

export default function generatePastelColor(seedText) {
  const hash = hashCode(seedText);
  const hue = intToHue(hash);
  const saturation = intToSaturation(hash);
  const lightness = intToLightness(hash);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
