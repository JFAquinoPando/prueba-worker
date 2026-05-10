# Plan: Cloudflare Worker CRUD with D1

This plan outlines the steps to create a Cloudflare Worker that provides a CRUD API for a character database stored in D1.

## Objective
Implement a full CRUD (Create, Read, Update, Delete) API for the `personajes` table in a Cloudflare D1 database using a native Fetch handler.

## Key Files & Context
- `wrangler.toml`: Configuration for the worker and D1 binding.
- `src/index.js`: Main worker logic.
- `package.json`: Project dependencies and scripts.

## Implementation Steps

### 1. Project Initialization
- Initialize a Node.js project.
- Install `wrangler` as a development dependency.
- Create a `wrangler.toml` file with the following D1 configuration:
  ```toml
  name = "prueba-worker"
  main = "src/index.js"
  compatibility_date = "2024-05-10"

  [[d1_databases]]
  binding = "DB"
  database_name = "prueba_cloud"
  database_id = "6b24e859-d7ee-429f-af31-18160a40a9d1"
  ```

### 2. Implement CRUD Logic (`src/index.js`)
- **Routing**: Use a simple URL-based router within the `fetch` handler.
- **POST `/`**: Create a new character (based on the provided example).
- **GET `/`**: List all characters.
- **GET `/:id`**: Fetch a single character by ID.
- **PUT `/:id`**: Update an existing character's data and/or image.
- **DELETE `/:id`**: Remove a character from the database.

### 3. Image Handling
- Use `request.formData()` to handle multipart/form-data for creations and updates.
- Convert image files to `ArrayBuffer` for storage as `BLOB` in D1.
- Provide a dedicated endpoint or response type to serve the stored images if needed.

## Verification & Testing
- Use `wrangler dev` to test locally.
- Test endpoints using `curl` commands:
  - **Create**: `curl -X POST -F "nombre=Goku" -F "ki=9000" -F "descripcion=Saiyan" -F "imagen=@path/to/img.png" http://localhost:8787/`
  - **List**: `curl http://localhost:8787/`
  - **Get**: `curl http://localhost:8787/1`
  - **Update**: `curl -X PUT -F "ki=10000" http://localhost:8787/1`
  - **Delete**: `curl -X DELETE http://localhost:8787/1`
