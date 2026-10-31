// WallyBot: procesa los mensajes del chat con Gemini y guarda las transacciones confirmadas.
// La API key de Gemini vive solo acá (secret GEMINI_API_KEY), nunca en el frontend.
import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai@0.24.1";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

const SYSTEM_INSTRUCTION = `Eres WallyBot, un asistente financiero que ayuda a registrar movimientos.

            FLUJO PARA NUEVOS GASTOS/INGRESOS:
            1. Cuando recibas datos de un movimiento (ej: "gasté 500 en café"):
               - NO guardes nada todavía.
               - Muestra la información estructurada como una LISTA:
                 • **Monto:** [valor]
                 • **Descripción:** [valor]
                 • **Categoría:** [valor]
                 • **Fecha:** [valor]
                 • **Tipo:** [Gasto/Ingreso]
               - Pregunta: "¿Deseas subir esta información? (Si / No / Editar)"

            2. Si el usuario dice "si":
               - LLAMA a la función 'saveTransaction' con los datos mostrados.
               - Responde confirmando que se guardó.

            3. Si el usuario dice "no":
               - Responde diciendo que se canceló el registro.

            4. Si el usuario dice "editar":
               - Pregunta qué campo desea cambiar.

            REGLAS IMPORTANTES:
               - Usa 'otros' si no sabes la categoría.
               - Usa 'hoy' si no sabes la fecha.
               - Sé breve y directo. Siempre en español.`;

const tools = [
    {
        functionDeclarations: [
            {
                name: "saveTransaction",
                description: "Guarda definitivamente la transacción en la base de datos.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        monto: { type: SchemaType.NUMBER },
                        descripcion: { type: SchemaType.STRING },
                        tipo: { type: SchemaType.STRING, format: "enum", enum: ["gasto", "ingreso"] },
                        categoria: { type: SchemaType.STRING },
                        fecha: { type: SchemaType.STRING },
                    },
                    required: ["monto", "descripcion", "tipo", "categoria", "fecha"],
                },
            },
        ],
    },
];

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        return json({
            text: "⚠️ Falta la API Key de Gemini. Configúrala como secret GEMINI_API_KEY en Supabase.",
            status: "error",
        });
    }

    // Cliente con el JWT del usuario: las políticas RLS se aplican como si fuera él
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    try {
        const { input, history = [], isAudio = false } = await req.json();

        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const chat = model.startChat({ history, tools });

        const result = isAudio
            ? await chat.sendMessage([
                { inlineData: { data: input.base64, mimeType: input.mimeType } },
                { text: "Procesa este audio según las instrucciones de registro financiero." },
            ])
            : await chat.sendMessage(input);

        const response = result.response;
        const userTurn = { role: "user", parts: [{ text: isAudio ? "🎤 [Audio enviado]" : input }] };

        const call = response.functionCalls()?.[0];
        if (call?.name === "saveTransaction") {
            const { monto, descripcion, tipo, categoria, fecha } = call.args as Record<string, string>;

            const { error: insertError } = await supabase.from("transactions").insert({
                user_id: user.id,
                monto: Number(monto),
                descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
                tipo: tipo.toLowerCase(),
                categoria: categoria.toLowerCase(),
                fecha: fecha || "hoy",
            });
            if (insertError) throw insertError;

            const text = `✅ ¡Listo! He guardado tu ${tipo} de $${monto} en la categoría "${categoria}".`;
            return json({
                text,
                status: "success",
                newHistory: [...history, userTurn, { role: "model", parts: [{ text }] }],
            });
        }

        const text = response.text();
        return json({
            text,
            status: "success",
            newHistory: [...history, userTurn, { role: "model", parts: [{ text }] }],
        });
    } catch (error) {
        console.error("Error in WallyBot:", error);
        return json({
            text: "Lo siento, tuve un problema procesando tu solicitud. ¿Podrías repetirlo?",
            status: "error",
        });
    }
});
