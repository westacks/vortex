# Installation & Setup

This guide will walk you through setting up Vortex in your project, whether you're starting fresh or integrating with an existing application.

## 📦 Package Installation

### Core Package

Install the core Vortex package - this includes all framework adapters and extensions:

```bash
npm install @westacks/vortex
```

**Note**: All framework adapters (React, Vue, Svelte, SolidJS) and extensions (Inertia.js compatibility, BProgress) are included in the core package. You don't need to install them separately.

## 🚀 Basic Setup

### 1. Create Your Entry Point

Create a main entry file (e.g., `app.ts`, `main.ts`, or `index.ts`):

```ts
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  // target: DOM element to mount your app
  // page: reactive page state
  // install: function to install extensions
  // ssr: boolean indicating if running on server
  
  // Your app setup here
  const app = document.createElement('div');
  app.textContent = 'Hello Vortex!';
  target.appendChild(app);
});
```

### 2. HTML Setup

Add a target element to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vortex App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.ts"></script>
</body>
</html>
```

### 3. Bundle Configuration

Configure your bundler to use the entry point:

**Vite (vite.config.ts):**
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: './app.ts'
      }
    }
  }
});
```

**Webpack (webpack.config.js):**
```js
module.exports = {
  entry: './app.ts',
  // ... other config
};
```

## 🔧 Framework Integration

### React Setup

```tsx
import { createVortex } from '@westacks/vortex';
import { createRoot, hydrateRoot } from 'react-dom/client';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { resolve } from './resolve';
import Root from './Root';

createVortex(async (target, page, install, ssr) => {
  // Install extensions
  install(inertia(page.get()), bprogress());

  // Create React root
  const root = ssr
    ? hydrateRoot(target, <Root {...await resolve(page)} />)
    : createRoot(target);

  // Render function
  const render = async (pageData) => {
    root.render(<Root {...await resolve(pageData)} />);
  };

  // Initial render
  if (!ssr) render(page.get());

  // Subscribe to page changes
  page.subscribe(render);
});
```

### Vue Setup

```ts
import { createVortex } from '@westacks/vortex';
import { createApp, h } from 'vue';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { resolve } from './resolve';
import Root from './Root.vue';

createVortex(async (target, page, install, ssr) => {
  // Install extensions
  install(inertia(page.get()), bprogress());

  // Create Vue app
  const app = createApp({
    render: () => h(Root)
  });

  // Render function
  const render = async (pageData) => {
    const { component, props } = await resolve(pageData);
    app.component('PageComponent', component.default);
    app.provide('pageProps', props);
  };

  // Initial render
  render(page.get());

  // Subscribe to page changes
  page.subscribe(render);

  // Mount app
  app.mount(target);
});
```

### Svelte Setup

```ts
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'svelte';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { resolve } from './resolve';
import Root from './Root.svelte';

createVortex(async (target, page, install, ssr) => {
  // Install extensions
  install(inertia(page.get()), bprogress());

  // Create Svelte root
  const root = createRoot(Root, { target });

  // Render function
  const render = async (pageData) => {
    const { component, props } = await resolve(pageData);
    root.$set({ component, props });
  };

  // Initial render
  render(page.get());

  // Subscribe to page changes
  page.subscribe(render);
});
```

### SolidJS Setup

```ts
import { createVortex } from '@westacks/vortex';
import { render } from 'solid-js/web';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { resolve } from './resolve';
import Root from './Root';

createVortex(async (target, page, install, ssr) => {
  // Install extensions
  install(inertia(page.get()), bprogress());

  // Render function
  const renderApp = async (pageData) => {
    const { component, props } = await resolve(pageData);
    render(() => component.default(props), target);
  };

  // Initial render
  renderApp(page.get());

  // Subscribe to page changes
  page.subscribe(renderApp);
});
```

## 📄 Page Resolution

You'll need to create a page resolution system to dynamically load components based on the current page:

### Basic Resolver

```ts
// resolve.ts
import type { Page } from '@westacks/vortex';

export async function resolve(page: Page) {
  // Vite dynamic imports
  const pages = import.meta.glob('./pages/**/*.{tsx,ts,vue,svelte}');
  
  const componentPath = `./pages/${page.component}.tsx`;
  const component = await pages[componentPath]();
  
  return {
    component,
    props: page.props || {}
  };
}
```

### Advanced Resolver with Layouts

```ts
// resolve.ts
import type { Page } from '@westacks/vortex';

export async function resolve(page: Page) {
  const pages = import.meta.glob('./pages/**/*.{tsx,ts,vue,svelte}');
  const layouts = import.meta.glob('./layouts/**/*.{tsx,ts,vue,svelte}');
  
  const componentPath = `./pages/${page.component}.tsx`;
  const layoutPath = `./layouts/${page.layout || 'Default'}.tsx`;
  
  const [component, layout] = await Promise.all([
    pages[componentPath](),
    layouts[layoutPath]()
  ]);
  
  return {
    component,
    layout,
    props: page.props || {}
  };
}
```

## 🔌 Extensions & Plugins

### Built-in Extensions

Vortex comes with two official extensions included in the core package:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';

createVortex(async (target, page, install, ssr) => {
  // Install Inertia.js compatibility
  install(inertia(page.get()));
  
  // Install progress bar
  install(bprogress());
  
  // Your app setup...
});
```

### Custom Extensions

Create your own extensions for custom functionality:

```ts
import type { VortexExtension } from '@westacks/vortex';

const myExtension: VortexExtension = ({ request, response }) => {
  // Add request interceptor
  const req = request.use(
    (config) => {
      // Add custom headers
      config.headers = { ...config.headers, 'X-Custom': 'value' };
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor
  const res = response.use(
    (response) => {
      // Handle response
      return response;
    },
    (error) => Promise.reject(error)
  );

  // Return cleanup function
  return () => {
    request.eject(req);
    response.eject(res);
  };
};

// Use in your app
createVortex(async (target, page, install, ssr) => {
  install(myExtension);
  // Your app setup...
});
```

## 🎯 Server-Side Rendering

For SSR support, create a separate entry point:

```ts
// ssr.ts
import { createVortexServer } from '@westacks/vortex/server';
import { resolve } from './resolve';

createVortexServer(async (page) => {
  const { component, props } = await resolve(page);
  
  // Render your component to HTML
  const html = await renderComponent(component, props);
  
  return { html };
});
```

## 🚀 Development vs Production

### Development

```ts
// Development setup with hot reload
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

### Production

```ts
// Production optimizations
createVortex(async (target, page, install, ssr) => {
  // Install only necessary extensions
  install(inertia(page.get()));
  
  // Your production app setup...
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Module not found**: Ensure you're using the correct import paths
2. **TypeScript errors**: Check that types are properly installed
3. **Build errors**: Verify your bundler configuration
4. **Runtime errors**: Check the browser console for detailed error messages

### Debug Mode

Enable debug mode for development:

```ts
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  // Enable debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Vortex initialized in debug mode');
  }
  
  // Your app setup...
});
```

## 📚 Next Steps

- **[Framework Guides](installation/react)** - Detailed setup for specific frameworks
- **[API Reference](api)** - Complete API documentation
- **[Examples](examples)** - Real-world usage examples
- **[Extensions](extensions)** - Built-in and custom extensions
- **[Advanced Usage](advanced)** - Advanced patterns and techniques

Now you're ready to start building with Vortex! The next step is to choose your framework and follow the specific installation guide.
