import { supabase } from "./supabase";

// The chat is processed by the n8n workflow in n8n/wally-chat.json. It receives the user's
// session so the movement is saved as them (RLS applies) and the Gemini key stays in n8n.
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// message: { text } or { audio: { base64, mimeType } }
// history: [{ role: "user" | "model", text }]
export const processChatMessage = async (message, history = []) => {
    if (!WEBHOOK_URL) {
        return { text: "Falta configurar VITE_N8N_WEBHOOK_URL con la URL del webhook de n8n.", status: "error" };
    }

    const send = (session) => fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ...message, history }),
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { text: "Tu sesión venció. Volvé a iniciar sesión.", status: "error" };

    let response = await send(session);
    // The workflow rejected the session: try a fresh token once; if Supabase no longer knows
    // this session (closed from another device), sign out here so the app shows the login
    if (response.status === 401) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (error || !refreshed.session) {
            await supabase.auth.signOut({ scope: "local" });
            return { text: "Tu sesión se cerró. Volvé a iniciar sesión.", status: "error" };
        }
        response = await send(refreshed.session);
    }

    // The workflow answers errors with a message for the user too; anything else is a broken setup
    const data = await response.json().catch(() => null);
    if (!data?.text) throw new Error(`n8n respondió ${response.status}`);
    return data;
};

// Movements are dated in Argentina time (UTC-3). Lists sort and group by created_at, so it carries
// the real moment: the spoken time, or now if it's today, or noon of that day
const createdAt = (fecha, hora) => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Cordoba" }).format(new Date());
    if (hora) return `${fecha}T${hora}:00-03:00`;
    return fecha === today ? new Date().toISOString() : `${fecha}T12:00:00-03:00`;
};

// Saves a draft the user confirmed in the chat (RLS sets it as theirs)
export const saveTransaction = ({ hora, ...fields }) =>
    supabase.from("transactions").insert({ ...fields, created_at: createdAt(fields.fecha, hora) }).select().single();

export const undoTransaction = (id) => supabase.from("transactions").delete().eq("id", id);
