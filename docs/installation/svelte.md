# Svelte Installation

This guide explains how to set up Vortex in a Svelte project using the official Svelte adapter.

## 1. Install Required Packages

Install Vortex and Svelte:

```bash
npm install @westacks/vortex svelte
```
## 2. Setup Your Entry Point

Here's an example `main.svelte.ts` (or `app.svelte.ts`) file using Vortex with Svelte:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { mount, hydrate } from 'svelte';
import { resolve } from './resolve';
import App from './App.svelte';

createVortex(async (target, page, install, ssr) => {
    // Install extensions like inertia and progress bar
    install(inertia(page.get()), bprogress());

    // Create a reactive props object
    let props = $state(await resolve(page.get()))
    const h = ssr ? hydrate : mount

    // Create and mount the app
    h(App, { target, props })

    // Update the props when the page changes
    page.subscribe(async (page) => Object.assign(props, await resolve(page)))
});
```

## 3. Page Resolution

Create a `resolve.ts` helper to dynamically load and pass props to your pages:

```ts
// resolve.ts
import type { Page } from '@westacks/vortex';

// Vite
export async function resolve(page: Page) {
  const pages = import.meta.glob('./pages/**/*.svelte');
  const component = await pages[`./pages/${page.component}.svelte`]();
  return { component, props: page.props ?? {} }
}

// Webpack (if using dynamic import):
export async function resolve(page: Page) {
  const component = require(`./pages/${page.component}.svelte`);
  return { component, props: page.props ?? {} }
}
```

Your `App.svelte` should receive a `component` and `props`, then render dynamically:

```svelte
<!-- App.svelte -->
<script>
    let { component, props } = $props()
</script>

<component.default {...props}></component.default>
```

## 4. Start Writing Pages

Now you're ready to create your pages:

```svelte
<!-- pages/Home.svelte -->
<script>
    let { name } = $props()
</script>

<h1>Hello, {name}!</h1>
```

## 5. Server Side Rendering (optional)

To prerender pages with Svelte, create a `ssr.ts` file like this:

```ts
// ssr.ts
import { createVortexServer } from '@westacks/vortex/server';
import { render } from 'svelte/server';
import App from './App.svelte';
import { resolve } from './resolve';

createVortexServer(async (page) => {
  const props = await resolve(page);
  const { body, head } = render(App, props);

  // ...

  return { body, head };
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