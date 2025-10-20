# Extensions & Plugins

Vortex provides a powerful extension system that allows you to enhance your application with additional functionality. This page covers built-in extensions and how to create custom ones.

## 🔌 Built-in Extensions

### Inertia.js Compatibility Layer

The Inertia.js compatibility layer allows you to use Vortex as a drop-in replacement for existing Inertia.js applications.

**Installation:**
```ts
import inertia from '@westacks/vortex/inertia';
```

**Usage:**
```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';

createVortex(async (target, page, install, ssr) => {
  // Install Inertia.js compatibility
  install(inertia(page.get()));
  
  // Your existing Inertia.js app will work unchanged
});
```

**Features:**
- **Drop-in Replacement** - Works with existing Inertia.js code
- **Same API** - Familiar `Inertia.visit()`, `Inertia.post()`, etc.
- **Enhanced Performance** - Built on Vortex's optimized core
- **Framework Support** - Works with all Vortex adapters

**Example Migration:**
```ts
// Before (Inertia.js)
import { Inertia } from '@inertiajs/react';

function handleSubmit() {
  Inertia.post('/users', formData);
}

// After (Vortex with Inertia compatibility)
import { Inertia } from '@westacks/vortex/inertia';

function handleSubmit() {
  Inertia.post('/users', formData); // Same API!
}
```

### BProgress Integration

BProgress provides a beautiful progress bar that appears during navigation and form submissions.

**Installation:**
```ts
import bprogress from '@westacks/vortex/bprogress';
```

**Usage:**
```ts
import { createVortex } from '@westacks/vortex';
import bprogress from '@westacks/vortex/bprogress';

createVortex(async (target, page, install, ssr) => {
  // Install progress bar
  install(bprogress());
  
  // Your app setup...
});
```

**Features:**
- **Automatic Progress** - Shows during all Vortex requests
- **Customizable Styling** - CSS variables for theming
- **Performance Optimized** - Minimal overhead
- **Accessibility** - Screen reader friendly

**Customization:**
```css
:root {
  --bprogress-color: #3b82f6;
  --bprogress-height: 3px;
  --bprogress-z-index: 9999;
}
```

### Prefetching Extension

The prefetching extension provides intelligent page preloading for better performance.

**Installation:**
```ts
import { prefetch } from '@westacks/vortex';
```

**Usage:**
```ts
import { createVortex } from '@westacks/vortex';
import { prefetch } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  install(prefetch);
  
  // Your app setup...
});
```

**Features:**
- **Smart Caching** - TTL-based cache management
- **Stale-While-Revalidate** - Show cached content while updating
- **Automatic Cleanup** - Removes expired cache entries
- **Configurable TTL** - Custom cache duration per request

**Usage Examples:**
```ts
import { axios } from '@westacks/vortex';

// Basic prefetching
await axios.get('/dashboard', { prefetch: true });

// Custom TTL (1 minute fresh, 5 minutes stale)
await axios.get('/dashboard', {
  prefetch: {
    ttl: 60000,      // 1 minute
    stale: 300000    // 5 minutes
  }
});

// Prefetch multiple pages
const pages = ['/about', '/contact', '/pricing'];
await Promise.all(
  pages.map(page => axios.get(page, { prefetch: true }))
);
```

## 🛠️ Creating Custom Extensions

### Extension Structure

Extensions are functions that receive a Vortex context and can modify request/response behavior.

**Basic Template:**
```ts
import type { VortexExtension } from '@westacks/vortex';

const myExtension: VortexExtension = ({ request, response, page }) => {
  // Extension logic here
  
  // Return cleanup function (optional)
  return () => {
    // Cleanup code
  };
};

export default myExtension;
```

### Request Interceptors

Modify outgoing requests before they're sent:

```ts
const authExtension: VortexExtension = ({ request }) => {
  const req = request.use(
    (config) => {
      // Add authentication header
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      return config;
    },
    (error) => {
      // Handle request errors
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  return () => request.eject(req);
};
```

### Response Interceptors

Process incoming responses:

```ts
const responseExtension: VortexExtension = ({ response }) => {
  const res = response.use(
    (response) => {
      // Transform response data
      if (response.data?.data) {
        response.data = response.data.data;
      }
      
      return response;
    },
    (error) => {
      // Handle response errors
      if (error.response?.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return () => response.eject(res);
};
```

### Page State Monitoring

Monitor page changes and react to them:

```ts
const analyticsExtension: VortexExtension = ({ page }) => {
  // Subscribe to page changes
  const unsubscribe = page.subscribe((pageData) => {
    // Track page views
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pageData.url
      });
    }
    
    // Custom analytics
    fetch('/api/analytics/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageData.url,
        component: pageData.component,
        timestamp: Date.now()
      })
    });
  });

  return () => unsubscribe();
};
```

### Complex Extensions

Combine multiple interceptors and features:

```ts
const comprehensiveExtension: VortexExtension = ({ request, response, page }) => {
  const interceptors = [];
  
  // Request logging
  const reqLogger = request.use(
    (config) => {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    }
  );
  interceptors.push(() => request.eject(reqLogger));
  
  // Response logging
  const resLogger = response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(`❌ ${error.response?.status || 'ERROR'} ${error.config?.url}`);
      return Promise.reject(error);
    }
  );
  interceptors.push(() => response.eject(resLogger));
  
  // Performance monitoring
  const perfMonitor = request.use(
    (config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    }
  );
  
  const perfResponse = response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`⏱️ ${response.config.url} took ${duration}ms`);
      return response;
    }
  );
  
  interceptors.push(
    () => request.eject(perfMonitor),
    () => response.eject(perfResponse)
  );
  
  // Page change tracking
  const pageTracker = page.subscribe((pageData) => {
    console.log(`📄 Page changed to: ${pageData.component}`);
  });
  interceptors.push(() => pageTracker());
  
  // Return cleanup function
  return () => {
    interceptors.forEach(cleanup => cleanup());
  };
};
```

