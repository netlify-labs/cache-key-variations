# Cache key variations on Netlify

This is a demo of using `Netlify-Vary` on Netlify Edge, with an example of how
to take advantage of Netlify's cache key variations feature to customise
how your dynamic content is cached on Netlify's CDN.

Visit [the demo site](https://cache-key-variations.netlify.app/) to see this in action.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-labs/cache-key-variations)

Netlify now supports a custom `Netlify-Vary` header, which instructs Netlify’s edge
on how to better cache and serve dynamic assets using Netlify’s Edge Cache with
Netlify Functions or external services proxied to using redirect rules, giving
fine grained control over which parts of a request need to match the cached object.

## How do cache key variations work?

`Netlify-Vary` takes a set of comma delimited instructions for what parts of the request to vary on:

- `query` vary by request URL query parameters
- `header` vary by the value of a request header
- `language` vary by the languages from the `Accept-Language` request header
- `country` vary by the country inferred from doing the GeoIP lookup on the request IP address
- `cookie` vary by a value of a request cookie

These instructions, together with the request URL, will define the cache key which Netlify uses to uniquely identify a cached object in our CDN.

Here’s an example of a Function that supports the product catalog for an e-commerce site, and will be cached on Netlify Edge. Its cache key will vary depending on:
- where the client is located (so different countries can have different product offerings)
- the `productType` requested on the incoming request URL query parameter (so
  other query parameters such as `_utm` or session identifiers for analytics
  don't affect the cache hit rate for this content)

```jsx
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const productType: string = event.queryStringParameters?.productType;
    const resp = await fetch('https://your-api.com/catalog?productType='+productType)
    const json = await resp.json()

    const headers = {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=0, must-revalidate", // Tell browsers to always revalidate
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, must-revalidate", // Tell Edge to cache asset for up to a year
        "Netlify-Vary": "query=productType,header=X-Country"
    }

    return {
        statusCode: 200,
        body: `<!doctype html><html>
        <head>
            <title>E-commerce catalog</title>
        </head>
        <body>
            <h2>Catalog</h2>
            <ul>${json.map((item) => `<li>${item.title}</li>`).join("\n")}</ul>
        </body><html>`,
	headers
    }
};

export { handler };
```

In this example, different cache objects are created for different matches to
the instructions, and a single additional cache object is created for all
non-matches. For example, the content from a request to `yoursite.com/catalog?productType=clothes`
and a request to `yoursite.com/catalog` (no query parameter) will have separate
cache keys, but requests to `yoursite.com/catalog` and
`yoursite.com/catalog?otherParam=something` will have the same cache key.
