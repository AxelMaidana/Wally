## Wally

Una aplicación web para registrar gastos personalizados.    

## Tecnologías

- React
- Vite
- Supabase (Postgres, Auth, Realtime)
- n8n + Groq (chat por texto y audio: Whisper transcribe, un modelo de chat saca los datos)
- Tailwind CSS

## Configuración

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_N8N_WEBHOOK_URL`.
3. Crear las tablas: pegar cada archivo de `supabase/migrations/`, en orden, en el SQL Editor de Supabase y ejecutarlo.
4. En Authentication → URL Configuration, agregar `http://localhost:5173` (y la URL de producción) a los Redirect URLs.
5. Login con Google (opcional): Authentication → Providers → Google, con el Client ID y Secret de Google Cloud.
6. Armar el chatbot en n8n:
   1. Crear una API key en [console.groq.com/keys](https://console.groq.com/keys) (tiene plan gratis).
   2. En n8n: **Create workflow → ⋯ → Import from file** y elegir `n8n/wally-chat.json`.
   3. Crear una credencial de tipo *Header Auth* con Name `Authorization` y Value `Bearer <tu-api-key>`, y elegirla en los nodos **Transcribir audio** y **Groq**.
   4. Revisar el nodo **Config** (`supabaseUrl` tiene que ser la URL de tu proyecto; `modeloChat` y `modeloAudio` son los modelos de Groq) y **publicar** el workflow.
   5. Abrir el nodo **Chat de Wally**, copiar la **Production URL** y ponerla en `VITE_N8N_WEBHOOK_URL` (en `.env` y en las variables de Netlify).

   El flujo recibe el texto o el audio junto con la sesión del usuario, transcribe el audio con Whisper, le pide al modelo el monto, motivo, fecha, hora y observación, y le devuelve a la app un borrador. El chat lo muestra para guardarlo, editarlo o regrabarlo; al confirmar, la app lo guarda en Supabase con la sesión del usuario (RLS).

7. Levantar el proyecto:

```bash
npm install
npm run dev
```

Para darte rol de admin, ejecutá en el SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'tu@email.com';
```
