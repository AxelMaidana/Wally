import { supabase } from "./supabase";

// The Gemini call runs in the "wally-chat" Edge Function so the API key never reaches the browser
export const processChatMessage = async (userInput, history = [], isAudio = false) => {
    const { data, error } = await supabase.functions.invoke("wally-chat", {
        body: { input: userInput, history, isAudio }
    });

    if (error) {
        console.error("Error in WallyBot:", error);
        return {
            text: "Lo siento, tuve un problema procesando tu solicitud. ¿Podrías repetirlo?",
            status: "error"
        };
    }

    return data;
};
