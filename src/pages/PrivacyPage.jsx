import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="space-y-4 mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Política de Privacidad</h1>
                <p className="text-zinc-500 font-medium">Última actualización: 17 de febrero de 2026</p>
            </div>

            <div className="glass-card rounded-3xl p-8 md:p-12 space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">1. Información que Recopilamos</h2>
                    <p>
                        Recopilamos la información que envías voluntariamente a través de WhatsApp (mensajes de texto y notas de voz) con el único fin de procesar tus registros de gastos. También almacenamos datos básicos de tu cuenta de Google si decides utilizarla para iniciar sesión.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">2. Uso de los Datos</h2>
                    <p>
                        Tus datos se utilizan exclusivamente para:
                    </p>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Registrar y categorizar tus gastos personales.</li>
                        <li>Mostrarte estadísticas en tu dashboard privado.</li>
                        <li>Mejorar la precisión de nuestro procesamiento de lenguaje natural.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">3. Protección de la Información</h2>
                    <p>
                        Implementamos medidas de seguridad robustas a través de Firebase de Google para proteger tus datos contra el acceso no autorizado, alteración o destrucción. Tus registros de gastos son privados y solo tú puedes acceder a ellos tras autenticarte.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">4. Servicios de Terceros</h2>
                    <p>
                        Wally utiliza servicios de terceros como WhatsApp (Meta), OpenAI/Google (para procesamiento de IA) y Firebase. Cada uno de estos proveedores tiene sus propias políticas de privacidad que te recomendamos revisar. No vendemos tus datos a terceros.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">5. Tus Derechos</h2>
                    <p>
                        Tienes derecho a acceder, corregir o eliminar tus datos en cualquier momento a través del dashboard de la aplicación o contactando con soporte.
                    </p>
                </section>

                <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm">
                        Al usar Wally, aceptas las prácticas descritas en esta política.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPage;
