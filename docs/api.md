# API Reference

This page provides comprehensive documentation for all Vortex APIs, including core functions, utilities, and types.

## 🚀 Core API

### `createVortex(callback)`

The main function to initialize a Vortex application.

**Parameters:**
- `callback` - Function called with Vortex context

**Callback Parameters:**
- `target` - DOM element to mount your application
- `page` - Reactive page state object
- `install` - Function to install extensions
- `ssr` - Boolean indicating if running on server

**Example:**
```ts
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  // Install extensions
  install(inertia(page.get()));
  
  // Your app setup
  const app = document.createElement('div');
  app.textContent = 'Hello Vortex!';
  target.appendChild(app);
});
```

### `createVortexServer(callback)`

Creates a Vortex server instance for SSR.

**Parameters:**
- `callback` - Function to render pages to HTML

**Example:**
```ts
import { createVortexServer } from '@westacks/vortex/server';

createVortexServer(async (page) => {
  const html = await renderComponent(page.component, page.props);
  return { html };
});
```

## 📡 Navigation & HTTP

### `axios`

Vortex's enhanced Axios instance for making HTTP requests.

**Methods:**
- `axios.get(url, config?)` - GET request
- `axios.post(url, data?, config?)` - POST request
- `axios.put(url, data?, config?)` - PUT request
- `axios.patch(url, data?, config?)` - PATCH request
- `axios.delete(url, config?)` - DELETE request
- `axios.reload(config?)` - Reload current page

**Vortex-specific Config:**
```ts
axios.get('/dashboard', {
  vortex: {
    preserve: true,        // Preserve current state
    replace: false,        // Replace current history entry
    scroll: 'top'          // Scroll behavior: 'top', 'preserve', 'manual'
  }
});
```

**Example:**
```ts
import { axios } from '@westacks/vortex';

// Navigate to new page
await axios.get('/about');

// Submit form data
await axios.post('/users', {
  name: 'John',
  email: 'john@example.com'
});

// Update resource
await axios.patch('/users/123', { name: 'Jane' });

// Delete resource
await axios.delete('/users/123');

// Reload current page
await axios.reload();
```

### `link(url, options?)`

Creates a link element with Vortex navigation.

**Parameters:**
- `url` - Target URL
- `options` - Link options

**Options:**
```ts
interface LinkOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  replace?: boolean;
  preserve?: boolean;
  scroll?: 'top' | 'preserve' | 'manual';
  onClick?: (event: Event) => void;
}
```

**Example:**
```ts
import { link } from '@westacks/vortex';

// Create link element
const linkElement = link('/dashboard', {
  method: 'GET',
  replace: false,
  scroll: 'top'
});

// Use in React
<a href="/dashboard" onClick={(e) => link('/dashboard')(e)}>
  Dashboard
</a>

// Use in Vue
<a href="/dashboard" @click="link('/dashboard')">
  Dashboard
</a>
```

### `visible(element, callback, options?)`

Triggers callback when element becomes visible.

**Parameters:**
- `element` - DOM element to observe
- `callback` - Function called when element is visible
- `options` - Intersection Observer options

**Example:**
```ts
import { visible } from '@westacks/vortex';

const element = document.querySelector('.lazy-content');

visible(element, () => {
  // Load content when visible
  loadContent();
}, {
  threshold: 0.1,
  rootMargin: '50px'
});
```

## 🔄 State Management

### `signal(initialValue, equals?)`

Creates a reactive signal.

**Parameters:**
- `initialValue` - Initial signal value
- `equals` - Optional equality function

**Returns:**
```ts
interface Signal<T> {
  get(): T;
  set(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
}
```

**Example:**
```ts
import { signal } from '@westacks/vortex';

const count = signal(0);
const doubled = signal(() => count.get() * 2);

// Subscribe to changes
const unsubscribe = count.subscribe(value => {
  console.log('Count changed:', value);
});

// Update value
count.set(5);

// Cleanup subscription
unsubscribe();
```

### `computed(computation)`

Creates a computed signal that automatically updates.

**Parameters:**
- `computation` - Function that computes the value

