# Navigation & Routing

Vortex provides powerful navigation capabilities through its enhanced Axios instance and utility functions. This guide covers all aspects of navigation, from basic page transitions to advanced routing patterns.

## 🚀 Basic Navigation

### Using Axios for Navigation

Vortex's `axios` instance handles all navigation automatically:

```ts
import { axios } from '@westacks/vortex';

// Navigate to a new page
await axios.get('/about');

// Navigate with query parameters
await axios.get('/users', {
  params: { search: 'john', role: 'admin' }
});

// Navigate with POST data
await axios.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Navigate with PUT (update)
await axios.put('/users/123', {
  name: 'Jane Doe'
});

// Navigate with PATCH (partial update)
await axios.patch('/users/123', {
  status: 'active'
});

// Navigate with DELETE
await axios.delete('/users/123');

// Reload current page
await axios.reload();
```

### Navigation Options

Vortex provides several navigation options to control behavior:

```ts
import { axios } from '@westacks/vortex';

// Preserve current state
await axios.get('/dashboard', {
  vortex: { preserve: true }
});

// Replace current history entry
await axios.get('/dashboard', {
  vortex: { replace: true }
});

// Control scroll behavior
await axios.get('/dashboard', {
  vortex: { scroll: 'top' } // 'top', 'preserve', 'manual'
});

// Combine options
await axios.post('/users', {
  data: { name: 'John' },
  vortex: {
    preserve: true,
    replace: false,
    scroll: 'preserve'
  }
});
```

## 🔗 Link Navigation

### React

```tsx
import { useLink } from '@westacks/vortex/react';

export default function Navigation() {
  return (
    <nav>
      <a href="/about" ref={useLink('/about')}>About</a>
      <a href="/users" ref={useLink('/users')}>Users</a>
      <button ref={useLink('/dashboard')}>Dashboard</button>
    </nav>
  );
}
```

### Vue

```vue
<template>
  <nav>
    <a href="/about" v-link="/about">About</a>
    <a href="/users" v-link="/users">Users</a>
    <button v-link="/dashboard">Dashboard</button>
  </nav>
</template>

<script setup>
import { vortex } from '@westacks/vortex/vue';
vortex.install(app);
</script>
```

### Svelte

```svelte
<script>
  import { link } from '@westacks/vortex/svelte';
</script>

<nav>
  <a href="/about" use:link="/about">About</a>
  <a href="/users" use:link="/users">Users</a>
  <button use:link="/dashboard">Dashboard</button>
</nav>
```

### SolidJS

```tsx
import { link } from '@westacks/vortex/solid-js';

export default function Navigation() {
  return (
    <nav>
      <a href="/about" use:link="/about">About</a>
      <a href="/users" use:link="/users">Users</a>
      <button use:link="/dashboard">Dashboard</button>
    </nav>
  );
}
```

### Configuration Options

```ts
// Basic usage
use:link="/about"

// With options
use:link={{
  url: '/users',
  method: 'POST',
  data: { role: 'admin' },
  prefetch: 'hover'
}}

// Prefetch options
use:link={{
  url: '/dashboard',
  prefetch: ['hover', 'click'],
  cacheFor: '5m'
}}
```

## 📱 Advanced Navigation Patterns

### Programmatic Navigation

```ts
import { axios } from '@westacks/vortex';

// Navigation with custom logic
const navigateToUser = async (userId: string, options = {}) => {
  try {
    // Pre-fetch user data
    await axios.get(`/api/users/${userId}/preview`, { prefetch: true });
    
    // Navigate to user page
    await axios.get(`/users/${userId}`, {
      vortex: {
        preserve: options.preserve || false,
        scroll: options.scroll || 'top'
      }
    });
  } catch (error) {
    console.error('Navigation failed:', error);
    
    // Fallback to error page
    await axios.get('/error', {
      vortex: { replace: true }
    });
  }
};

// Usage
await navigateToUser('123', { preserve: true });
```

### Conditional Navigation

```ts
import { axios } from '@westacks/vortex';

const navigateWithPermission = async (url: string, requiredPermission: string) => {
  const user = getCurrentUser(); // Your user state
  
  if (user.hasPermission(requiredPermission)) {
    await axios.get(url);
  } else {
    // Redirect to access denied page
    await axios.get('/access-denied', {
      vortex: { replace: true }
    });
  }
};

// Usage
await navigateWithPermission('/admin/users', 'manage_users');
```

### Navigation Guards

```ts
import { axios } from '@westacks/vortex';

// Create navigation guard
const createNavigationGuard = (condition: () => boolean, redirectUrl: string) => {
  return async (url: string, options = {}) => {
    if (condition()) {
      await axios.get(url, options);
    } else {
      await axios.get(redirectUrl, {
        ...options,
        vortex: { replace: true }
      });
    }
  };
};

// Authentication guard
const requireAuth = createNavigationGuard(
  () => isAuthenticated(),
  '/login'
);

// Role-based guard
const requireRole = (role: string) => createNavigationGuard(
  () => hasRole(role),
  '/access-denied'
);

// Usage
await requireAuth('/dashboard');
await requireRole('admin')('/admin/users');
```

