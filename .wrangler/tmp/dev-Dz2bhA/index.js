var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-855zVf/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    try {
      if (method === "GET" && path === "/") {
        const { results } = await env.DB.prepare("SELECT * FROM personajes").all();
        const formattedResults = results.map((p) => ({
          ...p,
          imagen: `/character/${encodeURIComponent(p.nombre)}/image`
        }));
        return Response.json(formattedResults);
      }
      if (method === "GET" && path.startsWith("/character/") && path.endsWith("/image")) {
        const nombre = decodeURIComponent(path.split("/")[2]);
        const result = await env.DB.prepare("SELECT imagen FROM personajes WHERE nombre = ?").bind(nombre).first();
        if (!result || !result.imagen) {
          return new Response("Image Not Found", { status: 404 });
        }
        const binaryImageData = new Uint8Array(Object.values(result.imagen));
        return new Response(binaryImageData, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
      if (method === "GET" && path.startsWith("/character/")) {
        const nombre = decodeURIComponent(path.split("/")[2]);
        const result = await env.DB.prepare("SELECT * FROM personajes WHERE nombre = ?").bind(nombre).first();
        if (!result) return new Response("Not Found", { status: 404 });
        const formattedResult = {
          ...result,
          imagen: `/character/${encodeURIComponent(result.nombre)}/image`
        };
        return Response.json(formattedResult);
      }
      if (method === "POST" && path === "/") {
        const formData = await request.formData();
        const nombre = formData.get("nombre");
        const ki = formData.get("ki");
        const descripcion = formData.get("descripcion");
        const imagenFile = formData.get("imagen");
        if (!nombre || !ki || !imagenFile) {
          return new Response("Missing required fields", { status: 400 });
        }
        const imagenBlob = await imagenFile.arrayBuffer();
        await env.DB.prepare(
          "INSERT INTO personajes (nombre, ki, descripcion, imagen) VALUES (?, ?, ?, ?)"
        ).bind(nombre, ki, descripcion, imagenBlob).run();
        return new Response("Character created successfully", { status: 201 });
      }
      if (method === "PUT" && path.startsWith("/character/")) {
        const targetNombre = decodeURIComponent(path.split("/")[2]);
        const formData = await request.formData();
        const nombre = formData.get("nombre");
        const ki = formData.get("ki");
        const descripcion = formData.get("descripcion");
        const imagenFile = formData.get("imagen");
        let query = "UPDATE personajes SET ";
        const params = [];
        const updates = [];
        if (nombre) {
          updates.push("nombre = ?");
          params.push(nombre);
        }
        if (ki) {
          updates.push("ki = ?");
          params.push(ki);
        }
        if (descripcion) {
          updates.push("descripcion = ?");
          params.push(descripcion);
        }
        if (imagenFile && typeof imagenFile !== "string") {
          updates.push("imagen = ?");
          params.push(await imagenFile.arrayBuffer());
        }
        if (updates.length === 0) return new Response("No fields to update", { status: 400 });
        query += updates.join(", ") + " WHERE nombre = ?";
        params.push(targetNombre);
        await env.DB.prepare(query).bind(...params).run();
        return new Response("Character updated successfully");
      }
      if (method === "DELETE" && path.startsWith("/character/")) {
        const nombre = decodeURIComponent(path.split("/")[2]);
        await env.DB.prepare("DELETE FROM personajes WHERE nombre = ?").bind(nombre).run();
        return new Response("Character deleted successfully");
      }
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-855zVf/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-855zVf/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
