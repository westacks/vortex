# Advanced Usage & Patterns

This guide covers advanced patterns and techniques for experienced Vortex users. These patterns will help you build complex, performant applications while maintaining clean, maintainable code.

## 🏗️ Advanced Architecture Patterns

### Multi-Layer State Management

Create a sophisticated state management system with multiple layers:

```ts
// store/index.ts
import { signal, computed } from '@westacks/vortex';

// Base store class
abstract class BaseStore {
  protected abstract getInitialState(): any;
  
  protected createSignal<T>(initialValue: T) {
    return signal(initialValue);
  }
  
  protected createComputed<T>(computation: () => T) {
    return computed(computation);
  }
  
  abstract reset(): void;
}

// User store
class UserStore extends BaseStore {
  private user = this.createSignal({
    id: null,
    name: '',
    email: '',
    isLoggedIn: false,
    preferences: {}
  });
  
  private permissions = this.createSignal<string[]>([]);
  
  // Computed values
  public readonly isAuthenticated = this.createComputed(() => 
    this.user.get().isLoggedIn
  );
  
  public readonly hasPermission = this.createComputed(() => 
    (permission: string) => this.permissions.get().includes(permission)
  );
  
  public readonly userProfile = this.createComputed(() => {
    const user = this.user.get();
    return {
      displayName: user.name || user.email,
      initials: user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U',
      isAdmin: this.hasPermission.get()('admin')
    };
  });
  
  // Actions
  public login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.user.set({
          ...userData,
          isLoggedIn: true
        });
        
        // Load permissions
        await this.loadPermissions();
        
        return { success: true };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  public logout = () => {
    this.user.set({
      id: null,
      name: '',
      email: '',
      isLoggedIn: false,
      preferences: {}
    });
    this.permissions.set([]);
  };
  
  public updateProfile = (updates: Partial<typeof this.user.get()>) => {
    this.user.set({
      ...this.user.get(),
      ...updates
    });
  };
  
  private loadPermissions = async () => {
    try {
      const response = await fetch('/api/user/permissions');
      const permissions = await response.json();
      this.permissions.set(permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };
  
  public reset() {
    this.user.set(this.getInitialState());
    this.permissions.set([]);
  }
  
  protected getInitialState() {
    return {
      id: null,
      name: '',
      email: '',
      isLoggedIn: false,
      preferences: {}
    };
  }
  
  // Public getters
  public get userSignal() { return this.user; }
  public get permissionsSignal() { return this.permissions; }
}

// App store
class AppStore extends BaseStore {
  private theme = this.createSignal('light');
  private sidebar = this.createSignal({ isOpen: true, width: 250 });
  private notifications = this.createSignal<Notification[]>([]);
  
  // Computed values
  public readonly isDarkMode = this.createComputed(() => 
    this.theme.get() === 'dark'
  );
  
  public readonly sidebarState = this.createComputed(() => ({
    ...this.sidebar.get(),
    isCollapsed: this.sidebar.get().width < 100
  }));
  
  public readonly unreadNotifications = this.createComputed(() => 
    this.notifications.get().filter(n => !n.read).length
  );
  
  // Actions
  public toggleTheme = () => {
    const newTheme = this.theme.get() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  public toggleSidebar = () => {
    this.sidebar.set({
      ...this.sidebar.get(),
      isOpen: !this.sidebar.get().isOpen
    });
  };
  
  public addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date()
    };
    
    this.notifications.set([...this.notifications.get(), newNotification]);
  };
  
  public markNotificationAsRead = (id: number) => {
    this.notifications.set(
      this.notifications.get().map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
  };
  
  public reset() {
    this.theme.set('light');
    this.sidebar.set({ isOpen: true, width: 250 });
    this.notifications.set([]);
  }
  
  protected getInitialState() {
    return {
      theme: 'light',
      sidebar: { isOpen: true, width: 250 },
      notifications: []
    };
  }
  
  // Public getters
  public get themeSignal() { return this.theme; }
  public get sidebarSignal() { return this.sidebar; }
  public get notificationsSignal() { return this.notifications; }
}

// Root store
class RootStore {
  public user = new UserStore();
  public app = new AppStore();
  
  // Global computed values
  public readonly isReady = computed(() => 
    this.user.isAuthenticated.get() && this.app.themeSignal.get() !== null
  );
  
  public reset() {
    this.user.reset();
    this.app.reset();
  }
}

export const store = new RootStore();
```

