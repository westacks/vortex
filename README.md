# Vortex

[![npm version](https://badge.fury.io/js/%40westacks%2Fvortex.svg)](https://badge.fury.io/js/%40westacks%2Fvortex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Server-based routing for SPAs with framework-agnostic design**

Vortex is a powerful, lightweight library that provides server-driven routing for single-page applications. Built with a philosophy that you should own all your code, it offers a flexible core with official adapters for React, Vue, Svelte, and SolidJS.

## ✨ Features

- **🚀 Framework Agnostic** - Works with any frontend framework
- **📡 Server-Driven Routing** - Navigate without client-side routing
- **🔄 Inertia.js Compatible** - Works seamlessly with Inertia.js servers
- **⚡ Performance Optimized** - Built-in prefetching, polling, and caching
- **🎯 SSR Ready** - Server-side rendering support out of the box
- **🔧 Extensible** - Plugin system for custom functionality
- **📦 All-in-One** - Adapters and extensions included in core package

## 🚀 Quick Start

### Installation

```bash
npm install @westacks/vortex
```

### Basic Setup

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  // Install Inertia.js compatibility layer
  install(inertia(page.get()));
  
  // Your app setup here
  const app = document.createElement('div');
  app.textContent = 'Hello Vortex!';
  target.appendChild(app);
});
```

### Framework Adapters

Vortex includes all framework adapters in the core package:

```ts
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'react-dom/client';

createVortex(async (target, page, install, ssr) => {
  // React setup
  const root = createRoot(target);
  root.render(<App />);
});
```

## 📚 Documentation

- **[Getting Started](https://westacks.github.io/vortex/introduction)** - Quick setup guide
- **[Installation Guides](https://westacks.github.io/vortex/installation)** - Framework-specific setup
- **[API Reference](https://westacks.github.io/vortex/api)** - Complete API documentation
- **[Examples](https://westacks.github.io/vortex/examples)** - Real-world usage examples

## 🎯 Core Concepts

### Server-Driven Navigation

```ts
import { axios } from '@westacks/vortex';

// Navigate to a new page
axios.get('/dashboard');

// Submit a form
axios.post('/users', { name: 'John', email: 'john@example.com' });

// Update data
axios.patch('/users/1', { name: 'Jane' });
```

### Form Handling

```ts
import { useForm } from '@westacks/vortex';

const form = useForm({
  name: '',
  email: ''
});

// Form is automatically reactive
form.name = 'John';
form.email = 'john@example.com';

// Submit with automatic error handling
form.post('/users');
```

### Internal State Management

Vortex uses signals internally to manage page state and reactivity. You don't need to create signals yourself - Vortex handles this automatically.

## 🔌 Extensions

Vortex comes with two official built-in extensions:

- **Inertia.js Compatibility** - Works seamlessly with Inertia.js servers
- **BProgress** - Progress bar integration

**Note**: While Vortex works seamlessly with Inertia.js servers, the frontend API differs from the standard Inertia.js client.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Documentation](https://westacks.github.io/vortex)
- [GitHub Repository](https://github.com/westacks/vortex)
- [Issues](https://github.com/westacks/vortex/issues)
- [Discussions](https://github.com/westacks/vortex/discussions)