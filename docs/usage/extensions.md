# Extensions API

Vortex allows you easily extend your navigation logic on runtime. Extensions use [axios interceptors](https://axios-http.com/docs/interceptors) to "glue in" between your requests and responses.

## Installing extensions
```typescript
import { extend, type VortexExtension } from '@westacks/vortex'

const extension: VortexExtension = ({ request, response }) => ({
    request: request.use(
        function (request) {
            // Modify request config, e.g. add headers, any custom logic
        },
        function (error) {
            // Handle error
        }
    ),
    response: response.use(
        function (response) {
            // Handle response
        },
        function (error) {
            // Handle error
        }
    )
})

// Add extension
const dispose = extend(extension)

// You may remove extensions at any time you want by calling destructor function
dispose()
```

## Examples

### NProgress
Adds simple progress indicator on top of the page
```typescript
import type { VortexExtension } from '@westacks/vortex'
import NProgress from 'nprogress'

export default ({ request, response }) => ({
    request:request.use(
        function (config) {
            NProgress.start();
            return config;
        },
        function (error) {
            NProgress.done();
            return Promise.reject(error);
        }
    ),
    response: response.use(
        function (response) {
            NProgress.done();
            return response;
        },
        function (error) {
            NProgress.done();
            return Promise.reject(error);
        }
    )
}) as VortexExtension
```

## Community extensions

Feel free to share your extensions by creating Pull Request on [GitHub](https://github.com/westacks/vortex)

- _No one done anything yet, we've just released._