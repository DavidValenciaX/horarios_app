export function createIcon(name) {
  const img = document.createElement("img");
  img.src = `./assets/${name}.svg`;
  img.classList.add("icon");
  return img;
} 