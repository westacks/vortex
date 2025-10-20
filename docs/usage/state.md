# State Management

Vortex provides a powerful, signal-based state management system that automatically tracks dependencies and updates your UI when data changes. This system is designed to be simple, performant, and framework-agnostic.

## 🚀 Core Concepts

### What are Signals?

Signals are reactive primitives that hold values and automatically notify subscribers when they change. They're the foundation of Vortex's reactivity system.

```ts
import { signal } from '@westacks/vortex';

// Create a signal with an initial value
const count = signal(0);

// Get the current value
console.log(count.get()); // 0

// Set a new value
count.set(5);
console.log(count.get()); // 5

// Subscribe to changes
const unsubscribe = count.subscribe(value => {
  console.log('Count changed to:', value);
});

// Update the value (triggers subscription)
count.set(10); // Logs: Count changed to: 10

// Clean up subscription
unsubscribe();
```

### Signal Interface

Every signal provides three methods:

```ts
interface Signal<T> {
  get(): T;                                    // Get current value
  set(value: T): void;                        // Set new value
  subscribe(callback: (value: T) => void): () => void; // Subscribe to changes
}
```

## 🔄 Basic Usage

### Simple State

```ts
import { signal } from '@westacks/vortex';

// User state
const user = signal({
  name: 'John Doe',
  email: 'john@example.com',
  isLoggedIn: false
});

// Update user state
user.set({
  ...user.get(),
  isLoggedIn: true
});

// Subscribe to user changes
user.subscribe(userData => {
  console.log('User state updated:', userData);
  updateUI(userData);
});
```

### Counter Example

```tsx
import { signal } from '@westacks/vortex';
import { useEffect } from 'react';

export default function Counter() {
  const count = signal(0);
  
  useEffect(() => {
    // Subscribe to count changes
    const unsubscribe = count.subscribe(value => {
      console.log('Count is now:', value);
    });
    
    // Cleanup subscription
    return unsubscribe;
  }, []);

  const increment = () => count.set(count.get() + 1);
  const decrement = () => count.set(count.get() - 1);
  const reset = () => count.set(0);

  return (
    <div className="counter">
      <h2>Count: {count.get()}</h2>
      <div className="controls">
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
        <button onClick={increment}>+</button>
      </div>
    </div>
  );
}
```

## 🧮 Computed Signals

### Derived State

Computed signals automatically update when their dependencies change:

```ts
import { signal, computed } from '@westacks/vortex';

const firstName = signal('John');
const lastName = signal('Doe');

// Computed signal that automatically updates
const fullName = computed(() => 
  `${firstName.get()} ${lastName.get()}`
);

// Initial value
console.log(fullName.get()); // "John Doe"

// Update dependencies
firstName.set('Jane');
console.log(fullName.get()); // "Jane Doe" (automatically updated)

lastName.set('Smith');
console.log(fullName.get()); // "Jane Smith" (automatically updated)
```

### Complex Computations

```ts
import { signal, computed } from '@westacks/vortex';

const todos = signal([
  { id: 1, text: 'Learn Vortex', completed: false },
  { id: 2, text: 'Build app', completed: true },
  { id: 3, text: 'Deploy', completed: false }
]);

// Computed signals for derived state
const completedTodos = computed(() => 
  todos.get().filter(todo => todo.completed)
);

const pendingTodos = computed(() => 
  todos.get().filter(todo => !todo.completed)
);

const completionRate = computed(() => {
  const total = todos.get().length;
  const completed = completedTodos.get().length;
  return total > 0 ? (completed / total) * 100 : 0;
});

// Subscribe to changes
completionRate.subscribe(rate => {
  console.log(`Completion rate: ${rate.toFixed(1)}%`);
});

// Update todos
todos.set([
  ...todos.get(),
  { id: 4, text: 'Test everything', completed: false }
]);
// Automatically updates all computed signals
```

## 🎯 State Management Patterns

### Store Pattern

Create a centralized store for your application state:

