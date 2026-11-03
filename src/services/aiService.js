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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { text: "Tu sesión venció. Volvé a iniciar sesión.", status: "error" };

    const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ...message, history }),
    });

    // The workflow answers errors with a message for the user too; anything else is a broken setup
    const data = await response.json().catch(() => null);
    if (!data?.text) throw new Error(`n8n respondió ${response.status}`);
    return data;
};

export const undoTransaction = (id) => supabase.from("transactions").delete().eq("id", id);
