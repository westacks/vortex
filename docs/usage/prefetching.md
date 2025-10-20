# Prefetching

Vortex provides intelligent prefetching capabilities to improve user experience by loading pages and data before they're needed. This includes built-in prefetching with the `link` action and programmatic prefetching with Axios.

## 🚀 Basic Usage

### Prefetching with Links

```ts
import { link } from '@westacks/vortex';

// Prefetch on hover (default)
<a href="/about" use:link={{ prefetch: 'hover' }}>About</a>

// Prefetch on click
<button use:link={{ prefetch: 'click' }}>Users</button>

// Prefetch on mount
<div use:link={{ prefetch: 'mount' }}>Load immediately</div>

// Multiple prefetch methods
<a href="/dashboard" use:link={{ 
  prefetch: ['hover', 'click'] 
}}>Dashboard</a>
```

### Programmatic Prefetching

```ts
import { axios } from '@westacks/vortex';

// Basic prefetch
await axios.get('/dashboard', { prefetch: true });

// Prefetch with cache duration
await axios.get('/users', { prefetch: '5m' });  // Cache for 5 minutes
```

## ⚙️ Configuration Options

### Prefetch Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `hover` | Prefetch when user hovers over element | Navigation links, buttons |
| `click` | Prefetch when user clicks element | Important actions |
| `mount` | Prefetch when element mounts | Critical pages |

### Cache Duration

```ts
// Time-based caching
await axios.get('/profile', { prefetch: '30s' });   // 30 seconds
await axios.get('/settings', { prefetch: '2m' });   // 2 minutes
await axios.get('/dashboard', { prefetch: '1h' });  // 1 hour
await axios.get('/reports', { prefetch: '1d' });    // 1 day

// No caching
await axios.get('/live-data', { prefetch: false });
```

### Advanced Caching

```ts
// TTL and stale-while-revalidate
await axios.get('/profile', { 
  prefetch: ['30s', '2m']  // TTL: 30s, stale: 2m
});

// Custom cache configuration
await axios.get('/data', { 
  prefetch: {
    ttl: '1m',
    stale: '5m'
  }
});
```

## 🎯 Use Cases

### Navigation Prefetching

```tsx
import { link } from '@westacks/vortex';

export default function Navigation() {
  return (
    <nav>
      {/* Prefetch on hover for better UX */}
      <a href="/dashboard" use:link={{ prefetch: 'hover' }}>
        Dashboard
      </a>
      
      {/* Prefetch on click for important pages */}
      <a href="/profile" use:link={{ prefetch: 'click' }}>
        Profile
      </a>
      
      {/* Prefetch immediately for critical pages */}
      <a href="/settings" use:link={{ prefetch: 'mount' }}>
        Settings
      </a>
    </nav>
  );
}
```

### Conditional Prefetching

```tsx
import { link } from '@westacks/vortex';

export default function SmartNavigation({ userRole }) {
  const getPrefetchConfig = (page) => {
    switch (page) {
      case '/admin':
        return userRole === 'admin' ? 'hover' : false;
      case '/dashboard':
        return 'hover'; // Always prefetch
      case '/profile':
        return 'click'; // Prefetch on click
      default:
        return false;
    }
  };

  return (
    <nav>
      <a href="/dashboard" use:link={{ prefetch: getPrefetchConfig('/dashboard') }}>
        Dashboard
      </a>
      
      {userRole === 'admin' && (
        <a href="/admin" use:link={{ prefetch: getPrefetchConfig('/admin') }}>
          Admin
        </a>
      )}
      
      <a href="/profile" use:link={{ prefetch: getPrefetchConfig('/profile') }}>
        Profile
      </a>
    </nav>
  );
}
```

### Bulk Prefetching

```ts
import { axios } from '@westacks/vortex';

// Prefetch multiple pages
const prefetchPages = async () => {
  const pages = [
    { url: '/dashboard', cache: '1m' },
    { url: '/profile', cache: '5m' },
    { url: '/settings', cache: '10m' }
  ];

  await Promise.allSettled(
    pages.map(page => 
      axios.get(page.url, { prefetch: page.cache })
    )
  );
};

// Prefetch on app load
useEffect(() => {
  prefetchPages();
}, []);
```

### Progressive Prefetching