### Using the Advanced Store

```tsx
// App.tsx
import { store } from './store';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Subscribe to global state changes
    const unsubscribeReady = store.isReady.subscribe(isReady => {
      if (isReady) {
        console.log('App is ready');
      }
    });
    
    const unsubscribeUser = store.user.userSignal.subscribe(user => {
      if (user.isLoggedIn) {
        console.log('User logged in:', user.name);
      }
    });
    
    return () => {
      unsubscribeReady();
      unsubscribeUser();
    };
  }, []);
  
  return (
    <div className="app">
      <Header />
      <Main />
      <Footer />
    </div>
  );
}

// Header.tsx
export default function Header() {
  const user = store.user.userSignal.get();
  const userProfile = store.user.userProfile.get();
  const sidebar = store.app.sidebarSignal.get();
  const unreadCount = store.app.unreadNotifications.get();
  
  return (
    <header className="header">
      <button onClick={store.app.toggleSidebar}>
        {sidebar.isOpen ? '☰' : '☰'}
      </button>
      
      <h1>My App</h1>
      
      <nav>
        <button onClick={store.app.toggleTheme}>
          {store.app.isDarkMode.get() ? '☀️' : '🌙'}
        </button>
        
        {user.isLoggedIn ? (
          <>
            <span>Welcome, {userProfile.displayName}</span>
            <button onClick={store.user.logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => store.user.login({ email: '', password: '' })}>
            Login
          </button>
        )}
      </nav>
    </header>
  );
}
```

## 🔄 Advanced Signal Patterns

### Signal Composition with Lazy Evaluation

```ts
import { signal, computed } from '@westacks/vortex';

// Lazy signal that only computes when accessed
function createLazySignal<T>(factory: () => T) {
  let value: T | null = null;
  let computed = false;
  
  const sig = signal<T | null>(null);
  
  const get = () => {
    if (!computed) {
      value = factory();
      computed = true;
      sig.set(value);
    }
    return value!;
  };
  
  const reset = () => {
    value = null;
    computed = false;
    sig.set(null);
  };
  
  return {
    get,
    reset,
    subscribe: sig.subscribe
  };
}

// Usage
const expensiveComputation = createLazySignal(() => {
  console.log('Computing expensive value...');
  return Array.from({ length: 1000000 }, (_, i) => i).reduce((a, b) => a + b, 0);
});

// Value is only computed when first accessed
console.log('Before access');
const value = expensiveComputation.get(); // Logs: Computing expensive value...
console.log('After access:', value);
```

### Signal Batching and Debouncing

```ts
import { signal } from '@westacks/vortex';

// Batch multiple signal updates
function createBatchedSignal<T>(initialValue: T, batchDelay: number = 16) {
  const sig = signal(initialValue);
  let batchTimeout: NodeJS.Timeout | null = null;
  let pendingUpdates: T[] = [];
  
  const set = (value: T) => {
    pendingUpdates.push(value);
    
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    
    batchTimeout = setTimeout(() => {
      if (pendingUpdates.length > 0) {
        const latestValue = pendingUpdates[pendingUpdates.length - 1];
        sig.set(latestValue);
        pendingUpdates = [];
      }
    }, batchDelay);
  };
  
  const flush = () => {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    
    if (pendingUpdates.length > 0) {
      const latestValue = pendingUpdates[pendingUpdates.length - 1];
      sig.set(latestValue);
      pendingUpdates = [];
    }
  };
  
  return {
    get: sig.get,
    set,
    flush,
    subscribe: sig.subscribe
  };
}

// Debounced signal
function createDebouncedSignal<T>(initialValue: T, delay: number = 300) {
  const sig = signal(initialValue);
  let timeout: NodeJS.Timeout | null = null;
  
  const set = (value: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      sig.set(value);
    }, delay);
  };
  
  const flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return {
    get: sig.get,
    set,
    flush,
    subscribe: sig.subscribe
  };
}

// Usage
const searchQuery = createDebouncedSignal('', 500);
const formData = createBatchedSignal({ name: '', email: '' });

// Search updates are debounced
searchQuery.set('john');
searchQuery.set('john doe');
searchQuery.set('john doe smith');
// Only the last value is set after 500ms

// Form updates are batched
formData.set({ name: 'John', email: 'john@example.com' });
formData.set({ name: 'John', email: 'john@example.com', role: 'user' });
formData.set({ name: 'John', email: 'john@example.com', role: 'user', status: 'active' });
// All updates are batched and only the final state is applied
```