## 🔧 Extension Configuration

### Configuration Options

Extensions can accept configuration parameters:

```ts
const configurableExtension = (options = {}) => {
  const {
    enabled = true,
    logLevel = 'info',
    customHeader = 'X-Custom'
  } = options;
  
  return ({ request, response }: VortexExtension) => {
    if (!enabled) return;
    
    const req = request.use(
      (config) => {
        if (logLevel === 'debug') {
          console.log('Request config:', config);
        }
        
        config.headers = {
          ...config.headers,
          [customHeader]: 'enabled'
        };
        
        return config;
      }
    );
    
    return () => request.eject(req);
  };
};

// Usage
install(configurableExtension({
  enabled: true,
  logLevel: 'debug',
  customHeader: 'X-MyApp'
}));
```

### Environment-based Configuration

Configure extensions based on environment:

```ts
const environmentExtension: VortexExtension = ({ request, response }) => {
  const isDev = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isDev) {
    // Development-only features
    const devLogger = request.use(
      (config) => {
        console.group(`🌐 ${config.method} ${config.url}`);
        console.log('Headers:', config.headers);
        console.log('Data:', config.data);
        console.groupEnd();
        return config;
      }
    );
    
    return () => request.eject(devLogger);
  }
  
  if (isTest) {
    // Test-only features
    const testInterceptor = request.use(
      (config) => {
        // Mock responses in test environment
        if (config.url?.includes('/api/')) {
          return Promise.resolve({
            data: { mocked: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          });
        }
        return config;
      }
    );
    
    return () => request.eject(testInterceptor);
  }
  
  // Production: no additional features
  return () => {};
};
```

## 📦 Publishing Extensions

### Package Structure

To publish your extension as an npm package:

```
my-vortex-extension/
├── package.json
├── src/
│   └── index.ts
├── README.md
└── tsconfig.json
```

**package.json:**
```json
{
  "name": "my-vortex-extension",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "peerDependencies": {
    "@westacks/vortex": ">=0.1.0"
  }
}
```

**src/index.ts:**
```ts
import type { VortexExtension } from '@westacks/vortex';

export interface MyExtensionOptions {
  enabled?: boolean;
  customOption?: string;
}

export const myExtension = (options: MyExtensionOptions = {}): VortexExtension => {
  const { enabled = true, customOption = 'default' } = options;
  
  return ({ request, response }) => {
    if (!enabled) return;
    
    // Extension implementation
    const req = request.use(
      (config) => {
        config.headers = {
          ...config.headers,
          'X-MyExtension': customOption
        };
        return config;
      }
    );
    
    return () => request.eject(req);
  };
};

export default myExtension;
export type { VortexExtension };
```

### Usage in Other Projects

```ts
import { createVortex } from '@westacks/vortex';
import myExtension from 'my-vortex-extension';

createVortex(async (target, page, install, ssr) => {
  install(myExtension({
    enabled: true,
    customOption: 'production'
  }));
  
  // Your app setup...
});
```

## 🎯 Best Practices

### Performance Considerations

1. **Minimize Interceptors** - Only add interceptors you need
2. **Efficient Cleanup** - Always return cleanup functions
3. **Lazy Loading** - Load extensions only when needed
4. **Memory Management** - Avoid memory leaks in subscriptions

### Error Handling

```ts
const robustExtension: VortexExtension = ({ request, response }) => {
  const req = request.use(
    (config) => {
      try {
        // Extension logic
        return config;
      } catch (error) {
        console.error('Extension error:', error);
        // Don't break the request
        return config;
      }
    }
  );
  
  return () => request.eject(req);
};
```

### Testing Extensions

```ts
// test/extension.test.ts
import { myExtension } from '../src';

describe('myExtension', () => {
  it('should add custom header', () => {
    const mockRequest = {
      use: jest.fn().mockReturnValue(1)
    };
    
    const mockResponse = {
      use: jest.fn().mockReturnValue(2)
    };
    
    const cleanup = myExtension()({
      request: mockRequest,
      response: mockResponse,
      page: {} as any
    });
    
    expect(mockRequest.use).toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
  });
});
```

## 🔗 Community Extensions

### Popular Extensions

- **vortex-devtools** - Development tools and debugging
- **vortex-analytics** - Analytics and tracking
- **vortex-cache** - Advanced caching strategies
- **vortex-offline** - Offline support and sync

### Contributing

To contribute extensions to the Vortex ecosystem:

1. **Fork the Repository** - Create your own fork
2. **Add Your Extension** - Implement the extension
3. **Write Tests** - Ensure quality and reliability
4. **Submit PR** - Create a pull request
5. **Documentation** - Provide clear usage examples

## 📚 Next Steps

- **[API Reference](api)** - Complete API documentation
- **[Examples](examples)** - Real-world usage examples
- **[Advanced Usage](advanced)** - Advanced patterns and techniques
- **[Migration Guide](migration)** - Moving from other frameworks

Extensions are a powerful way to customize and enhance Vortex for your specific needs. Start with the built-in extensions and gradually build custom ones as your application grows.