```ts
// store.ts
import { signal } from '@westacks/vortex';

class AppStore {
  // User state
  user = signal({
    id: null,
    name: '',
    email: '',
    isLoggedIn: false
  });

  // App state
  app = signal({
    isLoading: false,
    currentPage: 'home',
    theme: 'light'
  });

  // Data state
  data = signal({
    posts: [],
    comments: [],
    notifications: []
  });

  // Actions
  login = (userData) => {
    this.user.set({
      ...userData,
      isLoggedIn: true
    });
    this.app.set({
      ...this.app.get(),
      currentPage: 'dashboard'
    });
  };

  logout = () => {
    this.user.set({
      id: null,
      name: '',
      email: '',
      isLoggedIn: false
    });
    this.app.set({
      ...this.app.get(),
      currentPage: 'home'
    });
  };

  setLoading = (isLoading) => {
    this.app.set({
      ...this.app.get(),
      isLoading
    });
  };

  addPost = (post) => {
    this.data.set({
      ...this.data.get(),
      posts: [...this.data.get().posts, post]
    });
  };

  updatePost = (id, updates) => {
    this.data.set({
      ...this.data.get(),
      posts: this.data.get().posts.map(post =>
        post.id === id ? { ...post, ...updates } : post
      )
    });
  };
}

export const store = new AppStore();
```

### Using the Store

```tsx
// App.tsx
import { store } from './store';

export default function App() {
  useEffect(() => {
    // Subscribe to user state changes
    const unsubscribeUser = store.user.subscribe(user => {
      if (user.isLoggedIn) {
        console.log('User logged in:', user.name);
      } else {
        console.log('User logged out');
      }
    });

    // Subscribe to app state changes
    const unsubscribeApp = store.app.subscribe(app => {
      console.log('App state changed:', app);
    });

    return () => {
      unsubscribeUser();
      unsubscribeApp();
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
  const user = store.user.get();
  const app = store.app.get();

  return (
    <header className="header">
      <h1>My App</h1>
      <nav>
        <button onClick={() => store.app.set({ ...app, theme: app.theme === 'light' ? 'dark' : 'light' })}>
          Toggle Theme
        </button>
        {user.isLoggedIn ? (
          <button onClick={store.logout}>Logout</button>
        ) : (
          <button onClick={() => store.app.set({ ...app, currentPage: 'login' })}>Login</button>
        )}
      </nav>
    </header>
  );
}
```

## 🔗 Signal Composition

### Combining Signals

```ts
import { signal, computed } from '@westacks/vortex';

const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);

// Combine multiple signals
const userProfile = computed(() => ({
  name: `${firstName.get()} ${lastName.get()}`,
  age: age.get(),
  isAdult: age.get() >= 18,
  initials: `${firstName.get()[0]}${lastName.get()[0]}`
}));

// Subscribe to combined state
userProfile.subscribe(profile => {
  console.log('User profile updated:', profile);
});

// Update any dependency
firstName.set('Jane'); // Triggers userProfile update
age.set(25);          // Triggers userProfile update
```

### Signal Chains

```ts
import { signal, computed } from '@westacks/vortex';

const searchQuery = signal('');
const searchResults = signal([]);
const isLoading = signal(false);

// Chain of computed signals
const hasResults = computed(() => searchResults.get().length > 0);
const resultCount = computed(() => searchResults.get().length);
const isEmpty = computed(() => !isLoading.get() && !hasResults.get() && searchQuery.get().length > 0);

// Search function
const performSearch = async (query) => {
  if (!query.trim()) {
    searchResults.set([]);
    return;
  }

  isLoading.set(true);
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    searchResults.set(data.results);
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.set([]);
  } finally {
    isLoading.set(false);
  }
};

// Subscribe to search query changes
searchQuery.subscribe(query => {
  performSearch(query);
});
```

## 🎨 UI Integration

### React Integration

```tsx
import { signal, computed } from '@westacks/vortex';
import { useEffect, useState } from 'react';

// Create signals outside component
const counter = signal(0);
const doubled = computed(() => counter.get() * 2);

export default function SignalCounter() {
  const [count, setCount] = useState(counter.get());
  const [doubleValue, setDoubleValue] = useState(doubled.get());

  useEffect(() => {
    // Subscribe to counter changes
    const unsubscribeCounter = counter.subscribe(value => {
      setCount(value);
    });

    // Subscribe to doubled changes
    const unsubscribeDoubled = doubled.subscribe(value => {
      setDoubleValue(value);
    });

    return () => {
      unsubscribeCounter();
      unsubscribeDoubled();
    };
  }, []);

  const increment = () => counter.set(counter.get() + 1);
  const decrement = () => counter.set(counter.get() - 1);

  return (
    <div>
      <h2>Count: {count}</h2>
      <h3>Doubled: {doubleValue}</h3>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <h2>Count: {{ count }}</h2>
    <h3>Doubled: {{ doubled }}</h3>
    <button @click="decrement">-</button>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { signal, computed } from '@westacks/vortex';
import { ref, onMounted, onUnmounted } from 'vue';

// Create signals
const counter = signal(0);
const doubled = computed(() => counter.get() * 2);

// Reactive refs
const count = ref(counter.get());
const doubleValue = ref(doubled.get());

// Subscribe to changes
let unsubscribeCounter, unsubscribeDoubled;

onMounted(() => {
  unsubscribeCounter = counter.subscribe(value => {
    count.value = value;
  });

  unsubscribeDoubled = doubled.subscribe(value => {
    doubleValue.value = value;
  });
});

onUnmounted(() => {
  unsubscribeCounter?.();
  unsubscribeDoubled?.();
});

const increment = () => counter.set(counter.get() + 1);
const decrement = () => counter.set(counter.get() - 1);
</script>
```

