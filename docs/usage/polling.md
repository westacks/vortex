# Polling & Auto-Refresh

Vortex provides powerful polling capabilities through the `usePoll` function, allowing you to automatically refresh data at regular intervals.

## 🚀 Basic Usage

### Simple Polling

```ts
import { usePoll } from '@westacks/vortex';

// Poll every 5 seconds
const poll = usePoll(5000, {
  url: '/api/notifications',
  method: 'GET'
});

// Manual control
poll.stop();  // Stop polling
poll.start(); // Resume polling
```

### Polling with Options

```ts
import { usePoll } from '@westacks/vortex';

const poll = usePoll(10000, {
  url: '/api/updates',
  method: 'GET',
  autoStart: false,    // Don't start automatically
  keepAlive: true      // Continue in background
});

// Start when component mounts
useEffect(() => {
  poll.start();
  return () => poll.stop();
}, []);
```

## ⚙️ Configuration Options

### Polling Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoStart` | `boolean` | `true` | Start polling immediately |
| `keepAlive` | `boolean` | `false` | Continue polling when tab is hidden |

### HTTP Options

All standard Axios options are supported:

```ts
const poll = usePoll(5000, {
  url: '/api/data',
  method: 'POST',
  data: { filter: 'active' },
  headers: { 'Authorization': `Bearer ${token}` },
  params: { page: 1 }
});
```

## 🎯 Use Cases

### Real-time Updates

```ts
import { usePoll } from '@westacks/vortex';

export default function LiveDashboard() {
  const [data, setData] = useState(null);
  
  const poll = usePoll(30000, {
    url: '/api/dashboard',
    method: 'GET'
  });

  useEffect(() => {
    const handleResponse = (response) => {
      setData(response.data);
    };

    // Listen to responses
    poll.on('response', handleResponse);
    
    return () => {
      poll.off('response', handleResponse);
      poll.stop();
    };
  }, []);

  return (
    <div>
      <h2>Live Dashboard</h2>
      {data && <DashboardData data={data} />}
    </div>
  );
}
```

### Background Sync

```ts
import { usePoll } from '@westacks/vortex';

export default function BackgroundSync() {
  const poll = usePoll(60000, {  // Every minute
    url: '/api/sync',
    method: 'POST',
    keepAlive: true  // Continue in background
  });

  useEffect(() => {
    // Start background sync
    poll.start();
    
    return () => poll.stop();
  }, []);

  return (
    <div>
      <p>Background sync active</p>
      <button onClick={() => poll.stop()}>Stop Sync</button>
      <button onClick={() => poll.start()}>Start Sync</button>
    </div>
  );
}
```

### Conditional Polling

```ts
import { usePoll } from '@westacks/vortex';

export default function SmartPolling() {
  const [isActive, setIsActive] = useState(true);
  
  const poll = usePoll(5000, {
    url: '/api/status',
    method: 'GET',
    keepAlive: false  // Stop when tab is hidden
  });

  useEffect(() => {
    if (isActive) {
      poll.start();
    } else {
      poll.stop();
    }
    
    return () => poll.stop();
  }, [isActive]);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Enable polling
      </label>
    </div>
  );
}
```

## 🔄 Advanced Patterns

### Polling with Retry Logic

```ts
import { usePoll } from '@westacks/vortex';

const createRetryPoll = (interval: number, maxRetries: number = 3) => {
  let retryCount = 0;
  
  const poll = usePoll(interval, {
    url: '/api/unreliable',
    method: 'GET',
    autoStart: false
  });

  const startWithRetry = () => {
    poll.start();
    
    // Reset retry count on success
    poll.on('response', () => {
      retryCount = 0;
    });
    
    // Handle errors
    poll.on('error', (error) => {
      retryCount++;
      if (retryCount >= maxRetries) {
        poll.stop();
        console.error('Max retries reached');
      }
    });
  };

  return { ...poll, startWithRetry };
};

// Usage
const retryPoll = createRetryPoll(5000, 5);
retryPoll.startWithRetry();
```

### Polling with Backoff

```ts
import { usePoll } from '@westacks/vortex';

const createBackoffPoll = (baseInterval: number, maxInterval: number = 60000) => {
  let currentInterval = baseInterval;
  
  const poll = usePoll(currentInterval, {
    url: '/api/status',
    method: 'GET',
    autoStart: false
  });

  const startWithBackoff = () => {
    poll.start();
    
    // Increase interval on errors
    poll.on('error', () => {
      currentInterval = Math.min(currentInterval * 2, maxInterval);
      poll.stop();
      
      setTimeout(() => {
        poll.start();
      }, currentInterval);
    });
    
    // Reset interval on success
    poll.on('response', () => {
      currentInterval = baseInterval;
    });
  };

  return { ...poll, startWithBackoff };
};

// Usage
const backoffPoll = createBackoffPoll(1000, 30000);
backoffPoll.startWithBackoff();
```

### Polling with Data Transformation

