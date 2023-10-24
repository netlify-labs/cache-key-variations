import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
    // let requests for other assets (such as .css) passthrough
    const url = new URL(request.url);
    if (url.pathname !== "/") {
        return;
    }

    const guessStr = url.searchParams.get("value");
    var guessContent = ``;
    if (guessStr === "too_low") {
        guessContent = `<p><strong>You guessed too low &#128532; Try again!</strong></p>`
    } else if (guessStr === "too_high") {
        guessContent = `<p><strong>You guessed too high &#128532; Try again!</strong></p>`
    } else if (guessStr === "correct") {
        guessContent = `<p><strong>You guessed correctly! &#128513;</strong></p>`
    }

    const cookiePayload = context.cookies.get("visited") === "true" ?
        `this is not the first time` :
        `this is the first time`;

    // always set cookie so we know you've visited this page
    context.cookies.set("visited", "true");

    const countryName = context.geo?.country?.name || "unknown";

    const body = `<!DOCTYPE html>
<html>
    <head>
        <title>Cache-key variations on Netlify</title>
        <link rel="stylesheet" href="/main.css">
    </head>
    <body>
        <div class="wrapper">
            <h1>Cache-key variations on Netlify</h1>

            <p>Cache-key variations are a powerful new tool in your arsenal.
            All the content you'll see on this page is served under the root URL with the help of
            <strong>Netlify Edge Functions</strong> and <strong>Cache-key variations</strong>!</p>

            <p>This page in particular was generated at <strong>${new Date}</strong>.</p>

            <p>You'll see different timestamps depending on:</p>

            <ul>
                <li><p>Whether it's your <strong>first time visiting this site</strong>. We know that <strong>${cookiePayload}</strong>
                you're visiting this site because we're setting a cookie on your browser (sorry), and we're <strong>
                varying the content based on one of the keys of that cookie</strong>.</p></li>

                <li><p><strong>Where you're located</strong>. We know that you're most likely from ${countryName} because Netlify does geolocation
                based on your IP address, and we're also <strong>varying content based on geolocation</strong>, so if that timestamp looks
                recent you're probably the first person in your country to see this page.</p></li>

                <li><p>Your <strong>answer to the question at the end of this page</strong>. Your answer is submitted as query parameter which
                we <strong>rewrite using an edge-function and vary this content on the rewritten query value.</strong></p></li>
            </ul>

            ${guessContent}

            <p><strong>How deep is the deepest point of the <a href="https://en.wikipedia.org/wiki/Mariana_Trench">Mariana Trench<strong></a>?</p>

            <form action="/guess" method="get">
                <input type="number" id="value" name="value"><br><br>
                <input type="submit" value="Submit">
            </form>
            <br>

            <p>Try reloading this page a couple of times and see how the content is served from the cache!</p>
        </div>
    </body>
</html>`;


    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/html",
            "Cdn-Cache-Control": "public, s-maxage=31536000, must-revalidate",
            "Cache-Control": "public, max-age=0, must-revalidate",
            "Netlify-Vary": "cookie=visited,header=X-Country,query=value"
        }
    });
};

export const config: Config = {
  cache: "manual",
  path: "/*"
}