### Signal Middleware

```ts
import { signal } from '@westacks/vortex';

// Middleware type
type SignalMiddleware<T> = (value: T, next: (value: T) => void) => void;

// Create signal with middleware
function createSignalWithMiddleware<T>(initialValue: T, ...middlewares: SignalMiddleware<T>[]) {
  const sig = signal(initialValue);
  
  const set = (value: T) => {
    let index = 0;
    
    const next = (value: T) => {
      if (index >= middlewares.length) {
        sig.set(value);
        return;
      }
      
      const middleware = middlewares[index++];
      middleware(value, next);
    };
    
    next(value);
  };
  
  return {
    get: sig.get,
    set,
    subscribe: sig.subscribe
  };
}

// Example middleware
const logger = <T>(value: T, next: (value: T) => void) => {
  console.log('Signal value:', value);
  next(value);
};

const validator = <T extends { name?: string }>(value: T, next: (value: T) => void) => {
  if (value.name && value.name.length < 2) {
    console.warn('Name too short');
    return;
  }
  next(value);
};

const transformer = <T extends { name?: string }>(value: T, next: (value: T) => void) => {
  if (value.name) {
    const transformed = {
      ...value,
      name: value.name.trim()
    };
    next(transformed);
  } else {
    next(value);
  }
};

// Usage
const user = createSignalWithMiddleware(
  { name: '', email: '' },
  logger,
  validator,
  transformer
);

user.set({ name: '  john  ', email: 'john@example.com' });
// Logs: Signal value: { name: '  john  ', email: 'john@example.com' }
// Logs: Name too short (if name is too short after trimming)
```

## 🎯 Advanced Form Patterns

### Form Validation with Schemas

```tsx
import { useForm } from '@westacks/vortex';
import { z } from 'zod'; // Zod for schema validation

// Validation schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function ValidatedForm() {
  const form = useForm({
    name: '',
    email: '',
    age: 18,
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      userSchema.parse(form.data());
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await form.post('/users');
      form.reset();
      setValidationErrors({});
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const getFieldError = (field: string) => {
    return validationErrors[field] || form.errors[field];
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => form.name = e.target.value}
        />
        {getFieldError('name') && (
          <span className="error">{getFieldError('name')}</span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => form.email = e.target.value}
        />
        {getFieldError('email') && (
          <span className="error">{getFieldError('email')}</span>
        )}
      </div>

      <div>
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          value={form.age}
          onChange={(e) => form.age = parseInt(e.target.value) || 18}
        />
        {getFieldError('age') && (
          <span className="error">{getFieldError('age')}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => form.password = e.target.value}
        />
        {getFieldError('password') && (
          <span className="error">{getFieldError('password')}</span>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => form.confirmPassword = e.target.value}
        />
        {getFieldError('confirmPassword') && (
          <span className="error">{getFieldError('confirmPassword')}</span>
        )}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Creating User...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Dynamic Form Fields

```tsx
import { useForm } from '@westacks/vortex';
import { useState } from 'react';

