export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // GET / - List all characters
      if (method === "GET" && path === "/") {
        const { results } = await env.DB.prepare("SELECT * FROM personajes").all();
        const formattedResults = results.map(p => ({
          ...p,
          imagen: `/character/${encodeURIComponent(p.nombre)}/image`
        }));
        return Response.json(formattedResults);
      }

      // GET /character/:nombre/image - Serve character image
      if (method === "GET" && path.startsWith("/character/") && path.endsWith("/image")) {
        const nombre = decodeURIComponent(path.split("/")[2]);
        const result = await env.DB.prepare("SELECT imagen FROM personajes WHERE nombre = ?").bind(nombre).first();
        
        if (!result || !result.imagen) {
          return new Response("Image Not Found", { status: 404 });
        }

        // Convertimos el resultado a Uint8Array para asegurar que se envíe como binario puro
        const binaryImageData = new Uint8Array(Object.values(result.imagen));

        return new Response(binaryImageData, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }

      // GET /:id - Get character by ID (Assuming we might want to add an ID column or use nombre as key)
      // Since the table provided doesn't have an explicit ID, we'll use 'nombre' for lookups for now
      // or assume the user might add a ROWID. Let's use 'nombre' as a filter if provided in query or path.
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

      // POST / - Create character
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
        )
          .bind(nombre, ki, descripcion, imagenBlob)
          .run();

        return new Response("Character created successfully", { status: 201 });
      }

      // PUT /character/:nombre - Update character
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

        if (nombre) { updates.push("nombre = ?"); params.push(nombre); }
        if (ki) { updates.push("ki = ?"); params.push(ki); }
        if (descripcion) { updates.push("descripcion = ?"); params.push(descripcion); }
        if (imagenFile && typeof imagenFile !== 'string') { 
          updates.push("imagen = ?"); 
          params.push(await imagenFile.arrayBuffer()); 
        }

        if (updates.length === 0) return new Response("No fields to update", { status: 400 });

        query += updates.join(", ") + " WHERE nombre = ?";
        params.push(targetNombre);

        await env.DB.prepare(query).bind(...params).run();
        return new Response("Character updated successfully");
      }

      // DELETE /character/:nombre - Delete character
      if (method === "DELETE" && path.startsWith("/character/")) {
        const nombre = decodeURIComponent(path.split("/")[2]);
        await env.DB.prepare("DELETE FROM personajes WHERE nombre = ?").bind(nombre).run();
        return new Response("Character deleted successfully");
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
