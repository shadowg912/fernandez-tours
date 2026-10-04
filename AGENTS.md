# Fernández Tours — Reglas del proyecto

## 🔒 REGLA ESENCIAL — Base de datos

1. Toda migración o cambio de esquema se prueba **PRIMERO** en la base de datos de develop (`fernandez-tours-develop`).
2. **PROHIBIDO** ejecutar migraciones, seeds, o **cualquier escritura** en la base de datos de producción (Supabase, proyecto `obnivwnlerwuasvsigzc`) **sin autorización explícita del usuario en esa misma conversación**. La autorización debe pedirse siempre, aunque se haya autorizado antes. Solo lecturas simples de verificación están permitidas sin autorización, y preferiblemente también preguntar primero.
3. **Nunca** commitear credenciales ni connection strings: solo se guardan en `.env.local` (ignorado por git).
4. Los scripts de migración viven en `supabase/migrations/` y se aplican con:
   - `npm run db:migrate:develop` — entorno de pruebas
   - `npm run db:migrate:production` — requiere confirmación interactiva

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Supabase CLI para migraciones (`npx supabase ...`)
- Demo visual: la UI usa mock data en `lib/data.ts` mientras se conecta la base de datos.

## Verificación obligatoria tras cambios

`npx tsc --noEmit && npm run lint && npm run build`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
