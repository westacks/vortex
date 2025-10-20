# Migration from Inertia.js

This guide will help you migrate your existing Inertia.js application to Vortex. Vortex provides a drop-in compatibility layer that makes migration seamless while giving you access to additional features and better performance.

## 🚀 Why Migrate to Vortex?

### Benefits of Migration

- **Better Performance** - Built on a more efficient core
- **Framework Agnostic** - Use with any frontend framework
- **Enhanced Features** - Built-in polling, prefetching, and more
- **Future-Proof** - Active development and modern architecture
- **Same API** - Minimal code changes required

### Compatibility

Vortex maintains 100% API compatibility with Inertia.js, so your existing code will work unchanged.

## 📦 Installation

### 1. Install Vortex

```bash
npm uninstall @inertiajs/react @inertiajs/vue @inertiajs/svelte
npm install @westacks/vortex
```

### 2. Install Framework Adapter

```bash
# React
npm install @westacks/vortex/react

# Vue
npm install @westacks/vortex/vue

# Svelte
npm install @westacks/vortex/svelte

# SolidJS
npm install @westacks/vortex/solid-js
```

## 🔄 Basic Migration

### Before (Inertia.js)

```tsx
// app.tsx
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

### After (Vortex with Inertia Compatibility)

```tsx
// app.tsx
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'react-dom/client';
import inertia from '@westacks/vortex/inertia';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createVortex(async (target, page, install, ssr) => {
  // Install Inertia.js compatibility layer
  install(inertia(page.get()));
  
  const resolve = (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx'));
  
  const root = createRoot(target);
  
  const render = async (pageData) => {
    const { default: component, props } = await resolve(pageData.component);
    root.render(React.createElement(component, props));
  };
  
  // Initial render
  render(page.get());
  
  // Subscribe to page changes
  page.subscribe(render);
});
```

## 🔧 Framework-Specific Migration

### React Migration

#### Before (Inertia.js)

```tsx
// App.tsx
import { AppProps } from '@inertiajs/react';

export default function App({ children, ...props }: AppProps) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

// Pages/Users/Index.tsx
import { Head, useForm } from '@inertiajs/react';

export default function Users({ users, filters }) {
  const { data, setData, get, processing } = useForm({
    search: filters.search || '',
    role: filters.role || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    get('/users', { data });
  };

  return (
    <>
      <Head title="Users" />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={data.search}
          onChange={e => setData('search', e.target.value)}
        />
        <button type="submit" disabled={processing}>
          Search
        </button>
      </form>
      {/* User list */}
    </>
  );
}
```

#### After (Vortex with Inertia Compatibility)

```tsx
// App.tsx
import { AppProps } from '@westacks/vortex/inertia';

export default function App({ children, ...props }: AppProps) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

// Pages/Users/Index.tsx
import { Head, useForm } from '@westacks/vortex/inertia';

export default function Users({ users, filters }) {
  const { data, setData, get, processing } = useForm({
    search: filters.search || '',
    role: filters.role || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    get('/users', { data });
  };

  return (
    <>
      <Head title="Users" />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={data.search}
          onChange={e => setData('search', e.target.value)}
        />
        <button type="submit" disabled={processing}>
          Search
        </button>
      </form>
      {/* User list */}
    </>
  );
}
```

**No changes needed in your components!** The API is identical.

### Vue Migration

#### Before (Inertia.js)

```vue
<!-- app.js -->
import { createInertiaApp } from '@inertiajs/vue';
import { createApp, h } from 'vue';

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
    return pages[`./Pages/${name}.vue`];
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el);
  },
});
```

#### After (Vortex with Inertia Compatibility)

```ts
// app.ts
import { createVortex } from '@westacks/vortex';
import { createApp, h } from 'vue';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()));
  
  const app = createApp({
    render: () => h('div') // Placeholder
  });
  
  const resolve = (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
    return pages[`./Pages/${name}.vue`];
  };
  
  const render = async (pageData) => {
    const { default: component } = await resolve(pageData.component);
    app.component('PageComponent', component);
    app.provide('pageProps', pageData.props);
  };
  
  render(page.get());
  page.subscribe(render);
  
  app.mount(target);
});
```

### Svelte Migration

#### Before (Inertia.js)

```ts
// app.ts
import { createInertiaApp } from '@inertiajs/svelte';
import { createInertiaApp } from '@inertiajs/svelte';

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true });
    return pages[`./Pages/${name}.svelte`];
  },
  setup({ el, App, props }) {
    new App({ target: el, props });
  },
});
```

#### After (Vortex with Inertia Compatibility)

```ts
// app.ts
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'svelte';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()));
  
  const resolve = (name) => {
    const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true });
    return pages[`./Pages/${name}.svelte`];
  };
  
  const render = async (pageData) => {
    const { default: component } = await resolve(pageData.component);
    const root = createRoot(component, { target, props: pageData.props });
  };
  
  render(page.get());
  page.subscribe(render);
});
```

## 🔌 Using Inertia.js APIs

### Navigation

```tsx
import { router } from '@westacks/vortex/inertia';