**Example:**
```ts
import { signal, computed } from '@westacks/vortex';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = computed(() => 
  `${firstName.get()} ${lastName.get()}`
);

// fullName automatically updates when firstName or lastName changes
firstName.set('Jane'); // fullName becomes "Jane Doe"
```

## 📝 Form Handling

### `useForm(data, rememberKey?)`

Creates a reactive form with validation and submission handling.

**Parameters:**
- `data` - Initial form data or function returning data
- `rememberKey` - Optional key for state preservation

**Returns:**
```ts
interface VortexForm<T> extends T {
  // Form state
  processing: boolean;
  wasSuccessful: boolean;
  recentlySuccessful: boolean;
  errors: Record<string, string>;
  hasErrors: boolean;
  isDirty: boolean;
  
  // Methods
  data(): T;
  reset(...fields: string[]): this;
  fill(data: T): this;
  defaults(field?: string | Record<string, unknown>, value?: unknown): this;
  clearErrors(...fields: string[]): this;
  setError(field: string, message: string): this;
  
  // HTTP methods
  get(url: string, options?: RouterRequestConfig): Promise<RouterResponse>;
  post(url: string, options?: RouterRequestConfig): Promise<RouterResponse>;
  put(url: string, options?: RouterRequestConfig): Promise<RouterResponse>;
  patch(url: string, options?: RouterRequestConfig): Promise<RouterResponse>;
  delete(url: string, options?: RouterRequestConfig): Promise<RouterResponse>;
}
```

**Example:**
```ts
import { useForm } from '@westacks/vortex';

const form = useForm({
  name: '',
  email: '',
  message: ''
}, 'contact-form'); // Remember key for state preservation

// Form is automatically reactive
form.name = 'John';
form.email = 'john@example.com';

// Submit form
try {
  const response = await form.post('/contact');
  console.log('Form submitted successfully!');
  form.reset(); // Clear form
} catch (error) {
  // Validation errors are automatically set on form.errors
  console.log('Validation errors:', form.errors);
}

// Check form state
if (form.processing) {
  console.log('Form is being submitted...');
}

if (form.hasErrors) {
  console.log('Form has validation errors');
}

if (form.isDirty) {
  console.log('Form has unsaved changes');
}
```

### Form Error Resolution

Customize how errors are extracted from responses:

```ts
import { useForm } from '@westacks/vortex';

// Custom error resolver
useForm.resolveErrors = (response) => {
  if (response.data?.errors) {
    return response.data.errors;
  }
  
  if (response.data?.message) {
    return { general: response.data.message };
  }
  
  return {};
};
```

## 🔄 State Persistence

### `useRemember(data, key)`

Preserves state across page navigation.

**Parameters:**
- `data` - Data to remember
- `key` - Unique key for storage

**Returns:**
```ts
interface Remember<T> {
  get(): T;
  set(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
}
```

**Example:**
```ts
import { useRemember } from '@westacks/vortex';

const rememberedData = useRemember({
  formData: { name: '', email: '' },
  scrollPosition: 0
}, 'user-form');

// Data persists across navigation
rememberedData.set({
  formData: { name: 'John', email: 'john@example.com' },
  scrollPosition: 100
});

// Retrieve remembered data
const data = rememberedData.get();
```

## ⏰ Polling

### `usePoll(interval, config?)`

Creates a polling mechanism for automatic data refresh.

**Parameters:**
- `interval` - Polling interval in milliseconds
- `config` - Polling configuration

**Config Options:**
```ts
interface PollConfig extends RouterRequestConfig {
  autoStart?: boolean;    // Start polling immediately (default: true)
  keepAlive?: boolean;    // Continue polling when tab is hidden (default: false)
}
```

**Returns:**
```ts
interface Poll {
  start(): void;
  stop(): void;
}
```

**Example:**
```ts
import { usePoll } from '@westacks/vortex';

const poll = usePoll(30000, { // 30 seconds
  url: '/api/notifications',
  method: 'GET',
  keepAlive: true
});

// Start polling
poll.start();

// Stop polling
poll.stop();

// Poll automatically starts when created
// You can control it manually if autoStart: false
```

## 🔗 Prefetching

### `prefetch`

Built-in extension for intelligent page preloading.

