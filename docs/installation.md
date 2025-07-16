# Installation

Vortex is designed to be modular and framework-agnostic. Out of the box, it comes with official adapters for four popular frontend frameworks:

- **React** (`@westacks/vortex/react`)
- **Vue** (`@westacks/vortex/vue`)
- **Svelte** (`@westacks/vortex/svelte`)
- **SolidJS** (`@westacks/vortex/solid-js`)

## Resolving and rendering page components

Depending on your app structure, you will need to create a logic to resolve and render your page components. The simplest setup - just a root component that will receive page component and its props, however you can customize it to your needs:

```tsx
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

export default function Root({ component, props }) {
    return <component.default {...props} />
}
```

## Extensions and Plugins

Vortex also have an extension API to enhance your application routing with different features. Out of the box, Vortex comes with pluging for [Inertia.js](https://inertiajs.com/) and [BProgress](https://bprogress.vercel.app/). You can install them when creating your app:

```ts
import { createVortex } from '@westacks/vortex';
import inertia from '@westacks/vortex/inertia';
import bprogress from '@westacks/vortex/bprogress';

createVortex((target, page, install, ssr) => {
    install(inertia(page.get()), bprogress());
    // ...your app setup
});
```

## Creating Your Own Extension

You can easily plug your own extension into Vortex with followind template:

```ts
import type { VortexExtension } from '@westacks/vortex';

export default const extension: VortexExtension = ({ request, response }) => {
    // initial configuration

    // @see https://axios-http.com/docs/interceptors
    const req = request.use(
        (config) => config, // Modify request config, e.g. add headers etc
        (error) => Promise.reject(error), // Handle error
    );

    const res = response.use(
        (response) => response, // Handle response data (after receiving response)
        (error) => Promise.reject(error), // Handle error
    );

    return () => {
        // Cleanup
        request.eject(req)
        response.eject(res)
    }
}
```

```ts
import { createVortex } from '@westacks/vortex';
import extension from './extension';

createVortex((target, page, install, ssr) => {
    install(extension);
    // ...your app setup
});
```
