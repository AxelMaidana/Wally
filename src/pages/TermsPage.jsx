import React from 'react';

const TermsPage = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="space-y-4 mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Términos y Condiciones</h1>
                <p className="text-zinc-500 font-medium">Última actualización: 17 de febrero de 2026</p>
            </div>

            <div className="glass-card rounded-3xl p-8 md:p-12 space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar Wally, aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar el servicio.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">2. Descripción del Servicio</h2>
                    <p>
                        Wally es una herramienta de registro de gastos personales que opera a través de mensajes de texto y audio vinculados a WhatsApp. El servicio utiliza inteligencia artificial para procesar la información y almacenarla en una base de datos privada.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">3. Uso del Servicio</h2>
                    <p>
                        El usuario es responsable de la veracidad de los datos ingresados. Wally no se hace responsable por errores en el procesamiento de la información derivados de mensajes ambiguos o audios de baja calidad. El servicio es estrictamente para uso personal.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">4. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido, diseño y código de Wally es propiedad exclusiva de sus desarrolladores. Queda prohibida la reproducción total o parcial del servicio sin autorización previa.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">5. Limitación de Responsabilidad</h2>
                    <p>
                        Wally no garantiza la disponibilidad ininterrumpida del servicio. No somos responsables por pérdidas de datos o perjuicios económicos derivados del uso o la imposibilidad de uso de la herramienta.
                    </p>
                </section>

                <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm">
                        Para cualquier consulta sobre estos términos, por favor contáctanos a través de los canales oficiales.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsPage;