**Usage:**
```ts
import { createVortex } from '@westacks/vortex';
import { prefetch } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  install(prefetch);
  // Your app setup...
});
```

**Prefetch a specific URL:**
```ts
import { axios } from '@westacks/vortex';

// Prefetch a page
await axios.get('/dashboard', { prefetch: true });

// Prefetch with custom TTL
await axios.get('/dashboard', { 
  prefetch: { ttl: 60000, stale: 300000 } // 1min TTL, 5min stale
});
```

## 🎯 Page Management

### `getPage()`

Gets the current page data.

**Returns:**
```ts
interface Page {
  component: string;
  props?: Record<string, any>;
  url: string;
  version?: string;
}
```

**Example:**
```ts
import { getPage } from '@westacks/vortex';

const currentPage = getPage();
console.log('Current page:', currentPage.component);
console.log('Page props:', currentPage.props);
```

### `setPage(updater)`

Updates the current page data.

**Parameters:**
- `updater` - Function or value to update page

**Example:**
```ts
import { setPage, getPage } from '@westacks/vortex';

// Update with function
setPage(page => ({
  ...page,
  component: 'Loading'
}));

// Update with value
setPage({
  component: 'Error',
  props: { message: 'Something went wrong' }
});
```

## 🔌 Extension API

### `VortexExtension`

Interface for creating custom extensions.

**Type:**
```ts
type VortexExtension = (context: VortexContext) => (() => void) | void;

interface VortexContext {
  request: AxiosInterceptorManager;
  response: AxiosInterceptorManager;
  page: Signal<Page>;
}
```

**Example:**
```ts
import type { VortexExtension } from '@westacks/vortex';

const loggingExtension: VortexExtension = ({ request, response }) => {
  // Log all requests
  const req = request.use(
    (config) => {
      console.log('Request:', config.method, config.url);
      return config;
    }
  );

  // Log all responses
  const res = response.use(
    (response) => {
      console.log('Response:', response.status, response.config.url);
      return response;
    }
  );

  // Return cleanup function
  return () => {
    request.eject(req);
    response.eject(res);
  };
};
```

## 📊 Types

### Core Types

```ts
// Page data
interface Page {
  component: string;
  props?: Record<string, any>;
  url: string;
  version?: string;
}

// HTTP request config
interface RouterRequestConfig {
  url?: string;
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
  vortex?: {
    preserve?: boolean;
    replace?: boolean;
    scroll?: 'top' | 'preserve' | 'manual';
  };
  prefetch?: boolean | {
    ttl: number;
    stale?: number;
  };
}

// HTTP response
interface RouterResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RouterRequestConfig;
}

// Vortex configuration
interface VortexConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

## 🚀 Advanced Usage

### Custom Axios Instance

```ts
import { axios } from '@westacks/vortex';

// Create custom instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'X-API-Version': 'v1'
  }
});

// Use custom instance
await api.get('/users');
```

### Error Handling

```ts
import { axios } from '@westacks/vortex';

// Global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Request/Response Transformers

```ts
import { axios } from '@westacks/vortex';

// Transform request data
axios.interceptors.request.use((config) => {
  if (config.data) {
    config.data = JSON.stringify(config.data);
  }
  return config;
});

// Transform response data
axios.interceptors.response.use((response) => {
  if (response.data?.data) {
    response.data = response.data.data;
  }
  return response;
});
```

## 🔍 Debugging

### Enable Debug Logging

```ts
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  if (process.env.NODE_ENV === 'development') {
    // Enable debug logging
    console.log('Vortex initialized in debug mode');
    
    // Log page changes
    page.subscribe(pageData => {
      console.log('Page changed:', pageData);
    });
  }
  
  // Your app setup...
});
```

### Performance Monitoring

```ts
import { axios } from '@westacks/vortex';

// Monitor request performance
axios.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

axios.interceptors.response.use((response) => {
  const duration = Date.now() - response.config.metadata.startTime;
  console.log(`Request to ${response.config.url} took ${duration}ms`);
  return response;
});
```

This API reference covers all the core functionality of Vortex. For framework-specific APIs, see the individual framework documentation pages.
