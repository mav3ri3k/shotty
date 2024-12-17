import { serveFile, serverDir } from "jsr:@std/http/file-server";
const kv = await Deno.openKv();

interface Url_KV {
  key: number;
  val: string;
}

const URL_KEY = new URLPattern({ pathname: "/:id" });
const URL_SET_VAL = new URLPattern({ pathname: "/set/" });

// Handler
async function handler(req: Request): Response {
  // set key val
  if (URL_SET_VAL.exec(req.url)) {
    // counter to top unused key
    const top_key = ["top_key", "key"];
    const top = await kv.get(top_key);

    if (top.value == null) {
      await kv.set(top_key, 1);
    }

    // parse request
    const data = await req.json();
    const url_kv: URL_KV = { key: top.value, val: data.val };

    // store in database
    await kv.set(["urls", url_kv.key], url_kv);
    await kv.set(top_key, top.value + 1);

    // return response
    const jsonResp = JSON.stringify(url_kv);
    return new Response(jsonResp, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // get key and redirect
  } else if (URL_KEY.exec(req.url)) {
    let id: number = parseInt(URL_KEY.exec(req.url).pathname.groups.id);

    const val = await kv.get(["urls", id]);

    if (val.value != null) {
      return Response.redirect(val.value.val);
    } else {
      return new Response("Invalid URL KEY", {
        status: 404,
      });
    }

    // return ui
  } else {
    return serveFile(req, "./main.html");
  }
}

Deno.serve(handler);
