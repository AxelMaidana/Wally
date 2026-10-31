## Wally

Una aplicación web para registrar gastos personalizados.    

## Tecnologías

- React
- Vite
- Supabase (Postgres, Auth, Realtime, Edge Functions)
- Gemini (vía Edge Function)
- Tailwind CSS

## Configuración

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Crear las tablas: pegar `supabase/migrations/20261025000000_init.sql` en el SQL Editor de Supabase y ejecutarlo.
4. En Authentication → URL Configuration, agregar `http://localhost:5173` (y la URL de producción) a los Redirect URLs.
5. Login con Google (opcional): Authentication → Providers → Google, con el Client ID y Secret de Google Cloud.
6. Desplegar el chatbot:

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase secrets set GEMINI_API_KEY=<tu-api-key>
npx supabase functions deploy wally-chat
```

7. Levantar el proyecto:

```bash
npm install
npm run dev
```

Para darte rol de admin, ejecutá en el SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'tu@email.com';
```
