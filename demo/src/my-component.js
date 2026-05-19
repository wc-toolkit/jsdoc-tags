/* eslint-disable no-undef */


/**
 * Test component
 * 
 * @status beta - A beta component
 * @dependency Button - A button component
 * @dependency Icon
 */
export class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  /**
   * The greeting to display
   * @myCustomTag important
   */
  greeting = "Hello, World!";

  _headline = "Hello, Accessors!";

  /**
   * The headline to display
   * @myCustomTag accessor-tag
   */
  get headline() {
    return this._headline;
  }

  set headline(value) {
    this._headline = value;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        h1 {
          color: blue;
        }
      </style>
      <h1>Hello, World!</h1>
    `;
  }
}

customElements.define('my-component', MyComponent);