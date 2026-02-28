import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const processChatMessage = async (userInput, userId, history = [], isAudio = false) => {
    try {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            return {
                text: "⚠️ Falta la API Key de Gemini. Por favor, añádela al archivo .env como VITE_GEMINI_API_KEY.",
                status: "error"
            };
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Eres WallyBot, un asistente financiero que ayuda a registrar movimientos.

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
               - Sé breve y directo. Siempre en español.`
        });

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "saveTransaction",
                        description: "Guarda definitivamente la transacción en la base de datos.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                monto: { type: "NUMBER" },
                                descripcion: { type: "STRING" },
                                tipo: { type: "STRING", enum: ["gasto", "ingreso"] },
                                categoria: { type: "STRING" },
                                fecha: { type: "STRING" }
                            },
                            required: ["monto", "descripcion", "tipo", "categoria", "fecha"]
                        }
                    }
                ]
            }
        ];

        const chat = model.startChat({
            history: history,
            tools: tools
        });

        let result;
        if (isAudio) {
            // Valid multimodal way using chat.sendMessage to keep history intact
            result = await chat.sendMessage([
                { inlineData: { data: userInput.base64, mimeType: userInput.mimeType } },
                { text: "Procesa este audio según las instrucciones de registro financiero." }
            ]);
        } else {
            result = await chat.sendMessage(userInput);
        }

        const response = result.response;
        // Check for function calls first
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            const call = calls[0];
            if (call.name === "saveTransaction") {
                const { monto, descripcion, tipo, categoria, fecha } = call.args;

                await addDoc(collection(db, "messages"), {
                    categoria: categoria.toLowerCase(),
                    createdAt: new Date().toISOString(),
                    descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
                    fecha: fecha || "hoy",
                    monto: Number(monto),
                    tipo: tipo.toLowerCase(),
                    uid: userId
                });

                // Update chat history manually for the functional response
                const toolResponse = {
                    text: `✅ ¡Listo! He guardado tu ${tipo} de $${monto} en la categoría "${categoria}".`,
                    status: "success",
                    newHistory: [...history, { role: 'user', parts: [{ text: userInput }] }, { role: 'model', parts: [{ text: response.text() }] }]
                };
                return toolResponse;
            }
        }

        // Return current response and new history
        return {
            text: response.text(),
            status: "success",
            newHistory: [
                ...history,
                { role: 'user', parts: [{ text: isAudio ? "🎤 [Audio enviado]" : userInput }] },
                { role: 'model', parts: [{ text: response.text() }] }
            ]
        };

    } catch (error) {
        console.error("Error in WallyBot:", error);
        return {
            text: "Lo siento, tuve un problema procesando tu solicitud. ¿Podrías repetirlo?",
            status: "error"
        };
    }
};
