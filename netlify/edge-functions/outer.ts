import type { Context, Config } from "@netlify/edge-functions";

const correctGuess = 11034;

export default async (request: Request, context: Context) => {
    // Only transform query on guess submission
    const url = new URL(request.url);
    const guessStr = url.searchParams.get("value");
    if (url.pathname !== "/guess") {
        return context.next();
    }

    const newURL = new URL("/", request.url);
    // Look for the query parameter and rewrite the form answer
    // into something with lower cardinality
    const guess = +guessStr;
    const guessParams = new URLSearchParams();
    if (guess < correctGuess) {
        guessParams.set("value", "too_low");
    } else if (guess > correctGuess) {
        guessParams.set("value", "too_high");
    } else {
        guessParams.set("value", "correct");
    }
    newURL.search = guessParams.toString();

    return newURL;
};

export const config: Config = {
  path: "/*"
}
