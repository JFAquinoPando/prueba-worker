# Project Overview
`prueba-worker` is a Cloudflare Worker that provides a CRUD API for a character database stored in D1. It handles character information including names, ki levels, descriptions, and images (stored as BLOBs).

# Project Type
**Code Project**: Cloudflare Worker (Node.js)

# Building and Running
- **Install Dependencies**: `npm install`
- **Local Development**: `npx wrangler dev`
- **Deploy**: `npx wrangler deploy`

# API Endpoints
- `GET /`: List all characters.
- `GET /character/:nombre`: Get a specific character by name.
- `POST /`: Create a new character. Requires multipart/form-data with `nombre`, `ki`, `descripcion`, and `imagen`.
- `PUT /character/:nombre`: Update an existing character.
- `DELETE /character/:nombre`: Delete a character.

# Development Conventions
- Uses native Fetch handler for routing.
- D1 database is bound to the `DB` variable.
- Images are processed as `ArrayBuffer` and stored as `BLOB`.
