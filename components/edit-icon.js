// Edit Icon Component
class EditIcon extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16.5 3.5A2.121 2.121 0 0 1 19 6L7 18L3 19L4 15L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
}

customElements.define('edit-icon', EditIcon); 