```ts
import { axios } from '@westacks/vortex';

// Prefetch based on user behavior
const prefetchBasedOnBehavior = async (userBehavior) => {
  switch (userBehavior) {
    case 'browsing':
      // Prefetch related content
      await axios.get('/related-posts', { prefetch: '2m' });
      break;
      
    case 'searching':
      // Prefetch search results
      await axios.get('/search-suggestions', { prefetch: '1m' });
      break;
      
    case 'checkout':
      // Prefetch payment pages
      await axios.get('/payment-methods', { prefetch: '5m' });
      break;
  }
};
```

## 🔄 Advanced Patterns

### Smart Prefetching

```ts
import { axios } from '@westacks/vortex';

class SmartPrefetcher {
  constructor() {
    this.prefetchQueue = new Map();
    this.maxConcurrent = 3;
    this.currentPrefetching = 0;
  }

  async prefetch(url, options = {}) {
    if (this.prefetchQueue.has(url)) {
      return; // Already queued
    }

    this.prefetchQueue.set(url, options);
    await this.processQueue();
  }

  async processQueue() {
    if (this.currentPrefetching >= this.maxConcurrent) {
      return;
    }

    for (const [url, options] of this.prefetchQueue) {
      if (this.currentPrefetching >= this.maxConcurrent) {
        break;
      }

      this.prefetchQueue.delete(url);
      this.currentPrefetching++;

      try {
        await axios.get(url, { prefetch: options.cache || '1m' });
      } catch (error) {
        console.warn(`Prefetch failed for ${url}:`, error);
      } finally {
        this.currentPrefetching--;
      }
    }

    // Process more if queue has items
    if (this.prefetchQueue.size > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
}

// Usage
const prefetcher = new SmartPrefetcher();
prefetcher.prefetch('/dashboard', { cache: '2m' });
prefetcher.prefetch('/profile', { cache: '5m' });
```

### Predictive Prefetching

```ts
import { axios } from '@westacks/vortex';

class PredictivePrefetcher {
  constructor() {
    this.userPatterns = new Map();
    this.prefetchHistory = new Set();
  }

  recordNavigation(from, to) {
    if (!this.userPatterns.has(from)) {
      this.userPatterns.set(from, new Map());
    }
    
    const patterns = this.userPatterns.get(from);
    patterns.set(to, (patterns.get(to) || 0) + 1);
  }

  async predictAndPrefetch(currentPage) {
    const patterns = this.userPatterns.get(currentPage);
    if (!patterns) return;

    // Sort by frequency
    const sortedPatterns = Array.from(patterns.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Top 3 most likely

    for (const [nextPage, frequency] of sortedPatterns) {
      if (frequency > 2 && !this.prefetchHistory.has(nextPage)) {
        await axios.get(nextPage, { prefetch: '1m' });
        this.prefetchHistory.add(nextPage);
      }
    }
  }
}

// Usage
const predictor = new PredictivePrefetcher();

// Record user navigation
predictor.recordNavigation('/dashboard', '/profile');
predictor.recordNavigation('/dashboard', '/settings');

// Predict and prefetch
await predictor.predictAndPrefetch('/dashboard');
```

### Adaptive Prefetching

```ts
import { axios } from '@westacks/vortex';

class AdaptivePrefetcher {
  constructor() {
    this.networkSpeed = 'fast'; // fast, medium, slow
    this.userPreference = 'balanced'; // aggressive, balanced, conservative
    this.batteryLevel = 1.0;
  }

  getPrefetchConfig() {
    let prefetch = false;
    let cache = '1m';

    // Adjust based on network speed
    if (this.networkSpeed === 'fast') {
      prefetch = true;
      cache = '5m';
    } else if (this.networkSpeed === 'medium') {
      prefetch = 'hover';
      cache = '2m';
    } else {
      prefetch = 'click';
      cache = '1m';
    }

    // Adjust based on user preference
    if (this.userPreference === 'aggressive') {
      prefetch = true;
      cache = '10m';
    } else if (this.userPreference === 'conservative') {
      prefetch = 'click';
      cache = '30s';
    }

    // Adjust based on battery level
    if (this.batteryLevel < 0.2) {
      prefetch = false;
    }

    return { prefetch, cache };
  }

  async prefetch(url) {
    const config = this.getPrefetchConfig();
    
    if (config.prefetch) {
      await axios.get(url, { prefetch: config.cache });
    }
  }
}

// Usage
const adaptivePrefetcher = new AdaptivePrefetcher();

// Update conditions
navigator.connection?.addEventListener('change', () => {
  adaptivePrefetcher.networkSpeed = navigator.connection.effectiveType;
});

navigator.getBattery?.().then(battery => {
  adaptivePrefetcher.batteryLevel = battery.level;
  battery.addEventListener('levelchange', () => {
    adaptivePrefetcher.batteryLevel = battery.level;
  });
});

// Prefetch with adaptive settings
await adaptivePrefetcher.prefetch('/dashboard');
```

