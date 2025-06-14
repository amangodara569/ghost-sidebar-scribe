
// Example plugin configuration file
// This shows how developers can structure their plugins

export default {
  // Plugin metadata
  name: 'Example Widget',
  id: 'example-widget',
  author: 'Plugin Developer',
  version: '1.0.0',
  description: 'An example plugin showing how to create custom widgets',
  
  // Plugin type determines how it integrates with the system
  type: 'widget', // 'widget' | 'integration' | 'command' | 'event-hook'
  
  // Where this plugin should be placed (for widgets)
  slot: 'sidebar',
  
  // Plugin settings/configuration
  settings: {
    refreshInterval: 5000,
    showNotifications: true,
    theme: 'dark'
  },
  
  // Required permissions
  permissions: [
    'storage',     // Access to plugin storage
    'notifications', // Show notifications
    'commands'     // Register commands
  ],
  
  // Dependencies (other plugins this depends on)
  dependencies: []
};

// Plugin main class/function
export class ExamplePlugin {
  constructor(api) {
    this.api = api;
    this.config = null;
  }

  // Called when plugin is loaded
  async init(api) {
    console.log('Example plugin initializing...');
    
    // Register a custom widget
    api.registerWidget({
      id: 'example-widget',
      name: 'Example Widget',
      component: this.renderWidget.bind(this),
      settings: this.config?.settings
    });

    // Add a command
    api.addCommand({
      id: 'example-command',
      label: 'Example Command',
      shortcut: 'Ctrl+E',
      action: () => {
        api.showToast('Example command executed!', 'success');
      }
    });

    // Listen to activity
    api.listenToActivity((event) => {
      console.log('Activity detected:', event);
    });
  }

  // Called when plugin is unloaded
  cleanup() {
    console.log('Example plugin cleaning up...');
  }

  // Called when plugin is enabled
  enable() {
    console.log('Example plugin enabled');
  }

  // Called when plugin is disabled
  disable() {
    console.log('Example plugin disabled');
  }

  // Render widget content (for widget-type plugins)
  renderWidget() {
    return `
      <div class="p-4 bg-gray-800 rounded-lg">
        <h3 class="text-lg font-bold mb-2">Example Widget</h3>
        <p class="text-gray-300">This is an example plugin widget!</p>
        <button onclick="this.handleClick()" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded">
          Click Me
        </button>
      </div>
    `;
  }

  handleClick() {
    this.api.showToast('Widget button clicked!', 'info');
  }
}
