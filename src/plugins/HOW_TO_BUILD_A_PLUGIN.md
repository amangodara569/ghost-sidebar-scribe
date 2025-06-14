# How to Build a VibeMind Plugin

This guide will help you create custom plugins for the VibeMind productivity workspace.

## Plugin Types

VibeMind supports four types of plugins:

1. **Widget**: Visual components that appear in the main workspace
2. **Integration**: Background services that sync with external APIs
3. **Command**: Custom actions accessible via voice or shortcuts
4. **Event Hook**: Listeners that react to user activity

## Getting Started

### 1. Plugin Structure

Create a new folder in `src/plugins/` with your plugin name:

```
src/plugins/my-awesome-plugin/
├── plugin.config.js    # Plugin configuration
├── index.js           # Main plugin code
├── styles.css         # Optional styling
└── README.md          # Plugin documentation
```

### 2. Configuration File

Every plugin needs a `plugin.config.js` file:

```javascript
export default {
  name: 'My Awesome Plugin',
  id: 'my-awesome-plugin',
  author: 'Your Name',
  version: '1.0.0',
  type: 'widget', // 'widget' | 'integration' | 'command' | 'event-hook'
  description: 'A brief description of what your plugin does',
  
  // Plugin settings (optional)
  settings: {
    refreshInterval: 5000,
    showNotifications: true
  },
  
  // Required permissions (optional)
  permissions: ['storage', 'notifications'],
  
  // Dependencies (optional)
  dependencies: []
};
```

### 3. Main Plugin Code

Create your main plugin in `index.js`:

```javascript
export class MyAwesomePlugin {
  constructor() {
    this.api = null;
  }

  // Called when plugin loads
  async init(api) {
    this.api = api;
    console.log('My Awesome Plugin initialized!');
    
    // Register your functionality here
    if (this.config.type === 'widget') {
      this.registerWidget();
    }
  }

  // Called when plugin unloads
  cleanup() {
    console.log('Cleaning up My Awesome Plugin');
  }

  // Called when plugin is enabled
  enable() {
    console.log('My Awesome Plugin enabled');
  }

  // Called when plugin is disabled
  disable() {
    console.log('My Awesome Plugin disabled');
  }

  registerWidget() {
    this.api.registerWidget({
      id: 'my-widget',
      name: 'My Widget',
      component: this.renderWidget.bind(this)
    });
  }

  renderWidget() {
    return `
      <div class="p-4 bg-gray-800 rounded-lg">
        <h3 class="text-lg font-bold">My Awesome Widget</h3>
        <p>Hello from my plugin!</p>
      </div>
    `;
  }
}
```

## VibeMind API Reference

The VibeMind API provides access to core functionality:

### Storage

```javascript
// Save data
api.storage.set('myKey', { data: 'value' });

// Retrieve data
const data = api.storage.get('myKey');
```

### Notifications

```javascript
// Show toast notification
api.showToast('Plugin activated!', 'success');
api.showToast('Something went wrong', 'error');
api.showToast('Info message', 'info');
```

### Commands

```javascript
// Register a command
api.addCommand({
  id: 'my-command',
  label: 'My Custom Command',
  shortcut: 'Ctrl+M',
  action: () => {
    console.log('Command executed!');
  }
});
```

### Activity Listening

```javascript
// Listen to user activity
api.listenToActivity((event) => {
  console.log('Activity detected:', event);
  
  if (event.type === 'note-created') {
    // React to note creation
  }
});
```

### Data Access

```javascript
// Get app data
const notes = api.getData('notes');
const todos = api.getData('todos');
const timers = api.getData('timers');
const spotify = api.getData('spotify');
```

### Theme Control

```javascript
// Change app theme
api.setTheme('neon-noir');
```

## Plugin Examples

### Simple Counter Widget

```javascript
export class CounterPlugin {
  constructor() {
    this.count = 0;
  }

  async init(api) {
    this.api = api;
    
    api.registerWidget({
      id: 'counter-widget',
      name: 'Counter',
      component: this.renderCounter.bind(this)
    });

    // Load saved count
    const saved = api.storage.get('counter-value');
    this.count = saved || 0;
  }

  renderCounter() {
    return `
      <div class="p-4 bg-gray-800 rounded-lg">
        <h3 class="text-lg font-bold mb-2">Counter</h3>
        <div class="text-2xl mb-4">${this.count}</div>
        <button onclick="window.counterPlugin.increment()" 
                class="px-3 py-1 bg-blue-600 text-white rounded mr-2">
          +
        </button>
        <button onclick="window.counterPlugin.decrement()" 
                class="px-3 py-1 bg-red-600 text-white rounded">
          -
        </button>
      </div>
    `;
  }

  increment() {
    this.count++;
    this.api.storage.set('counter-value', this.count);
    this.refresh();
  }

  decrement() {
    this.count--;
    this.api.storage.set('counter-value', this.count);
    this.refresh();
  }

  refresh() {
    // Trigger widget re-render
    window.dispatchEvent(new CustomEvent('plugin:refresh-widget', {
      detail: { id: 'counter-widget' }
    }));
  }
}
```

### Activity Logger Integration

```javascript
export class ActivityLoggerPlugin {
  async init(api) {
    this.api = api;
    this.logs = api.storage.get('activity-logs') || [];

    api.listenToActivity((event) => {
      this.logActivity(event);
    });

    api.addCommand({
      id: 'show-activity-log',
      label: 'Show Activity Log',
      action: () => this.showLog()
    });
  }

  logActivity(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      data: event.data
    };

    this.logs.push(logEntry);
    
    // Keep only last 100 entries
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    this.api.storage.set('activity-logs', this.logs);
  }

  showLog() {
    const recent = this.logs.slice(-10);
    const summary = recent.map(log => 
      `${log.timestamp}: ${log.type}`
    ).join('\\n');
    
    this.api.showToast(`Recent activity:\\n${summary}`, 'info');
  }
}
```

## Best Practices

1. **Error Handling**: Always wrap your code in try-catch blocks
2. **Cleanup**: Implement the `cleanup()` method to prevent memory leaks
3. **Performance**: Avoid heavy computations in the main thread
4. **User Experience**: Provide clear feedback for all user actions
5. **Security**: Don't access sensitive data outside the provided API

## Testing Your Plugin

1. Load your plugin through the Plugin Store
2. Check browser console for any errors
3. Test all functionality thoroughly
4. Verify cleanup when plugin is unloaded

## Publishing Your Plugin

Once your plugin is ready:

1. Create a GitHub repository
2. Add installation instructions
3. Submit to the VibeMind Plugin Registry (coming soon)
4. Share with the community!

Happy plugin development! 🚀
