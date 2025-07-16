# Navigation

## Basic Usage
To navigate between pages, use Vortex's underlying [Axios](https://axios-http.com/) instance.

To navigate to a specific page, all you have to do, is make a request using `axios`:

```js
import { axios } from "@westacks/vortex"

axios.get("/about")

axios.post("/contact", {
    name: "John Doe",
    email: "qRr6S@example.com",
    message: "Hello!"
})

// And so on...

// Additional method to reload current URL. Uses GET request by default
axios.reload({ /* config */ })
```

### Anchor Elements

For anchor links, you will need manually change default `click` handler. We recommend creating a component or directive, so you could reuse it across your application:

```js
// TODO: add framework examples
import { axios } from "@westacks/vortex"

const onClick = (event) => event.preventDefault() || axios.get(event.target.href)
```

## State Preservation

Sometimes you need to [preserve](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) current state when navigating between pages. To do this you can use `vortex.preserve` option when making request:

```js
import { axios } from "@westacks/vortex"

axios.get("/about", {
    vortex: { preserve: true }
})
```

## Plain AJAX Requests

If you want to make a plain AJAX request, without additional Vortex headers, you can set `vortex` option to `false`, or use different `axios` instance:

::: tabs
== Vortex
```js
import { axios } from "@westacks/vortex"

axios.get("/api/auth", { vortex: false })
```
== Plain Axios
```js
import axios from "axios"

axios.get("/api/auth")
```
:::
## Manually Changing Pages

In rare case, you may want to manually modify current page of your application. To do this you can use `setPage` function:

```js
import { setPage, getPage } from "@westacks/vortex"

setPage((page) => ({
    ...page,
    component: "Loading"
}))

// or...

setPage({...getPage(), component: "Loading"})
```
