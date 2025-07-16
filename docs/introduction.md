# Welcome to Vortex

Vortex is a framework-agnostic binding layer designed to simplify building reactive, modern web applications with server-driven routing. Highly inspired by [Inertia.js](https://inertiajs.com/), but build with a philosophy that you should own all your code. It provides a flexible core with adapters for popular frontend frameworks, enabling seamless integration with your favorite tools.

Whether you're building with React, Vue, Svelte, SolidJS or other frameworks, Vortex offers:

- Declarative and reactive state management
- Powerful routing and navigation handling
- Easy integration with backend-driven frontends like [Inertia.js](https://inertiajs.com/)
- Extensible plugin system for enhanced functionality

This documentation will guide you through getting started, key concepts, and advanced usage patterns to help you make the most out of Vortex.

## Getting Started

This guide will help you quickly set up a new Vortex project and get your first reactive app running.

### Installation

Install Vortex using npm or package manager of your choice:

```bash
npm install @westacks/vortex
```

### Basic Usage

Now you are ready to create your first Vortex app:

```ts
// app.js
import { createVortex } from '@westacks/vortex';

createVortex(async (target, page, install, ssr) => {
  // Install Vortex extensions and mount the app
})

```


## Core Features

- **Reactive State**: Signal based approach allows easy integration with any frontend framework
- **Routing**: Built-in routing integrations and navigation helpers
- **Plugins**: Extend Vortex with official and custom plugins
- **Multi-framework Support**: Adapters available for React, Vue, Svelte, and SolidJS