interface Field {
  id: string;
  type: 'text' | 'email' | 'number' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

export default function DynamicForm() {
  const [fields, setFields] = useState<Field[]>([
    { id: 'name', type: 'text', label: 'Name', required: true }
  ]);

  const form = useForm({});

  const addField = () => {
    const newField: Field = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    
    setFields([...fields, newField]);
    
    // Initialize form value for new field
    form[newField.id] = '';
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    
    // Remove form value
    delete form[id];
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const renderField = (field: Field) => {
    const value = form[field.id] || '';
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => form[field.id] = e.target.value}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => form[field.id] = e.target.value}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await form.post('/dynamic-form');
      form.reset();
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <div className="dynamic-form">
      <div className="field-editor">
        <h3>Form Fields</h3>
        {fields.map(field => (
          <div key={field.id} className="field-item">
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              placeholder="Field label"
            />
            
            <select
              value={field.type}
              onChange={(e) => updateField(field.id, { type: e.target.value as Field['type'] })}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
            </select>
            
            <label>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
              />
              Required
            </label>
            
            <button type="button" onClick={() => removeField(field.id)}>
              Remove
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addField}>
          Add Field
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-preview">
        <h3>Form Preview</h3>
        
        {fields.map(field => (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
        
        <button type="submit" disabled={form.processing}>
          {form.processing ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
```

## 🔌 Advanced Extension Patterns

### Extension Composition

```ts
import type { VortexExtension } from '@westacks/vortex';

// Base extension with common functionality
function createBaseExtension(options: {
  name: string;
  enabled?: boolean;
  debug?: boolean;
}): VortexExtension {
  return ({ request, response }) => {
    if (!options.enabled) return;
    
    const { name, debug } = options;
    
    if (debug) {
      console.log(`[${name}] Extension initialized`);
    }
    
    // Common request interceptor
    const req = request.use(
      (config) => {
        if (debug) {
          console.log(`[${name}] Request:`, config.method, config.url);
        }
        
        // Add extension identifier
        config.headers = {
          ...config.headers,
          [`X-${name}-Extension`]: 'enabled'
        };
        
        return config;
      },
      (error) => {
        if (debug) {
          console.error(`[${name}] Request error:`, error);
        }
        return Promise.reject(error);
      }
    );
    
    // Common response interceptor
    const res = response.use(
      (response) => {
        if (debug) {
          console.log(`[${name}] Response:`, response.status, response.config.url);
        }
        return response;
      },
      (error) => {
        if (debug) {
          console.error(`[${name}] Response error:`, error);
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      request.eject(req);
      response.eject(res);
      
      if (debug) {
        console.log(`[${name}] Extension cleaned up`);
      }
    };
  };
}

// Authentication extension
function createAuthExtension(options: {
  tokenKey?: string;
  refreshEndpoint?: string;
  onUnauthorized?: () => void;
}): VortexExtension {
  const { tokenKey = 'auth-token', refreshEndpoint = '/api/auth/refresh', onUnauthorized } = options;
  
  return ({ request, response }) => {
    const base = createBaseExtension({ name: 'Auth', enabled: true });
    const cleanup = base({ request, response });
    
    // Add auth header to requests
    const authReq = request.use(
      (config) => {
        const token = localStorage.getItem(tokenKey);
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return config;
      }
    );
    
    // Handle auth errors
    const authRes = response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            // Try to refresh token
            const refreshResponse = await fetch(refreshEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (refreshResponse.ok) {
              const { token } = await refreshResponse.json();
              localStorage.setItem(tokenKey, token);
              
              // Retry original request
              const originalRequest = error.config;
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return request(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
          
          // Clear token and redirect
          localStorage.removeItem(tokenKey);
          onUnauthorized?.();
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      cleanup?.();
      request.eject(authReq);
      response.eject(authRes);
    };
  };
}

// Caching extension
function createCachingExtension(options: {
  ttl?: number;
  maxSize?: number;
  storage?: 'memory' | 'localStorage';
}): VortexExtension {
  const { ttl = 60000, maxSize = 100, storage = 'memory' } = options;
  
  return ({ request, response }) => {
    const base = createBaseExtension({ name: 'Cache', enabled: true });
    const cleanup = base({ request, response });
    
    const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
    
    // Cache responses
    const cacheRes = response.use(
      (response) => {
        if (response.config.method?.toLowerCase() === 'get') {
          const key = `${response.config.method}:${response.config.url}`;
          
          // Clean expired entries
          const now = Date.now();
          for (const [k, v] of cache.entries()) {
            if (now - v.timestamp > v.ttl) {
              cache.delete(k);
            }
          }
          
          // Enforce max size
          if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          
          cache.set(key, {
            data: response.data,
            timestamp: now,
            ttl: ttl
          });
        }
        
        return response;
      }
    );
    
    // Serve cached responses
    const cacheReq = request.use(
      async (config) => {
        if (config.method?.toLowerCase() === 'get' && !config.forceRefresh) {
          const key = `${config.method}:${config.url}`;
          const cached = cache.get(key);
          
          if (cached && Date.now() - cached.timestamp < cached.ttl) {
            // Return cached response
            return Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config
            });
          }
        }
        
        return config;
      }
    );
    
    return () => {
      cleanup?.();
      request.eject(cacheReq);
      response.eject(cacheRes);
      cache.clear();
    };
  };
}

// Usage
const authExtension = createAuthExtension({
  onUnauthorized: () => window.location.href = '/login'
});

const cacheExtension = createCachingExtension({
  ttl: 300000, // 5 minutes
  maxSize: 50
});

// Install extensions
createVortex(async (target, page, install, ssr) => {
  install(authExtension, cacheExtension);
  // Your app setup...
});
```

## 🚀 Performance Optimization

### Signal Memoization

```ts
import { signal, computed } from '@westacks/vortex';

// Memoized computed signal
function createMemoizedSignal<T>(factory: () => T, deps: any[]) {
  let lastDeps: any[] = [];
  let lastValue: T | null = null;
  
  return computed(() => {
    // Check if dependencies changed
    const depsChanged = deps.some((dep, index) => dep !== lastDeps[index]);
    
    if (depsChanged || lastValue === null) {
      lastValue = factory();
      lastDeps = [...deps];
    }
    
    return lastValue;
  });
}

// Usage
const users = signal([]);
const searchQuery = signal('');
const filters = signal({ role: '', status: '' });

// Memoized filtered users
const filteredUsers = createMemoizedSignal(
  () => {
    const query = searchQuery.get().toLowerCase();
    const filter = filters.get();
    
    return users.get().filter(user => {
      const matchesQuery = user.name.toLowerCase().includes(query) ||
                          user.email.toLowerCase().includes(query);
      const matchesRole = !filter.role || user.role === filter.role;
      const matchesStatus = !filter.status || user.status === filter.status;
      
      return matchesQuery && matchesRole && matchesStatus;
    });
  },
  [users.get(), searchQuery.get(), filters.get()]
);
```

### Lazy Loading with Signals

```tsx
import { signal, computed } from '@westacks/vortex';
import { lazy, Suspense } from 'react';

// Lazy load components based on route
const routeComponents = {
  dashboard: lazy(() => import('./pages/Dashboard')),
  users: lazy(() => import('./pages/Users')),
  settings: lazy(() => import('./pages/Settings'))
};

export default function LazyRouter() {
  const currentRoute = signal('dashboard');
  const loadedComponents = signal(new Set(['dashboard']));
  
  // Preload component when route changes
  const preloadComponent = (route: string) => {
    if (!loadedComponents.get().has(route)) {
      // Trigger lazy loading
      routeComponents[route]?.();
      loadedComponents.set(new Set([...loadedComponents.get(), route]));
    }
  };
  
  // Subscribe to route changes
  currentRoute.subscribe(route => {
    preloadComponent(route);
  });
  
  const navigate = (route: string) => {
    currentRoute.set(route);
  };
  
  const currentComponent = computed(() => {
    const route = currentRoute.get();
    const Component = routeComponents[route];
    return Component || routeComponents.dashboard;
  });
  
  return (
    <div>
      <nav>
        <button onClick={() => navigate('dashboard')}>Dashboard</button>
        <button onClick={() => navigate('users')}>Users</button>
        <button onClick={() => navigate('settings')}>Settings</button>
      </nav>
      
      <Suspense fallback={<div>Loading...</div>}>
        {React.createElement(currentComponent.get())}
      </Suspense>
    </div>
  );
}
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete API documentation
- **[Examples](examples)** - More usage examples
- **[Extensions](extensions)** - Built-in and custom extensions
- **[Migration Guide](migration/inertia)** - Moving from other frameworks

These advanced patterns demonstrate the flexibility and power of Vortex. Use them to build sophisticated, performant applications while maintaining clean, maintainable code.
