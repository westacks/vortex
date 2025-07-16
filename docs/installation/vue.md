# Vue Installation

This guide explains how to set up Vortex in a Vue 3 project using the official Vue adapter.

## 1. Install Required Packages

Install Vortex and Vue:

```bash
npm install @westacks/vortex vue
```

## 2. Setup Your Entry Point

Here’s a full example of a typical `main.ts` or `app.ts` setup for a Vortex-powered Vue application:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';
import { vortex } from '@westacks/vortex/vue';
import { createApp, createSSRApp, h, reactive } from 'vue';
import App from './App.vue';
import { resolve } from './resolve';

createVortex(async (el, page, install, ssr) => {
    // Install extensions like Inertia and progress bar
    install(inertia(page.get()), bprogress());

    // Create a reactive props object
    const props = reactive(await resolve(page.get()));
    const app = ssr ? createSSRApp : createApp;

    // Create and mount the app
    app({ render: () => h(App, props) })
        .use(vortex)
        .mount(el);

    // Update the props when the page changes
    page.subscribe(async (page) => Object.assign(props, await resolve(page)));
});
```

## 3. Page Resolution

Create a `resolve.ts` helper to dynamically load and provide props to your components:

```ts
// resolve.ts
import type { Page } from '@westacks/vortex';

// Vite
export async function resolve(page: Page) {
    const pages = import.meta.glob('./pages/**/*.vue');
    const component = await pages[`./pages/${page.component}.vue`]();
    return { component, props: page.props ?? {} };
}

// Webpack
export async function resolve(page: Page) {
    const component = await import(`./pages/${page.component}.vue`);
    return { component, props: page.props ?? {} };
}
```

Your `App.vue` component should receive `component` and `props` and render them:

```vue
<!-- App.vue -->
<script setup>
    defineProps(['component', 'props']);
</script>

<template>
    <component :is="component.default" v-bind="props" />
</template>
```

## 4. Start Writing Pages

Now you're ready to build pages in your Vue app:

```vue
<!-- pages/Home.vue -->
<script setup>
    defineProps(['name']);
</script>

<template>
    <h1>Hello, {{ name }}!</h1>
</template>
```

## 5. Server Side Rendering (optional)

If you need to prerender your pages you can setup a `ssr.ts` entrypoint:

```ts
// ssr.ts
import { createVortexServer } from '@westacks/vortex/server';
import { renderToString } from 'vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { resolve } from './resolve';
import App from './App.vue';

createVortexServer(async (page) => {
  const props = await resolve(page);
  const app = createSSRApp({ render: () => h(App, props) });

  const html = await renderToString(app);

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