# Loading When Visible

Vortex provides the `visible` action for automatically loading content when elements become visible in the viewport. This is perfect for infinite scroll, lazy loading, and progressive content loading.

## 🚀 Basic Usage

### Simple Visible Loading

```ts
import { visible } from '@westacks/vortex';

// Load when element becomes visible
<div use:visible="/api/more-data">
  Loading more content...
</div>
```

### Framework-Specific Usage

#### React

```tsx
import { useVisible } from '@westacks/vortex/react';

export default function VisibleComponent() {
  return (
    <div ref={useVisible('/api/data')}>
      Content will load when visible
    </div>
  );
}
```

#### Vue

```vue
<template>
  <div v-visible="/api/data">
    Content will load when visible
  </div>
</template>

<script setup>
import { vortex } from '@westacks/vortex/vue';
vortex.install(app);
</script>
```

#### Svelte

```svelte
<script>
  import { visible } from '@westacks/vortex/svelte';
</script>

<div use:visible="/api/data">
  Content will load when visible
</div>
```

#### SolidJS

```tsx
import { visible } from '@westacks/vortex/solid-js';

export default function VisibleComponent() {
  return (
    <div use:visible="/api/data">
      Content will load when visible
    </div>
  );
}
```

## ⚙️ Configuration Options

### Basic Options

```ts
// Simple usage
use:visible="/api/data"

// With HTTP options
use:visible={{
  url: '/api/users',
  method: 'GET',
  params: { page: 1 }
}}

// With Vortex options
use:visible={{
  url: '/api/posts',
  method: 'POST',
  data: { category: 'news' },
  vortex: { preserve: true }
}}
```

### Visible-Specific Options

```ts
// With buffer for early loading
use:visible={{
  url: '/api/content',
  buffer: 100,  // Load 100px before visible
  always: false  // Only load once
}}

// With custom options
use:visible={{
  url: '/api/data',
  method: 'POST',
  data: { filter: 'active' },
  buffer: 200,    // Load 200px before visible
  always: true    // Keep loading when scrolling back
}}
```

## 🎯 Use Cases

### Infinite Scroll

```tsx
import { visible } from '@westacks/vortex';

export default function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/items?page=${page}`);
      setItems(prev => [...prev, ...response.data]);
      setPage(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="item">
          {item.name}
        </div>
      ))}
      
      {/* Load more when this becomes visible */}
      <div use:visible={{
        url: '/api/items',
        method: 'GET',
        params: { page },
        vortex: { preserve: true }
      }}>
        {loading ? 'Loading...' : 'Load More'}
      </div>
    </div>
  );
}
```

### Lazy Loading Images

```tsx
import { visible } from '@westacks/vortex';

export default function LazyImage({ src, alt, placeholder }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loaded, setLoaded] = useState(false);

  return (
    <div use:visible={{
      url: src,
      method: 'GET',
      responseType: 'blob'
    }}>
      <img
        src={imageSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'loaded' : 'loading'}
      />
    </div>
  );
}
```

### Progressive Content Loading

```tsx
import { visible } from '@westacks/vortex';

export default function ProgressiveContent() {
  const [sections, setSections] = useState([]);

  return (
    <div>
      {/* Load sections progressively as user scrolls */}
      <section use:visible={{
        url: '/api/section/1',
        method: 'GET',
        always: false
      }}>
        <h2>Section 1</h2>
        <p>This content loads when visible</p>
      </section>

      <section use:visible={{
        url: '/api/section/2',
        method: 'GET',
        always: false
      }}>
        <h2>Section 2</h2>
        <p>This content loads when visible</p>
      </section>

      <section use:visible={{
        url: '/api/section/3',
        method: 'GET',
        always: false
      }}>
        <h2>Section 3</h2>
        <p>This content loads when visible</p>
      </section>
    </div>
  );
}
```

### Conditional Loading

```tsx
import { visible } from '@westacks/vortex';

export default function ConditionalLoader({ shouldLoad, category }) {
  if (!shouldLoad) {
    return <div>Loading disabled</div>;
  }

  return (
    <div use:visible={{
      url: '/api/content',
      method: 'POST',
      data: { category },
      buffer: 150,
      always: false
    }}>
      <p>Loading {category} content...</p>
    </div>
  );
}
```

## 🔄 Advanced Patterns

### Chained Loading

```tsx
import { visible } from '@westacks/vortex';

export default function ChainedLoader() {
  const [step1Loaded, setStep1Loaded] = useState(false);
  const [step2Loaded, setStep2Loaded] = useState(false);

  return (
    <div>
      {/* Step 1: Load basic data */}
      <div use:visible={{
        url: '/api/step1',
        method: 'GET',
        always: false
      }}>
        <p>Step 1: Loading basic data...</p>
      </div>

      {/* Step 2: Load detailed data after step 1 */}
      {step1Loaded && (
        <div use:visible={{
          url: '/api/step2',
          method: 'GET',
          always: false
        }}>
          <p>Step 2: Loading detailed data...</p>
        </div>
      )}

      {/* Step 3: Load final data after step 2 */}
      {step2Loaded && (
        <div use:visible={{
          url: '/api/step3',
          method: 'GET',
          always: false
        }}>
          <p>Step 3: Loading final data...</p>
        </div>
      )}
    </div>
  );
}
```

### Adaptive Loading

```tsx
import { visible } from '@westacks/vortex';