### Svelte Integration

```svelte
<script>
  import { signal, computed } from '@westacks/vortex';
  import { onMount, onDestroy } from 'svelte';

  // Create signals
  const counter = signal(0);
  const doubled = computed(() => counter.get() * 2);

  // Reactive variables
  let count = counter.get();
  let doubleValue = doubled.get();

  // Subscribe to changes
  let unsubscribeCounter, unsubscribeDoubled;

  onMount(() => {
    unsubscribeCounter = counter.subscribe(value => {
      count = value;
    });

    unsubscribeDoubled = doubled.subscribe(value => {
      doubleValue = value;
    });
  });

  onDestroy(() => {
    unsubscribeCounter?.();
    unsubscribeDoubled?.();
  });

  const increment = () => counter.set(counter.get() + 1);
  const decrement = () => counter.set(counter.get() - 1);
</script>

<div>
  <h2>Count: {count}</h2>
  <h3>Doubled: {doubleValue}</h3>
  <button on:click={decrement}>-</button>
  <button on:click={increment}>+</button>
</div>
```

## 🔧 Advanced Patterns

### Signal Equality

Customize when signals should trigger updates:

```ts
import { signal } from '@westacks/vortex';

// Custom equality function
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Signal with custom equality
const user = signal({ name: 'John', age: 30 }, deepEqual);

// Only triggers if values are actually different
user.set({ name: 'John', age: 30 }); // No update (same value)
user.set({ name: 'Jane', age: 30 }); // Triggers update
```

### Signal Batching

Batch multiple updates to avoid unnecessary re-renders:

```ts
import { signal } from '@westacks/vortex';

const user = signal({ name: 'John', age: 30, email: 'john@example.com' });

// Batch multiple updates
const updateUser = (updates) => {
  user.set({
    ...user.get(),
    ...updates
  });
};

// Single update instead of multiple
updateUser({
  name: 'Jane',
  age: 25
});
```

### Signal Persistence

Persist signal values across page reloads:

```ts
import { signal } from '@westacks/vortex';

// Load initial value from localStorage
const getInitialValue = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Create persistent signal
const createPersistentSignal = (key, defaultValue) => {
  const sig = signal(getInitialValue(key, defaultValue));
  
  // Subscribe to changes and save to localStorage
  sig.subscribe(value => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  });
  
  return sig;
};

// Usage
const theme = createPersistentSignal('app-theme', 'light');
const userPreferences = createPersistentSignal('user-preferences', {});
```

## 🚀 Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need:

```ts
import { signal, computed } from '@westacks/vortex';

const user = signal({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
});

// Only subscribe to specific parts
const userName = computed(() => user.get().name);
const userTheme = computed(() => user.get().preferences.theme);

// Subscribe only to what you need
userName.subscribe(name => {
  document.title = `Welcome, ${name}`;
});

userTheme.subscribe(theme => {
  document.body.className = `theme-${theme}`;
});
```

### Signal Cleanup

Properly clean up subscriptions to prevent memory leaks:

```tsx
import { signal } from '@westacks/vortex';
import { useEffect } from 'react';

export default function UserProfile() {
  const user = signal({ name: '', email: '' });

  useEffect(() => {
    // Load user data
    const loadUser = async () => {
      try {
        const response = await fetch('/api/user');
        const userData = await response.json();
        user.set(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();

    // Subscribe to user changes
    const unsubscribe = user.subscribe(userData => {
      console.log('User updated:', userData);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Component logic...
}
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete signal API documentation
- **[Examples](examples)** - More state management examples
- **[Form Handling](usage/forms)** - Managing form state with signals
- **[Advanced Patterns](advanced)** - Complex state management patterns

Vortex's signal system provides a simple yet powerful foundation for state management. It automatically handles reactivity, dependency tracking, and cleanup, allowing you to focus on building your application logic.