// Visit a page
router.visit('/users');

// Visit with data
router.visit('/users', {
  data: { search: 'john' },
  method: 'get'
});

// Visit with options
router.visit('/users', {
  data: { name: 'John' },
  method: 'post',
  preserveState: true,
  replace: false,
  only: ['users']
});
```

### Forms

```tsx
import { useForm } from '@westacks/vortex/inertia';

export default function UserForm() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/users');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={data.name}
        onChange={e => setData('name', e.target.value)}
      />
      {errors.name && <div>{errors.name}</div>}
      
      <input
        type="email"
        value={data.email}
        onChange={e => setData('email', e.target.value)}
      />
      {errors.email && <div>{errors.email}</div>}
      
      <button type="submit" disabled={processing}>
        {processing ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Page Props and Head

```tsx
import { Head } from '@westacks/vortex/inertia';

export default function Users({ users, filters }) {
  return (
    <>
      <Head title="Users" />
      <Head>
        <meta name="description" content="User management" />
      </Head>
      
      <h1>Users</h1>
      {/* User list */}
    </>
  );
}
```

## 🚀 Enhanced Features

### Built-in Polling

```tsx
import { usePoll } from '@westacks/vortex';

export default function LiveUsers() {
  const poll = usePoll(30000, { // 30 seconds
    url: '/api/users/online',
    method: 'GET'
  });

  useEffect(() => {
    poll.start();
    return () => poll.stop();
  }, []);

  // Component logic...
}
```

### Prefetching

```tsx
import { axios } from '@westacks/vortex';

// Prefetch a page
const prefetchUser = () => {
  axios.get('/users/123', { prefetch: true });
};

return (
  <Link onMouseEnter={prefetchUser}>
    User Profile
  </Link>
);
```

### State Remembering

```tsx
import { useForm } from '@westacks/vortex';

const form = useForm({
  name: '',
  email: '',
  message: ''
}, 'contact-form'); // Remember key for state preservation

// Form state persists across navigation
```

## 🔧 Advanced Configuration

### Custom Headers

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()));
  
  // Add custom headers to all requests
  axios.interceptors.request.use((config) => {
    config.headers = {
      ...config.headers,
      'X-Custom-Header': 'value'
    };
    return config;
  });
  
  // Your app setup...
});
```

### Error Handling

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()));
  
  // Global error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 419) {
        // CSRF token mismatch
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );
  
  // Your app setup...
});
```

## 📱 Progressive Enhancement

### Server-Side Rendering

```ts
// ssr.ts
import { createVortexServer } from '@westacks/vortex/server';

createVortexServer(async (page) => {
  const { default: component, props } = await resolveComponent(page.component);
  
  // Render component to HTML
  const html = await renderComponent(component, props);
  
  return { html };
});
```

### Hybrid Approach

```tsx
export default function App({ children, ...props }) {
  // Check if Vortex is available
  if (typeof createVortex !== 'undefined') {
    return <VortexApp {...props} />;
  }
  
  // Fallback to traditional navigation
  return <TraditionalApp {...props} />;
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure you've installed the correct Vortex packages
   - Check import paths are correct

2. **Inertia.js APIs not working**
   - Verify the Inertia compatibility layer is installed
   - Check that `install(inertia(page.get()))` is called

3. **Build errors**
   - Update your bundler configuration
   - Ensure TypeScript types are properly installed

4. **Runtime errors**
   - Check browser console for detailed error messages
   - Verify all dependencies are compatible

### Debug Mode

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Vortex initialized in debug mode');
  }
  
  install(inertia(page.get()));
  
  // Your app setup...
});
```

## 📚 Migration Checklist

### Pre-Migration

- [ ] Backup your current application
- [ ] Document current Inertia.js version
- [ ] Identify custom extensions or modifications
- [ ] Test current application thoroughly

### Migration Steps

- [ ] Install Vortex and framework adapter
- [ ] Update entry point configuration
- [ ] Test basic functionality
- [ ] Verify all Inertia.js APIs work
- [ ] Test navigation and forms
- [ ] Verify error handling

### Post-Migration

- [ ] Test all application features
- [ ] Verify performance improvements
- [ ] Update documentation
- [ ] Train team on new features
- [ ] Plan future Vortex-specific enhancements

## 🔗 Next Steps

- **[Installation Guide](installation)** - Complete setup instructions
- **[API Reference](api)** - Full Vortex API documentation
- **[Examples](examples)** - Real-world usage examples
- **[Extensions](extensions)** - Built-in and custom extensions

## 🤝 Support

If you encounter issues during migration:

1. **Check the documentation** - Most issues are covered here
2. **Search existing issues** - Your problem might already have a solution
3. **Create a new issue** - Provide detailed information about your setup
4. **Join discussions** - Ask questions in the community

Migration to Vortex is designed to be smooth and risk-free. The Inertia.js compatibility layer ensures your existing code continues to work while giving you access to Vortex's enhanced features and performance improvements.