export default function AdaptiveLoader({ userPreference }) {
  const getBufferSize = () => {
    switch (userPreference) {
      case 'aggressive':
        return 300;  // Load 300px before visible
      case 'balanced':
        return 150;  // Load 150px before visible
      case 'conservative':
        return 50;   // Load 50px before visible
      default:
        return 100;
    }
  };

  return (
    <div use:visible={{
      url: '/api/adaptive-content',
      method: 'GET',
      buffer: getBufferSize(),
      always: false
    }}>
      <p>Content loads with {getBufferSize()}px buffer</p>
    </div>
  );
}
```

### Loading with Retry

```tsx
import { visible } from '@westacks/vortex';

export default function RetryLoader() {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleError = (error) => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      // Retry after delay
      setTimeout(() => {
        // The visible action will retry automatically
      }, 1000 * (retryCount + 1));
    }
  };

  return (
    <div use:visible={{
      url: '/api/unreliable-endpoint',
      method: 'GET',
      always: false
    }}>
      {retryCount > 0 && (
        <p>Retry attempt {retryCount}/{maxRetries}</p>
      )}
      <p>Loading content...</p>
    </div>
  );
}
```

## 🎛️ Lifecycle Management

### Component Lifecycle

```tsx
import { visible } from '@westacks/vortex';

export default function LifecycleExample() {
  useEffect(() => {
    // Component mounted
    console.log('Component mounted');
    
    return () => {
      // Component unmounting
      console.log('Component unmounting');
    };
  }, []);

  return (
    <div use:visible={{
      url: '/api/data',
      method: 'GET',
      always: false
    }}>
      <p>This content loads when visible</p>
    </div>
  );
}
```

### Multiple Visible Elements

```tsx
import { visible } from '@westacks/vortex';

export default function MultiVisible() {
  return (
    <div>
      {/* Each element loads independently */}
      <div use:visible="/api/section1">
        <h2>Section 1</h2>
      </div>

      <div use:visible="/api/section2">
        <h2>Section 2</h2>
      </div>

      <div use:visible="/api/section3">
        <h2>Section 3</h2>
      </div>

      <div use:visible="/api/section4">
        <h2>Section 4</h2>
      </div>
    </div>
  );
}
```

## 🚨 Error Handling

### Basic Error Handling

```tsx
import { visible } from '@westacks/vortex';

export default function ErrorHandling() {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    setError(error.message);
    console.error('Visible loading error:', error);
  };

  return (
    <div>
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      )}

      <div use:visible={{
        url: '/api/data',
        method: 'GET',
        always: false
      }}>
        <p>Loading content...</p>
      </div>
    </div>
  );
}
```

### Fallback Content

```tsx
import { visible } from '@westacks/vortex';

export default function FallbackContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {content ? (
        <div>{content}</div>
      ) : (
        <div use:visible={{
          url: '/api/content',
          method: 'GET',
          always: false
        }}>
          {loading ? 'Loading...' : 'Click to load content'}
        </div>
      )}
    </div>
  );
}
```

## 📱 Performance Considerations

### Memory Management

```tsx
import { visible } from '@westacks/vortex';

export default function MemoryEfficient() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Pause loading when component is not active
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isActive) {
    return <div>Component paused</div>;
  }

  return (
    <div use:visible={{
      url: '/api/heavy-content',
      method: 'GET',
      always: false
    }}>
      <p>Heavy content loading...</p>
    </div>
  );
}
```

### Network Optimization

```tsx
import { visible } from '@westacks/vortex';

export default function NetworkOptimized() {
  const [lastLoaded, setLastLoaded] = useState(null);

  return (
    <div>
      {/* Only load new content since last load */}
      <div use:visible={{
        url: '/api/updates',
        method: 'GET',
        params: { 
          since: lastLoaded || Date.now() - 300000 // 5 minutes ago
        },
        always: false
      }}>
        <p>Loading updates...</p>
      </div>

      {/* Load with compression */}
      <div use:visible={{
        url: '/api/compressed-data',
        method: 'GET',
        headers: { 'Accept-Encoding': 'gzip, deflate' },
        always: false
      }}>
        <p>Loading compressed data...</p>
      </div>
    </div>
  );
}
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete visible API documentation
- **[Examples](examples)** - More visible loading examples
- **[Navigation](usage/navigation)** - Basic navigation concepts
- **[Advanced Patterns](advanced)** - Complex visible loading patterns
