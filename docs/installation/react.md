# React Installation

This guide explains how to set up Vortex in a React project using the official React adapter.

## 1. Install Required Packages

Install Vortex and React:

```bash
npm install @westacks/vortex react react-dom @types/react @types/react-dom
```

## 2. Setup Your Entry Point

Here’s a full example of a typical `app.tsx` or `main.tsx` setup for a Vortex-powered React application:

```ts
import { createVortex, Page } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { resolve } from './resolve';
import Root from './Root';

createVortex(async (target, page, install, ssr) => {
    // Install extensions like inertia and progress bar
    install(inertia(page.get()), bprogress());

    // Create an app root
    const root = ssr
        ? hydrateRoot(target, <Root {...await resolve(page)} />)
        : createRoot(target);

    // Render function that resolves the current page and renders it
    const render = async (page: Page) => {
        root.render(<Root {...await resolve(page)} />);
    };

    // Initial client-side render (SSR already hydrated)
    if (!ssr) render(page.get());

    // Re-render on navigation
    page.subscribe(render);
});
```

## 3. Page Resolution

Write a `resolve` helper to dynamically load and pass props to your components based on given page:

```ts
// resolve.ts
import type { Page } from '@westacks/vortex'

// Vite
async function resolve(page: Page) {
    const pages = import.meta.glob('./pages/**/*.tsx')
    const component = await pages[`./pages/${page.component}.tsx`]
    return { component, props: page.props ?? {} }
}

// Webpack
async function resolve(page: Page) {
    const component = require(`./pages/${page.component}.tsx`),
    return { component, props: page.props ?? {} }
}
```

Inside your `Root` component, you can render the page dynamically:

```tsx
// Root.tsx
export default function Root({ component, props }) {
    return <component.default {...props} />
}
```
## 4. Start Writing Pages

Now you are ready to go to create pages for your application:
```tsx
// pages/Home.tsx
export default function Home(props) {
    return <h1>Hello, {props.name}!</h1>
}
```

## 5. Server Side Rendering (optional)

If you need to prerender your pages you can setup `ssr.ts` entrypoint:

```ts
// ssr.ts
import { createVortexServer } from '@westacks/vortex/server'
import { renderToString } from 'react-dom/server'
import { resolve } from './resolve'
import Root from './Root'

createVortexServer(async (page) => {
    const html = renderToString(<Root {...await resolve(page)} />)

    // ...

    return { html }
})
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