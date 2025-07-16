# Solid Installation

This guide explains how to set up Vortex in a SolidJS project using the official Solid adapter.

## 1. Install Required Packages

Install Vortex and SolidJS:

```bash
npm install @westacks/vortex solid-js
```

## 2. Setup Your Entry Point

Here’s an example `main.tsx` (or `app.tsx`) file using Vortex with Solid:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { render, hydrate } from 'solid-js/web'
import { createSignal } from 'solid-js';
import { resolve } from './resolve';
import Root from './Root';

createVortex(async (target, page, install, ssr) => {
    // Install extensions like inertia and progress bar
    install(inertia(page.get()), bprogress())

    // Create a reactive props object
    const [root, setRoot] = createSignal(await resolve(page.get()));
    const h = ssr ? hydrate : render

    // Create and mount the app
    h(() => <Root root={root}/>, target)

    // Update the props when the page changes
    page.subscribe(async (page) => setRoot(await resolve(page)))
});
```

## 3. Page Resolution

Create a `resolve.ts` helper to dynamically load and pass props to your components:

```ts
// resolve.ts
import type { Page } from '@westacks/vortex';

// Vite
export async function resolve(page: Page) {
  const pages = import.meta.glob('./pages/**/*.tsx');
  const component = await pages[`./pages/${page.component}.tsx`]();
  return { component, props: page.props ?? {} }
}

// Webpack
export async function resolve(page: Page) {
  const component = await import(`./pages/${page.component}.tsx`);
  return { component, props: page.props ?? {} }
}
```

In your `Root.tsx`, receive `component` and `props`, and render the page:

```tsx
// App.tsx
import { Dynamic } from 'solid-js/web'

export default function Root({ root }) {
    const component = () => root().component.default
    const props = () => root().props

    return <Dynamic component={component()} {...props()} />
}

```

## 4. Start Writing Pages

Now you're ready to create pages:

```tsx
// pages/Home.tsx
export default function Home(props) {
  return <h1>Hello, {props.name}!</h1>;
}
```

## 5. Server Side Rendering (optional)

For prerendering SolidJS components, use a `ssr.tsx` entrypoint:

```ts
// ssr.tsx
import { createVortexServer } from '@westacks/vortex/server';
import { renderToString } from 'solid-js/web';
import { resolve } from './resolve';
import App from './App';

createVortexServer(async (page) => {
  const props = await resolve(page);
  const html = renderToString(() => <App {...props} />);

  // ...

  return { html };
});
```

Once bundled, you can use it in 2 ways:
- Server mode:
    ```bash
    node ssr.js
    ```
    This will spawn a http server where you can send your page data using `POST /render` and it will return you the result of your render function.
- Client mode:
    ```bash
    node ssr.js '{"component":"Home","props":{"name":"John"}}'
    ```
    Will return a prerendered page as console output.