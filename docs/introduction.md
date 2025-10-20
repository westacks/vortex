# Welcome to Vortex

Vortex is a powerful, framework-agnostic library that revolutionizes how you build single-page applications by providing **server-driven routing** instead of traditional client-side routing. Built with a philosophy that you should own all your code, Vortex offers a flexible core with official adapters for React, Vue, Svelte, and SolidJS.

## 🎯 What is Vortex?

Vortex is designed to simplify building reactive, modern web applications by handling navigation through your server rather than client-side routing. This approach provides several key benefits:

- **Simplified Architecture** - No more complex client-side routing logic
- **Better SEO** - Server-rendered pages with proper URLs
- **Framework Freedom** - Use any frontend framework you prefer
- **Built-in Extensions** - Inertia.js compatibility and progress bar included

## 🚀 Key Concepts

### Server-Driven Routing

Unlike traditional SPAs where the client handles routing, Vortex uses your server to determine what content to display. When a user navigates:

1. **Client makes request** to server (e.g., `GET /dashboard`)
2. **Server processes request** and returns page data
3. **Vortex updates the page** with new content
4. **URL updates** to reflect the new page

This approach eliminates the need for client-side routing while maintaining the smooth, fast experience users expect from SPAs.

### Internal State Management

Vortex uses signals internally to manage page state and reactivity in the browser. This system automatically tracks dependencies and updates your UI when data changes, but you don't need to create signals yourself - Vortex handles this internally.

### Framework Agnostic

Vortex works with any frontend framework through its adapter system:

- **React** - Official React adapter with hooks support
- **Vue** - Vue 3 composition API integration
- **Svelte** - Svelte 5 runes compatibility
- **SolidJS** - SolidJS signals integration

## 🔧 Core Features

### 1. Navigation & Routing

```ts
import { axios } from '@westacks/vortex';

// Navigate to new pages
axios.get('/about');
axios.get('/users/123');

// Submit forms
axios.post('/users', { name: 'John', email: 'john@example.com' });

// Update data
axios.patch('/users/123', { name: 'Jane' });

// Delete resources
axios.delete('/users/123');
```

### 2. Form Handling

```ts
import { useForm } from '@westacks/vortex';

const form = useForm({
  name: '',
  email: '',
  message: ''
});

// Form is automatically reactive
form.name = 'John';
form.email = 'john@example.com';

// Submit with automatic error handling
form.post('/contact').then(() => {
  console.log('Form submitted successfully!');
}).catch((errors) => {
  console.log('Validation errors:', errors);
});
```

### 3. Built-in Extensions

Vortex comes with two official extensions:

- **Inertia.js Compatibility** - Works seamlessly with Inertia.js servers
- **BProgress** - Progress bar integration

## 📱 How It Works

Vortex is designed to work with your existing server-side code. Your server handles routing, authentication, and business logic, while Vortex manages the client-side experience:

1. **Server handles routing** - Your existing server routes work unchanged
2. **Vortex manages client state** - Page updates happen automatically
3. **Framework adapters** - Integrate with your preferred frontend framework
4. **Extensions enhance functionality** - Add features like progress bars

## 🎨 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │───▶│   Vortex Core   │───▶│   Server API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Updates    │◀───│  State Changes  │◀───│  Page Response  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### 1. Installation

```bash
npm install @westacks/vortex
```

### 2. Basic Setup

```ts
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  // Your app setup here
  const app = document.createElement('div');
  app.textContent = 'Hello Vortex!';
  target.appendChild(app);
});
```

### 3. Framework Integration

Vortex includes all adapters in the core package:

```ts
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'react-dom/client';

createVortex(async (target, page, install, ssr) => {
  // React setup
  const root = createRoot(target);
  root.render(<App />);
});
```

## 🔄 Working with Inertia.js

Vortex provides Inertia.js compatibility, but note that the frontend syntax is different:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  // Install Inertia.js compatibility layer
  install(inertia(page.get()));
  
  // Your app setup...
});
```

**Important**: While Vortex works seamlessly with Inertia.js servers, the frontend API differs from the standard Inertia.js client. You'll need to adapt your frontend code to use Vortex's API.

## 📚 Next Steps

- **[Installation Guides](installation)** - Framework-specific setup instructions
- **[API Reference](api)** - Complete API documentation
- **[Examples](examples)** - Real-world usage examples
- **[Extensions](extensions)** - Built-in extensions
- **[Advanced Usage](advanced)** - Advanced patterns and techniques

## 🤝 Community & Support

- **GitHub** - [westacks/vortex](https://github.com/westacks/vortex)
- **Issues** - Report bugs and request features
- **Discussions** - Ask questions and share ideas
- **Documentation** - Comprehensive guides and examples

Vortex is designed to be simple yet powerful. Whether you're building a new application or integrating with existing Inertia.js servers, Vortex provides the tools you need to create fast, responsive, and maintainable web applications.
