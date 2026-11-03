## Wally

Una aplicación web para registrar gastos personalizados.    

## Tecnologías

- React
- Vite
- Supabase (Postgres, Auth, Realtime)
- n8n + Gemini (chat por texto y audio)
- Tailwind CSS

## Configuración

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_N8N_WEBHOOK_URL`.
3. Crear las tablas: pegar cada archivo de `supabase/migrations/`, en orden, en el SQL Editor de Supabase y ejecutarlo.
4. En Authentication → URL Configuration, agregar `http://localhost:5173` (y la URL de producción) a los Redirect URLs.
5. Login con Google (opcional): Authentication → Providers → Google, con el Client ID y Secret de Google Cloud.
6. Armar el chatbot en n8n:
   1. Crear una API key de Gemini en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (tiene plan gratis).
   2. En n8n: **Create workflow → ⋯ → Import from file** y elegir `n8n/wally-chat.json`.
   3. Abrir el nodo **Gemini** → Credential → **Create new** (tipo *Header Auth*): Name `x-goog-api-key`, Value la API key.
   4. Revisar el nodo **Config** (`supabaseUrl` tiene que ser la URL de tu proyecto) y **activar** el workflow.
   5. Abrir el nodo **Chat de Wally**, copiar la **Production URL** y ponerla en `VITE_N8N_WEBHOOK_URL` (en `.env` y en las variables de Netlify).

   El flujo recibe el texto o el audio junto con la sesión del usuario, le pide a Gemini el monto, motivo, fecha y observación, y guarda el movimiento en Supabase como ese usuario (las políticas RLS se aplican igual que en la app).

7. Levantar el proyecto:

```bash
npm install
npm run dev
```

Para darte rol de admin, ejecutá en el SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'tu@email.com';
```
