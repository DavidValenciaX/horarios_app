const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
  <path d="M18 6l-12 12"></path>
  <path d="M6 6l12 12"></path>
</svg>`;

class XIcon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1em;
          height: 1em;
        }
        svg {
          width: 100%;
          height: 100%;
        }
      </style>
      ${svg}
    `;
  }
}

customElements.define('x-icon', XIcon); 