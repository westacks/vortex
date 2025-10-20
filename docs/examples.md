---
outline: deep
---

# Examples & Usage Patterns

This page demonstrates real-world usage patterns and examples for Vortex. Each example shows practical implementations you can adapt for your own applications.

## 🏗️ Basic Application Structure

### Simple Todo App

A complete todo application demonstrating basic Vortex concepts:

```tsx
// App.tsx
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'react-dom/client';
import inertia from '@westacks/vortex/inertia';
import TodoApp from './TodoApp';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()));
  
  const root = createRoot(target);
  root.render(<TodoApp />);
});
```

```tsx
// TodoApp.tsx
import { useState } from 'react';
import { useForm } from '@westacks/vortex';
import { axios } from '@westacks/vortex';

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  
  const form = useForm({
    title: '',
    description: ''
  });

  const addTodo = async () => {
    try {
      const response = await form.post('/todos');
      setTodos([...todos, response.data.todo]);
      form.reset();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id) => {
    await axios.patch(`/todos/${id}/toggle`);
    // Refresh todos
    const response = await axios.get('/todos');
    setTodos(response.data.todos);
  };

  return (
    <div className="todo-app">
      <h1>Todo App</h1>
      
      <form onSubmit={(e) => { e.preventDefault(); addTodo(); }}>
        <input
          type="text"
          placeholder="Todo title"
          value={form.title}
          onChange={(e) => form.title = e.target.value}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => form.description = e.target.value}
        />
        <button type="submit" disabled={form.processing}>
          {form.processing ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      {form.hasErrors && (
        <div className="errors">
          {Object.entries(form.errors).map(([field, error]) => (
            <div key={field} className="error">{error}</div>
          ))}
        </div>
      )}

      <ul className="todos">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.title}</span>
            <p>{todo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 📝 Form Handling Patterns

### Multi-Step Form

A multi-step registration form with state preservation:

```tsx
// RegistrationForm.tsx
import { useForm } from '@westacks/vortex';
import { useState } from 'react';

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  
  // Form with state remembering across navigation
  const form = useForm({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    
    // Step 2: Account Details
    username: '',
    password: '',
    confirmPassword: '',
    
    // Step 3: Preferences
    newsletter: false,
    terms: false
  }, 'registration-form'); // Remember key for state preservation

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        return form.firstName && form.lastName && form.email;
      case 2:
        return form.username && form.password && form.password === form.confirmPassword;
      case 3:
        return form.terms;
      default:
        return true;
    }
  };

  const submit = async () => {
    try {
      await form.post('/register');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="registration-form">
      <div className="steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>Basic Info</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>Account</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>Preferences</div>
      </div>

      {step === 1 && (
        <div className="form-step">
          <h2>Basic Information</h2>
          <input
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => form.firstName = e.target.value}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => form.lastName = e.target.value}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => form.email = e.target.value}
          />
          <button onClick={nextStep}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="form-step">
          <h2>Account Details</h2>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => form.username = e.target.value}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => form.password = e.target.value}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => form.confirmPassword = e.target.value}
          />
          <button onClick={prevStep}>Previous</button>
          <button onClick={nextStep}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="form-step">
          <h2>Preferences</h2>
          <label>
            <input
              type="checkbox"
              checked={form.newsletter}
              onChange={(e) => form.newsletter = e.target.checked}
            />
            Subscribe to newsletter
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => form.terms = e.target.checked}
            />
            I agree to the terms and conditions
          </label>
          <button onClick={prevStep}>Previous</button>
          <button onClick={submit} disabled={form.processing}>
            {form.processing ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      )}

      {form.hasErrors && (
        <div className="errors">
          {Object.entries(form.errors).map(([field, error]) => (
            <div key={field} className="error">{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### File Upload Form

Handling file uploads with progress tracking:

```tsx
// FileUploadForm.tsx
import { useForm } from '@westacks/vortex';
import { useState } from 'react';

export default function FileUploadForm() {
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const form = useForm({
    title: '',
    description: '',
    files: []
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    form.files = files;
  };

  const upload = async () => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      
      form.files.forEach(file => {
        formData.append('files[]', file);
      });

      // Upload with progress tracking
      await form.post('/upload', {
        data: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });

      // Reset form after successful upload
      form.reset();
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="file-upload">
      <h2>Upload Files</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); upload(); }}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => form.title = e.target.value}
        />
        
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => form.description = e.target.value}
        />
        
        <input
          type="file"
          multiple
          onChange={handleFileChange}
        />
        
        {uploadProgress > 0 && (
          <div className="progress">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            />
            <span>{uploadProgress}%</span>
          </div>
        )}
        
        <button type="submit" disabled={form.processing}>
          {form.processing ? 'Uploading...' : 'Upload Files'}
        </button>
      </form>
    </div>
  );
}
```

## 🔄 State Management Patterns

### Shopping Cart with Signals

Using Vortex signals for reactive state management:

```tsx
// ShoppingCart.tsx
import { signal, computed } from '@westacks/vortex';
import { useEffect } from 'react';

export default function ShoppingCart() {
  // Cart state using signals
  const cart = signal([]);
  const isLoading = signal(false);
  
  // Computed values
  const cartTotal = computed(() => 
    cart.get().reduce((total, item) => total + (item.price * item.quantity), 0)
  );
  
  const itemCount = computed(() => 
    cart.get().reduce((count, item) => count + item.quantity, 0)
  );

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    isLoading.set(true);
    try {
      const response = await fetch('/api/cart');
      const cartData = await response.json();
      cart.set(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      isLoading.set(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });
      
      if (response.ok) {
        await loadCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      
      if (response.ok) {
        await loadCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  if (isLoading.get()) {
    return <div>Loading cart...</div>;
  }

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({itemCount.get()} items)</h2>
      
      {cart.get().length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.get().map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>${item.price}</p>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <h3>Total: ${cartTotal.get().toFixed(2)}</h3>
            <button className="checkout-btn">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}
```

## 📡 Navigation & API Patterns

### Data Fetching with Polling

Implementing real-time data updates:

```tsx
// LiveDashboard.tsx
import { usePoll } from '@westacks/vortex';
import { signal } from '@westacks/vortex';
import { useEffect } from 'react';

export default function LiveDashboard() {
  const stats = signal({
    users: 0,
    orders: 0,
    revenue: 0,
    lastUpdated: null
  });

  // Poll for updates every 30 seconds
  const poll = usePoll(30000, {
    url: '/api/dashboard/stats',
    method: 'GET',
    keepAlive: true // Continue polling even when tab is hidden
  });

  useEffect(() => {
    // Load initial data
    loadStats();
    
    // Start polling
    poll.start();
    
    // Cleanup on unmount
    return () => poll.stop();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      stats.set({
        ...data,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const refreshNow = () => {
    loadStats();
  };

  return (
    <div className="live-dashboard">
      <div className="dashboard-header">
        <h1>Live Dashboard</h1>
        <div className="controls">
          <button onClick={refreshNow}>Refresh Now</button>
          <button onClick={() => poll.stop()}>Stop Updates</button>
          <button onClick={() => poll.start()}>Start Updates</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Users</h3>
          <div className="stat-value">{stats.get().users}</div>
        </div>
        
        <div className="stat-card">
          <h3>Orders Today</h3>
          <div className="stat-value">{stats.get().orders}</div>
        </div>
        
        <div className="stat-card">
          <h3>Revenue</h3>
          <div className="stat-value">${stats.get().revenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="last-updated">
        Last updated: {stats.get().lastUpdated?.toLocaleTimeString()}
      </div>
    </div>
  );
}
```

### Search with Debouncing

Implementing search functionality with debounced API calls:

```tsx
// SearchComponent.tsx
import { signal } from '@westacks/vortex';
import { useEffect, useRef } from 'react';

export default function SearchComponent() {
  const searchQuery = signal('');
  const searchResults = signal([]);
  const isLoading = signal(false);
  const debounceTimeout = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (searchQuery.get().trim()) {
      debounceTimeout.current = setTimeout(() => {
        performSearch();
      }, 300); // 300ms delay
    } else {
      searchResults.set([]);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery.get()]);

  const performSearch = async () => {
    if (!searchQuery.get().trim()) return;

    isLoading.set(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.get())}`);
      const data = await response.json();
      searchResults.set(data.results);
    } catch (error) {
      console.error('Search failed:', error);
      searchResults.set([]);
    } finally {
      isLoading.set(false);
    }
  };

  const handleSearchChange = (e) => {
    searchQuery.set(e.target.value);
  };

  return (
    <div className="search-component">
      <div className="search-input">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery.get()}
          onChange={handleSearchChange}
        />
        {isLoading.get() && <div className="spinner" />}
      </div>

      {searchResults.get().length > 0 && (
        <div className="search-results">
          {searchResults.get().map(result => (
            <div key={result.id} className="search-result">
              <h3>{result.title}</h3>
              <p>{result.excerpt}</p>
              <a href={result.url}>Read more</a>
            </div>
          ))}
        </div>
      )}

      {searchQuery.get() && !isLoading.get() && searchResults.get().length === 0 && (
        <div className="no-results">
          No results found for "{searchQuery.get()}"
        </div>
      )}
    </div>
  );
}
```

## 🎨 Advanced Patterns

### Custom Extension for Analytics

Creating a custom extension for tracking user interactions:

```ts
// analytics-extension.ts
import type { VortexExtension } from '@westacks/vortex';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

const analyticsExtension: VortexExtension = ({ request, response }) => {
  const events: AnalyticsEvent[] = [];
  
  // Track page views
  const trackPageView = (url: string) => {
    events.push({
      event: 'page_view',
      properties: { url },
      timestamp: Date.now()
    });
  };

  // Track form submissions
  const trackFormSubmission = (url: string, method: string) => {
    events.push({
      event: 'form_submission',
      properties: { url, method },
      timestamp: Date.now()
    });
  };

  // Add request interceptor to track form submissions
  const req = request.use(
    (config) => {
      if (['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
        trackFormSubmission(config.url || '', config.method || '');
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to track page views
  const res = response.use(
    (response) => {
      if (response.config.method?.toLowerCase() === 'get') {
        trackPageView(response.config.url || '');
      }
      return response;
    },
    (error) => Promise.reject(error)
  );

  // Batch send events to analytics service
  const sendEvents = async () => {
    if (events.length === 0) return;

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [...events] })
      });
      
      // Clear sent events
      events.length = 0;
    } catch (error) {
      console.error('Failed to send analytics events:', error);
    }
  };

  // Send events every 30 seconds
  const interval = setInterval(sendEvents, 30000);

  // Send events on page unload
  window.addEventListener('beforeunload', sendEvents);

  return () => {
    request.eject(req);
    response.eject(res);
    clearInterval(interval);
    window.removeEventListener('beforeunload', sendEvents);
    
    // Send remaining events
    sendEvents();
  };
};

