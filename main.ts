const kv = await Deno.openKv();

// Set global state
const top_key = ["top_val", "val"];
const top = await kv.get(top_key);
console.log(top);

if (top.value == null) {
  await kv.set(top_key, 0);
}

const url: URL_KV = { url_key: "1", url_val: "https://www.google.com" };
await kv.set(["urls", url.url_key], url);

interface Url_KV {
  url_key: string;
  url_val: string;
}

// Handler
const URL_KEY_ROUTE = new URLPattern({ pathname: "/:id" });
const INST = new URLPattern({ pathname: "/set/inst" });
const URL_SET = new URLPattern({ pathname: "/set/:id/*" });

async function handler(req: Request): Response {
  const match_key = URL_KEY_ROUTE.exec(req.url);
  const match_inst = INST.exec(req.url);
  if (URL_SET.test(req.url)) {
    // Check for /set/:id/
    // Set key value pair
    console.log("Set key value pair");

    const url_key = req.url.split("/set/")[1].split("/")[0];
    const url_val = req.url.split("/set/")[1].split(url_key + "/")[1];

    console.log("url key: " + url_key);
    console.log("url val: " + url_val);

    if (url_key == "1") {
      return new Response(`1 is default key, please try another value`);
    }

    const url: URL_KV = { url_key: url_key, url_val: url_val };
    await kv.set(["urls", url.url_key], url);

    return new Response(`For url "${url_val}", key set to: ${url_key}`);
  } else if (match_key && match_key.pathname.groups.id !== "favicon.ico") {
    // Check for /:id
    // Fetching value for key: id
    console.log("Forwarding..");

    const id = match_key.pathname.groups.id;
    console.log("id: " + id);

    const record = await kv.get(["urls", id]);
    if (record.value == null) {
      // sanitize data
      return new Response(`Url for key: ${id}, not found`, {
        status: 404,
      });
    }

    const url: Url_KV = record.value as Url_KV;

    return Response.redirect(url.url_val);
  } else if (match_inst && match_inst.pathname.groups.id !== "favicon.ico") {
    const message: string = `To set a new key for a url, go to route:
  https://short.apurva-mishra.com/set/{key}/{url}

Replace {key} and {url} with:
  key = desired key for given url
  url = url associated with key

Example:
  https://short.apurva-mishra.com/set/1/https://www.google.com

------------------------------------------

To use the service for assciated key, go to
  https://short.apurva-mishra.com/{key}

Example:
  https://short.apurva-mishra.com/1
`;
    return new Response(message);
  } else {
    return new Response(
      "You are on incorrect path, please go to /set/inst for instructions",
      {
        status: 404,
      },
    );
  }
}

Deno.serve(handler);
