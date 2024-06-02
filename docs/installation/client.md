# Client-Side Installation

Once you have prepared [server-side](/installation/server.md) adapter, you will need to setup your client-side framework.

## Install Dependencies

First, you need to install Vortex client:

::: tabs

== npm
```shell
npm install @westacks/vortex
```
== yarn
```shell
yarn add @westacks/vortex
```
== pnpm
```shell
pnpm add @westacks/vortex
```
== bun
```shell
bun add @westacks/vortex
```
:::

## Initialize Application

Next, initialize Vortex client and create your application root:

::: tabs
== Svelte
For Svelte 5, your entry file should have `svelte.js` extension and you will update your root props using `$state` rune:

**_app.svelte.js_**
```js
import { createVortex, subscribe, install } from '@westacks/vortex';
import { core } from '@westacks/vortex/extensions'
import { props as getProps } from './setup';
import { mount, hydrate } from 'svelte'
import App from './App.svelte';

createVortex(async (target, page, ssr) => {
    const props = $state(await getProps(page))
    const h = ssr ? hydrate : mount

    h(App, {target, props})

    install(core())
    subscribe(async (page) => Object.assign(props, await getProps(page)))
})
```
Or in case you use older version of Svelte, you can use legacy class component syntax:

**_app.js_**

```js
import { createVortex, subscribe, install } from '@westacks/vortex'
import { core } from '@westacks/vortex/extensions'
import { props } from './setup'
import App from './App.svelte'

createVortex(async (target, page, hydrate) => {
    const app = new App({ target, props: await props(page), hydrate })

    install(core())
    subscribe(async (page) => app.$set(await props(page)))
})
```
You will need to resolve page component, using your bundler's API. We will provide example for Vite as most popular, but code below may differ depending on bundler you are using.

**_setup.js_**

```js
export const props = async (page) => {
    const pages = import.meta.glob('./pages/**/*.svelte')
    const component = (await pages[`./pages/${page.component}.svelte`])?.default

    return { component, props: page.props ?? {} }
}
```
**_App.svelte_**
```svelte
<script>
    export let component, props
</script>

{#if component}
    <component this={component} {...props} />
{/if}
```
== Solid
**_app.jsx_**

Create application root and subscribe to page changes.
```jsx
import { createVortex, subscribe, install } from '@westacks/vortex';
import { core } from '@westacks/vortex/extensions';
import { createSignal } from 'solid-js';
import { render, hydrate } from 'solid-js/web'
import { App, props } from './setup';

createVortex(async (target, page, ssr) => {
    const [getProps, setProps] = createSignal(await props(page))
    const h = ssr ? hydrate : render

    h(() => <App getProps={getProps}/>, target)

    install(core())
    subscribe(async (page) => setProps(await props(page)))
})

```
**_setup.jsx_**

Here we will define application root and page component resolver. You will need to resolve page component, using your bundler's API. We will provide example for Vite as most popular, but code below may differ depending on bundler you are using.
```jsx
import { Dynamic } from "solid-js/web"

export const App = function ({ getProps }) {
    const component = () => getProps().component
    const props = () => getProps().props

    return <Dynamic component={component()} {...props()} />
}

export const props = async (page) => {
    const pages = import.meta.glob('./pages/**/*.jsx')
    const component = (await pages[`./pages/${page.component}.jsx`])?.default

    return { component, props: page.props ?? {} }
}
```
== Vue
TODO
== React
TODO
== Angular
TODO
:::

After that you may start creating components in `./pages` directory. Each time vortex initiates page change, it will resolve corresponding component, provide it with props and render it.

You are not glued to use app structure provided above, so you may modify it as you wish for your use-cases (layouts, loading states, etc).

## Server-Side Rendering

Optionally, you can setup bundle for server-side rendering (SSR), which can be utilized by your server to pre-render pages of your application:

::: tabs
== Svelte
Svelte 5

**_ssr.js_**
```js
import { createVortexServer } from '@westacks/vortex/server'
import { render } from 'svelte/server'
import { props } from './setup'
import App from './App.svelte'

createVortexServer(async (page) => {
    const {html, head} = render(App, {props: await props(page)})

    // You should return data type, that compatible with your server API
    return {body: html, head}
})

```
Svelte (legacy)

**_ssr.js_**
```js
import { createVortexServer } from '@westacks/vortex/server'
import { props } from './setup'
import App from './App.svelte'

createVortexServer(async (page) => {
    const {html, head} = App.render(await props(page))

    // You should return data type, that compatible with your server API
    return {body: html, head}
})

```
== Solid
**_ssr.jsx_**
```jsx
import { createVortexServer } from '@westacks/vortex/server'
import { renderToString, generateHydrationScript, getAssets } from 'solid-js/web'
import { App, props } from './setup'

createVortexServer(async (page) => {
    const props = await props(page)
    const body = renderToString(() => <App getProps={() => props} />)

    // You should return data type, that compatible with your server API
    return {body, head: [getAssets(), generateHydrationScript()]}
})

```
== Vue
TODO
== React
TODO
== Angular
TODO
:::

### Using SSR bundle

SSR bundle takes page data as input and returns pre-rendered HTML strings based on your client-side logic. You will need a JavaScript runtime configured on your server to use it:

#### Server Mode

::: tabs
== Node.js
```shell
node ./dist/ssr.js
```
== Deno
```shell
deno run --allow-net ./dist/ssr.js
```
== Bun
```shell
bun run --bun ./dist/ssr.js
```
:::

```shell
curl -X POST http://localhost:13714/render \
    -H 'Content-Type: application/json' \
    -d '{"component":"Page","props":{},"url": "/","version":"..."}'
```

#### CLI Mode

::: tabs
== Node.js
```shell
node ./dist/ssr.js '{"component":"Page","props":{},"url": "/","version":"..."}'
```
== Deno
```shell
deno run ./dist/ssr.js '{"component":"Page","props":{},"url": "/","version":"..."}'
```
== Bun
```shell
bun run --bun ./dist/ssr.js '{"component":"Page","props":{},"url": "/","version":"..."}'
```
:::