export default analyticsExtension;
```

### Using the Analytics Extension

```tsx
// App.tsx
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import analyticsExtension from './extensions/analytics-extension';

createVortex(async (target, page, install, ssr) => {
  install(inertia(page.get()), analyticsExtension);
  
  // Your app setup...
});
```

## 📱 Progressive Enhancement

### Fallback for Non-JS Users

```tsx
// ProgressiveApp.tsx
import { createVortex } from '@westacks/vortex';
import { createRoot } from 'react-dom/client';

export default function ProgressiveApp() {
  // Check if Vortex is available
  if (typeof createVortex === 'undefined') {
    // Fallback to traditional navigation
    return <TraditionalNavigation />;
  }

  return <VortexApp />;
}

function TraditionalNavigation() {
  return (
    <div className="traditional-nav">
      <p>JavaScript is required for the enhanced experience.</p>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </div>
  );
}

function VortexApp() {
  return (
    <div className="vortex-app">
      {/* Your Vortex-powered app */}
    </div>
  );
}
```

## 🔗 Next Steps

These examples demonstrate the core patterns and capabilities of Vortex. For more advanced usage:

- **[API Reference](api)** - Complete API documentation
- **[Extensions](extensions)** - Built-in and custom extensions
- **[Advanced Usage](advanced)** - Advanced patterns and techniques
- **[Migration Guide](migration)** - Moving from other frameworks

Each example can be adapted and extended for your specific use case. The key is to leverage Vortex's reactive system and server-driven approach to create fast, maintainable applications.