## 🔄 State Management During Navigation

### Preserving State

```ts
import { axios } from '@westacks/vortex';
import { useRemember } from '@westacks/vortex';

// Remember form state across navigation
const formData = useRemember({
  name: '',
  email: '',
  message: ''
}, 'contact-form');

// Navigate while preserving state
const navigateToPreview = async () => {
  await axios.get('/contact/preview', {
    vortex: { preserve: true }
  });
};

// Form state is automatically preserved
```

### State Cleanup

```ts
import { axios } from '@westacks/vortex';

// Clean up state before navigation
const navigateWithCleanup = async (url: string, cleanupFn: () => void) => {
  try {
    cleanupFn();
    await axios.get(url);
  } catch (error) {
    console.error('Navigation failed:', error);
  }
};

// Usage
await navigateWithCleanup('/logout', () => {
  // Clear user data
  localStorage.removeItem('auth-token');
  // Reset form state
  form.reset();
});
```

## 🎯 Navigation Events

### Listening to Navigation

```ts
import { axios } from '@westacks/vortex';

// Global navigation event listeners
axios.interceptors.request.use((config) => {
  // Before navigation
  if (config.vortex) {
    console.log('Navigating to:', config.url);
    
    // Emit custom event
    window.dispatchEvent(new CustomEvent('vortex:navigate', {
      detail: { url: config.url, method: config.method }
    }));
  }
  
  return config;
});

axios.interceptors.response.use((response) => {
  // After successful navigation
  if (response.config.vortex) {
    console.log('Navigation completed:', response.config.url);
    
    // Emit custom event
    window.dispatchEvent(new CustomEvent('vortex:navigated', {
      detail: { url: response.config.url, status: response.status }
    }));
  }
  
  return response;
});

// Listen to navigation events
window.addEventListener('vortex:navigate', (event) => {
  console.log('Navigation started:', event.detail);
});

window.addEventListener('vortex:navigated', (event) => {
  console.log('Navigation completed:', event.detail);
});
```

## 🔧 Custom Navigation Handlers

### Custom Navigation Logic

```ts
import { axios } from '@westacks/vortex';

// Custom navigation handler
const customNavigate = async (url: string, options: CustomNavigationOptions) => {
  const {
    method = 'GET',
    data,
    preserve = false,
    replace = false,
    scroll = 'top',
    onBefore,
    onAfter,
    onError
  } = options;

  try {
    // Before navigation hook
    if (onBefore) {
      await onBefore(url, options);
    }

    // Perform navigation
    const response = await axios.request({
      url,
      method,
      data,
      vortex: { preserve, replace, scroll }
    });

    // After navigation hook
    if (onAfter) {
      await onAfter(response, options);
    }

    return response;
  } catch (error) {
    // Error handling
    if (onError) {
      await onError(error, options);
    } else {
      console.error('Navigation failed:', error);
    }
    
    throw error;
  }
};

// Usage
await customNavigate('/users', {
  method: 'POST',
  data: { search: 'john' },
  preserve: true,
  onBefore: async (url) => {
    console.log('About to navigate to:', url);
  },
  onAfter: async (response) => {
    console.log('Navigation completed:', response.config.url);
  },
  onError: async (error) => {
    console.error('Navigation failed:', error);
  }
});
```

### Navigation Middleware

```ts
import { axios } from '@westacks/vortex';

// Navigation middleware
const createNavigationMiddleware = (middleware: NavigationMiddleware) => {
  return async (url: string, options: NavigationOptions) => {
    // Apply middleware
    const processedOptions = await middleware(url, options);
    
    // Perform navigation
    return axios.request({
      url,
      ...processedOptions
    });
  };
};

// Example middleware
const authMiddleware: NavigationMiddleware = async (url, options) => {
  // Check authentication
  if (!isAuthenticated() && requiresAuth(url)) {
    // Redirect to login
    return {
      ...options,
      url: '/login',
      vortex: { replace: true }
    };
  }
  
  return options;
};

const analyticsMiddleware: NavigationMiddleware = async (url, options) => {
  // Track navigation
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url
    });
  }
  
  return options;
};

// Create enhanced navigation function
const navigate = createNavigationMiddleware(
  compose(authMiddleware, analyticsMiddleware)
);

// Usage
await navigate('/dashboard');
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete navigation API documentation
- **[Examples](examples)** - More navigation examples
- **[Form Handling](usage/forms)** - Navigation with forms
- **[Advanced Patterns](advanced)** - Complex navigation patterns
- **[Polling](usage/polling)** - Auto-refresh functionality
- **[Loading When Visible](usage/visible)** - Infinite scroll and lazy loading
- **[Prefetching](usage/prefetching)** - Intelligent page preloading
