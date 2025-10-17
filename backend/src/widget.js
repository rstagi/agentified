(function () {
  class ChatbotWidget extends HTMLElement {
    constructor() {
      super();
      // Create shadow DOM for style isolation
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const apiKey = document.querySelector('script[data-api-key]')
        .getAttribute('data-api-key');

      console.log("api key:", apiKey);
      // Fetch widget configuration from your backend
      //fetch(`https://your-api.com/widget/config/${apiKey}`)
      //.then(r => r.json())
      //.then(config => this.render(config));
      this.render({ style: { borderRadius: 1, backgroundColor: "#fff" }, title: "Example title." });
    }

    render(config) {
      this.shadowRoot.innerHTML = `
        <style>
          /* Styles are isolated - won't leak to parent page */
          .chatbot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            height: 600px;
            border-radius: ${config.style.borderRadius};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: ${config.style.backgroundColor};
            z-index: 999999;
          }
          /* More styles... */
        </style>
        
        <div class="chatbot-container">
          <div class="chatbot-header">${config.title}</div>
          <div class="chatbot-messages"></div>
          <div class="chatbot-input">
            <input type="text" placeholder="Type a message..." />
          </div>
        </div>
      `;

      this.setupEventListeners(config);
    }

    setupEventListeners(config) {
      // Handle messages, API calls, etc.
    }
  }

  // Register the custom element
  customElements.define('chatbot-widget', ChatbotWidget);

  // Auto-inject into page
  const widget = document.createElement('chatbot-widget');
  document.body.appendChild(widget);
})();

/*

<script>
(function() {
  const script = document.createElement('script');
  script.src = 'http://localhost:8080/widget.js';
  script.setAttribute('data-api-key', 'user-api-key-here');
  document.head.appendChild(script);
})();
</script>

 */