```ts
import { usePoll } from '@westacks/vortex';

export default function DataTransformPoll() {
  const [transformedData, setTransformedData] = useState(null);
  
  const poll = usePoll(10000, {
    url: '/api/raw-data',
    method: 'GET',
    autoStart: false
  });

  useEffect(() => {
    const handleResponse = (response) => {
      // Transform data before setting state
      const transformed = response.data.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp),
        status: item.status === 'active' ? 'online' : 'offline'
      }));
      
      setTransformedData(transformed);
    };

    poll.on('response', handleResponse);
    poll.start();
    
    return () => {
      poll.off('response', handleResponse);
      poll.stop();
    };
  }, []);

  return (
    <div>
      <h2>Transformed Data</h2>
      {transformedData && (
        <ul>
          {transformedData.map(item => (
            <li key={item.id}>
              {item.name} - {item.status} at {item.timestamp.toLocaleTimeString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 🎛️ Lifecycle Management

### Component Lifecycle

```ts
import { usePoll } from '@westacks/vortex';

export default function LifecycleExample() {
  const poll = usePoll(5000, {
    url: '/api/data',
    method: 'GET'
  });

  useEffect(() => {
    // Start polling when component mounts
    poll.start();
    
    // Clean up when component unmounts
    return () => {
      poll.stop();
    };
  }, []);

  // Pause/resume based on component visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        poll.stop();
      } else {
        poll.start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [poll]);

  return <div>Polling component</div>;
}
```

### Multiple Polls

```ts
import { usePoll } from '@westacks/vortex';

export default function MultiPoll() {
  const notificationsPoll = usePoll(30000, {
    url: '/api/notifications',
    method: 'GET'
  });
  
  const statusPoll = usePoll(60000, {
    url: '/api/status',
    method: 'GET'
  });
  
  const metricsPoll = usePoll(300000, {  // 5 minutes
    url: '/api/metrics',
    method: 'GET'
  });

  useEffect(() => {
    // Start all polls
    notificationsPoll.start();
    statusPoll.start();
    metricsPoll.start();
    
    return () => {
      // Stop all polls
      notificationsPoll.stop();
      statusPoll.stop();
      metricsPoll.stop();
    };
  }, []);

  return (
    <div>
      <h2>Multi-Poll Dashboard</h2>
      <p>Multiple data sources being polled</p>
    </div>
  );
}
```

## 🚨 Error Handling

### Basic Error Handling

```ts
import { usePoll } from '@westacks/vortex';

const poll = usePoll(5000, {
  url: '/api/data',
  method: 'GET'
});

poll.on('error', (error) => {
  console.error('Polling error:', error);
  
  // Stop polling on critical errors
  if (error.response?.status === 500) {
    poll.stop();
  }
});
```

### Retry on Error

```ts
import { usePoll } from '@westacks/vortex';

const createResilientPoll = (interval: number) => {
  let consecutiveErrors = 0;
  const maxErrors = 3;
  
  const poll = usePoll(interval, {
    url: '/api/data',
    method: 'GET',
    autoStart: false
  });

  poll.on('error', (error) => {
    consecutiveErrors++;
    
    if (consecutiveErrors >= maxErrors) {
      console.error('Too many consecutive errors, stopping poll');
      poll.stop();
    } else {
      console.warn(`Poll error ${consecutiveErrors}/${maxErrors}`);
    }
  });

  poll.on('response', () => {
    consecutiveErrors = 0;  // Reset error count on success
  });

  return poll;
};

// Usage
const resilientPoll = createResilientPoll(5000);
resilientPoll.start();
```

## 📱 Performance Considerations

### Memory Management

```ts
import { usePoll } from '@westacks/vortex';

export default function MemoryEfficientPoll() {
  const poll = usePoll(10000, {
    url: '/api/large-dataset',
    method: 'GET'
  });

  useEffect(() => {
    let isActive = true;
    
    poll.on('response', (response) => {
      if (isActive) {
        // Only process response if component is still active
        processData(response.data);
      }
    });

    poll.start();
    
    return () => {
      isActive = false;
      poll.stop();
    };
  }, []);

  return <div>Memory efficient polling</div>;
}
```

### Network Optimization

```ts
import { usePoll } from '@westacks/vortex';

// Poll with conditional requests
const smartPoll = usePoll(30000, {
  url: '/api/updates',
  method: 'GET',
  params: { since: Date.now() - 300000 }  // Only get updates from last 5 minutes
});

// Poll with different intervals based on activity
const adaptivePoll = usePoll(5000, {
  url: '/api/activity',
  method: 'GET'
});

// Increase interval when no activity
let noActivityCount = 0;
adaptivePoll.on('response', (response) => {
  if (response.data.length === 0) {
    noActivityCount++;
    if (noActivityCount > 3) {
      adaptivePoll.stop();
      // Start slower polling
      setTimeout(() => {
        adaptivePoll.start();
      }, 30000);
    }
  } else {
    noActivityCount = 0;
  }
});
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete polling API documentation
- **[Examples](examples)** - More polling examples
- **[Navigation](usage/navigation)** - Basic navigation concepts
- **[Advanced Patterns](advanced)** - Complex polling patterns
