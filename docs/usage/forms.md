# Form Handling

Vortex provides a powerful form handling system that makes it easy to create reactive forms with validation, error handling, and state management.

## 🚀 Basic Form Usage

### Creating a Form

Use the `useForm` hook to create a reactive form:

```ts
import { useForm } from '@westacks/vortex';

const form = useForm({
  name: '',
  email: '',
  message: ''
});
```

### Form Properties

Every form automatically includes these properties:

- **`processing`** - Boolean indicating if form is being submitted
- **`wasSuccessful`** - Boolean indicating if last submission succeeded
- **`recentlySuccessful`** - Boolean indicating if form was recently successful
- **`errors`** - Object containing validation errors
- **`hasErrors`** - Boolean indicating if form has errors
- **`isDirty`** - Boolean indicating if form has unsaved changes

### Basic Form Example

```tsx
import { useForm } from '@westacks/vortex';

export default function ContactForm() {
  const form = useForm({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await form.post('/contact');
      // Form submitted successfully
      form.reset();
    } catch (error) {
      // Validation errors are automatically set on form.errors
      console.log('Form errors:', form.errors);
    }
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
        {form.errors.name && (
          <span className="error">{form.errors.name}</span>
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
        {form.errors.email && (
          <span className="error">{form.errors.email}</span>
        )}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={form.message}
          onChange={(e) => form.message = e.target.value}
        />
        {form.errors.message && (
          <span className="error">{form.errors.message}</span>
        )}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Sending...' : 'Send Message'}
      </button>

      {form.wasSuccessful && (
        <div className="success">Message sent successfully!</div>
      )}
    </form>
  );
}
```

## 🔄 Form Methods

### HTTP Methods

Forms support all standard HTTP methods:

```ts
const form = useForm({
  name: '',
  email: ''
});

// GET request
await form.get('/api/users/search', {
  params: { q: form.name }
});

// POST request
await form.post('/api/users');

// PUT request
await form.put('/api/users/123');

// PATCH request
await form.patch('/api/users/123');

// DELETE request
await form.delete('/api/users/123');
```

### Form Data Methods

```ts
const form = useForm({
  name: 'John',
  email: 'john@example.com',
  role: 'user'
});

// Get current form data
const data = form.data();
console.log(data); // { name: 'John', email: 'john@example.com', role: 'user' }

// Reset form to initial values
form.reset();

// Reset specific fields
form.reset('name', 'email');

// Fill form with new data
form.fill({
  name: 'Jane',
  email: 'jane@example.com',
  role: 'admin'
});

// Set default values
form.defaults({
  role: 'user',
  status: 'active'
});

// Set default for specific field
form.defaults('role', 'user');
```

### Error Management

```ts
const form = useForm({
  name: '',
  email: ''
});

// Clear all errors
form.clearErrors();

// Clear specific field errors
form.clearErrors('name', 'email');

// Set custom error
form.setError('general', 'Something went wrong');

// Check error state
if (form.hasErrors) {
  console.log('Form has errors:', form.errors);
}
```

## 🎯 Advanced Form Patterns

### Form with File Uploads

```tsx
import { useForm } from '@westacks/vortex';

export default function FileUploadForm() {
  const form = useForm({
    title: '',
    description: '',
    files: []
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    form.files = files;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      
      form.files.forEach(file => {
        formData.append('files[]', file);
      });

      await form.post('/upload', {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      form.reset();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      
      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Uploading...' : 'Upload Files'}
      </button>
    </form>
  );
}
```

### Multi-Step Form

```tsx
import { useForm } from '@westacks/vortex';
import { useState } from 'react';

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  
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
    <div className="multi-step-form">
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

### Form with Custom Validation

```tsx
import { useForm } from '@westacks/vortex';
import { useState } from 'react';

export default function ValidatedForm() {
  const [customErrors, setCustomErrors] = useState({});
  
  const form = useForm({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!form.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setCustomErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await form.post('/register');
      form.reset();
      setCustomErrors({});
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => form.email = e.target.value}
        />
        {(customErrors.email || form.errors.email) && (
          <span className="error">
            {customErrors.email || form.errors.email}
          </span>
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
        {(customErrors.password || form.errors.password) && (
          <span className="error">
            {customErrors.password || form.errors.password}
          </span>
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
        {(customErrors.confirmPassword || form.errors.confirmPassword) && (
          <span className="error">
            {customErrors.confirmPassword || form.errors.confirmPassword}
          </span>
        )}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

## 🔧 Form Configuration

### Custom Error Resolution

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
  
  if (response.data?.validation_errors) {
    return response.data.validation_errors;
  }
  
  return {};
};
```

### Form with Transformations

```ts
const form = useForm({
  firstName: '',
  lastName: '',
  email: ''
});

// Transform data before submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await form.post('/users', {
      transform: (data) => ({
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email.toLowerCase()
      })
    });
  } catch (error) {
    console.error('Submission failed:', error);
  }
};
```

## 🎨 Form Styling

### CSS Classes for Form States

```css
/* Form processing state */
.form-processing {
  opacity: 0.7;
  pointer-events: none;
}

/* Form with errors */
.form-has-errors {
  border-color: #ef4444;
}

/* Form success state */
.form-success {
  border-color: #10b981;
}

/* Error messages */
.error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Success messages */
.success {
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Disabled submit button */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Responsive Form Layout

```css
.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 640px) {
  .form-container {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
```

## 🚀 Performance Tips

### Lazy Form Loading

```tsx
import { lazy, Suspense } from 'react';
import { useForm } from '@westacks/vortex';

// Lazy load heavy form components
const HeavyFormComponent = lazy(() => import('./HeavyFormComponent'));

export default function LazyForm() {
  const form = useForm({
    // Form data
  });

  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <HeavyFormComponent form={form} />
    </Suspense>
  );
}
```

### Form Debouncing

```tsx
import { useForm } from '@westacks/vortex';
import { useCallback } from 'react';
import { debounce } from 'lodash';

export default function DebouncedForm() {
  const form = useForm({
    search: ''
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.trim()) {
        try {
          const response = await form.get('/api/search', {
            params: { q: query }
          });
          // Handle search results
        } catch (error) {
          console.error('Search failed:', error);
        }
      }
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    form.search = e.target.value;
    debouncedSearch(form.search);
  };

  return (
    <input
      type="text"
      placeholder="Search..."
      value={form.search}
      onChange={handleSearchChange}
    />
  );
}
```

## 🔗 Next Steps

- **[API Reference](api)** - Complete form API documentation
- **[Examples](examples)** - More form usage examples
- **[State Management](usage/state)** - Managing form state with signals
- **[Advanced Patterns](advanced)** - Complex form patterns and techniques

Forms in Vortex are designed to be simple yet powerful. They automatically handle the common complexities of form management while providing the flexibility you need for advanced use cases.
