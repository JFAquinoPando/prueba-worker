# Manual de Proyecto: Cloudflare Worker CRUD con D1

Este documento detalla la arquitectura, configuración, uso e historial de desarrollo del proyecto `prueba-worker`.

## 1. Descripción del Proyecto
`prueba-worker` es una API RESTful construida sobre **Cloudflare Workers** que permite gestionar un catálogo de personajes (nombre, ki, descripción e imagen). Utiliza **Cloudflare D1** como base de datos SQLite persistente en el borde (edge).

## 2. Arquitectura y Tecnologías
A diferencia de un backend tradicional en Node.js que podría usar Express.js, este proyecto utiliza un **Fetch Handler estándar de Cloudflare Workers**.

### ¿Por qué no usamos Express.js?
Cloudflare Workers no es un entorno Node.js completo; es un runtime basado en V8 optimizado para baja latencia. 
- **Eficiencia**: El Fetch Handler nativo es extremadamente ligero.
- **Protocolos**: Maneja directamente objetos `Request` y `Response` del estándar Web Fetch API.
- **Routing**: Implementamos un enrutador manual basado en `url.pathname` para mantener el proyecto sin dependencias externas pesadas.

## 3. Estructura del Código y Módulos (ESM)
Es posible que notes que usamos `export default { async fetch(...) }`. Aquí te explico por qué:

### Módulos de ES (ESM) vs Service Worker
Cloudflare Workers evolucionó de una sintaxis antigua basada en `addEventListener("fetch", ...)` (estilo Service Worker) a la sintaxis moderna de **ES Modules**.
- **`export default`**: Al usar esta palabra clave, le indicamos a Cloudflare que este archivo es un **Módulo**. Wrangler (la herramienta de desarrollo) detecta esto automáticamente y empaqueta el código como tal, por lo que no siempre es estrictamente necesario poner `"type": "module"` en el `package.json`, aunque es una buena práctica.
- **Parámetros del Fetch Handler**:
    - `request`: Representa la petición entrante.
    - `env`: Es el objeto que contiene todas las **Variables de Entorno** y **Bindings** (como nuestra base de datos `DB`). Sin este objeto, no podríamos acceder a D1.
    - `ctx`: (Opcional) Contexto de ejecución para tareas en segundo plano.

### El bloque `try...catch` global
En un servidor tradicional, si el código falla, el proceso podría reiniciarse. En un Worker:
- Si no hay un `try...catch` y ocurre un error, Cloudflare devolverá una página de error genérica ("Worker threw exception").
- Usar un `try...catch` nos permite capturar errores de la base de datos o de parsing y devolver una `Response` personalizada (como un error 500 con un mensaje JSON), lo cual es vital para el debugging de APIs.

## 4. Configuración de Base de Datos (D1)
La base de datos se llama `prueba_cloud`. La tabla principal es:

```sql
CREATE TABLE "personajes" (
    "nombre" TEXT,
    "ki" TEXT,
    "descripcion" TEXT,
    "imagen" BLOB
);
```

### Vinculación (Binding)
En el archivo `wrangler.toml`, la base de datos se vincula al Worker bajo la variable `env.DB`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "prueba_cloud"
database_id = "6b24e859-d7ee-429f-af31-18160a40a9d1"
```

## 4. Guía de Uso de la API

### Endpoints Disponibles

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **GET** | `/` | Lista todos los personajes (devuelve URLs para las imágenes). |
| **GET** | `/character/:nombre` | Obtiene los detalles de un personaje específico. |
| **GET** | `/character/:nombre/image` | Sirve la imagen binaria directamente (Content-Type: image/webp). |
| **POST** | `/` | Crea un nuevo personaje (Requiere `multipart/form-data`). |
| **PUT** | `/character/:nombre` | Actualiza datos o imagen de un personaje. |
| **DELETE** | `/character/:nombre` | Elimina un personaje. |

### Ejemplos con `curl`

**Crear un personaje:**
```bash
curl -X POST -F "nombre=Goku" -F "ki=9000" -F "descripcion=Saiyan" -F "imagen=@ruta/al/archivo.webp" http://127.0.0.1:8787/
```

**Ver JSON de personajes:**
```bash
curl http://127.0.0.1:8787/
```

## 5. Desarrollo y Pruebas Locales

1. **Instalación**: `npm install`
2. **Modo Desarrollo (Remoto)**: `npx wrangler dev --remote`
   - *Nota*: Usamos `--remote` para interactuar con la base de datos real de Cloudflare desde el entorno local. Requiere autenticación via navegador.
3. **Despliegue**: `npx wrangler deploy`

## 6. Historial de Decisiones y Mejoras
- **Manejo de Imágenes**: Inicialmente, el API devolvía el binario de la imagen dentro del JSON como un array de números. Se decidió implementar la **Opción A**: un endpoint dedicado (`/image`) que sirve el binario real con las cabeceras HTTP correctas.
- **URLs en JSON**: Se modificó la respuesta del listado para que en lugar de enviar datos binarios pesados, envíe una ruta relativa hacia el endpoint de la imagen, haciendo el API más limpio y fácil de integrar con frontends.
- **Corrección de Binarios**: Se descubrió que D1 puede devolver el BLOB como un objeto de valores. Se implementó una conversión a `Uint8Array` para asegurar que el navegador reciba un flujo binario válido.

---
*Manual generado el 10 de mayo de 2026.*