## 🎛️ Lifecycle Management

### Component Lifecycle

```tsx
import { link } from '@westacks/vortex';

export default function LifecycleExample() {
  useEffect(() => {
    // Component mounted - prefetch related content
    const prefetchRelated = async () => {
      await axios.get('/related-content', { prefetch: '2m' });
    };
    
    prefetchRelated();
  }, []);

  return (
    <div>
      <a href="/next-page" use:link={{ prefetch: 'hover' }}>
        Next Page
      </a>
    </div>
  );
}
```

### App Lifecycle

```ts
import { axios } from '@westacks/vortex';

// Prefetch critical pages on app load
const prefetchCriticalPages = async () => {
  const criticalPages = [
    '/dashboard',
    '/profile',
    '/settings'
  ];

  await Promise.allSettled(
    criticalPages.map(page => 
      axios.get(page, { prefetch: '5m' })
    )
  );
};

// Prefetch on route change
const prefetchOnRouteChange = async (currentRoute) => {
  const routePrefetchMap = {
    '/dashboard': ['/profile', '/settings'],
    '/profile': ['/settings', '/dashboard'],
    '/settings': ['/dashboard', '/profile']
  };

  const pagesToPrefetch = routePrefetchMap[currentRoute] || [];
  
  await Promise.allSettled(
    pagesToPrefetch.map(page => 
      axios.get(page, { prefetch: '2m' })
    )
  );
};
```

## 🚨 Error Handling

### Prefetch Error Handling

```ts
import { axios } from '@westacks/vortex';

// Handle prefetch errors gracefully
const safePrefetch = async (url, options = {}) => {
  try {
    await axios.get(url, { prefetch: options.cache || '1m' });
    console.log(`Prefetched: ${url}`);
  } catch (error) {
    console.warn(`Prefetch failed for ${url}:`, error.message);
    
    // Don't retry on client errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return;
    }
    
    // Retry on server errors
    if (error.response?.status >= 500) {
      setTimeout(() => {
        safePrefetch(url, options);
      }, 5000);
    }
  }
};

// Usage
await safePrefetch('/dashboard', { cache: '2m' });
```

### Fallback Prefetching

```ts
import { axios } from '@westacks/vortex';

const prefetchWithFallback = async (primaryUrl, fallbackUrl) => {
  try {
    await axios.get(primaryUrl, { prefetch: '2m' });
  } catch (error) {
    console.warn(`Primary prefetch failed, trying fallback:`, error.message);
    
    try {
      await axios.get(fallbackUrl, { prefetch: '1m' });
    } catch (fallbackError) {
      console.error('Fallback prefetch also failed:', fallbackError.message);
    }
  }
};

// Usage
await prefetchWithFallback('/dashboard', '/home');
```

## 📱 Performance Considerations

### Memory Management

```ts
import { axios } from '@westacks/vortex';

// Limit prefetch cache size
const prefetchWithLimit = async (url, cache = '1m') => {
  // Check current cache size
  const cacheSize = localStorage.getItem('prefetch-cache-size') || 0;
  const maxCacheSize = 50; // MB
  
  if (parseInt(cacheSize) > maxCacheSize) {
    // Clear old prefetch cache
    localStorage.removeItem('prefetch-cache-size');
    console.warn('Prefetch cache cleared due to size limit');
  }
  
  await axios.get(url, { prefetch: cache });
  
  // Update cache size
  localStorage.setItem('prefetch-cache-size', 
    parseInt(cacheSize) + 1
  );
};
```

### Network Optimization

```ts
import { axios } from '@westacks/vortex';

// Prefetch with compression
const prefetchCompressed = async (url) => {
  await axios.get(url, {
    prefetch: '2m',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br'
    }
  });
};

// Prefetch with priority
const prefetchWithPriority = async (url, priority = 'low') => {
  const cache = priority === 'high' ? '5m' : '1m';
  
  await axios.get(url, { 
    prefetch: cache,
    headers: {
      'Priority': priority
    }
  });
};

// Usage
await prefetchCompressed('/dashboard');
await prefetchWithPriority('/critical-page', 'high');
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete prefetching API documentation
- **[Examples](examples)** - More prefetching examples
- **[Navigation](usage/navigation)** - Basic navigation concepts
- **[Advanced Patterns](advanced)** - Complex prefetching patterns
