// CONFIGURACIÓN DE THINGSPEAK
const CHANNEL_ID = '3410708';
const READ_API_KEY = 'P1QNKH49A0F4X65O';

const urlUltimoDato =
`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;

const urlHistorial =
`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=6`;


// RUTAS DE LAS IMÁGENES
const IMAGEN_ENTRADA = 'Primera (2).jpeg';
const IMAGEN_CASO_1  = 'Segunda (2).jpeg';
const IMAGEN_CASO_2  = 'Tercera (2).jpeg';
const IMAGEN_CASO_3  = 'Cuarta (2).jpeg';
const IMAGEN_CASO_4  = 'Quinta (2).jpeg';


// VARIABLE DE CONTROL DE FASE
let faseRobot = 0;


function actualizarReloj() {

    const ahora = new Date();

    const opciones = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    document.getElementById('reloj').innerText =
        ahora.toLocaleDateString('es-ES', opciones).toUpperCase();
}


async function consultarThingSpeak() {

    try {

        const respuestaUltimo = await fetch(urlUltimoDato);

        if (!respuestaUltimo.ok)
            throw new Error('Error al obtener último dato');

        const datos = await respuestaUltimo.json();

        const valorF1_Temp =
            datos.field1 ? parseFloat(datos.field1).toFixed(1) : null;

        const valorF2_Hum =
            datos.field2 ? parseFloat(datos.field2).toFixed(1) : null;

        const valorF3_Color =
            datos.field3 ? parseFloat(datos.field3).toFixed(0) : null;

        const valorF4_Fuego =
            datos.field4 ? parseFloat(datos.field4).toFixed(0) : null;

        const valorF5_Dist =
            datos.field5 ? parseFloat(datos.field5).toFixed(1) : null;


        const elementoImagen =
            document.getElementById('imagen-estado');

        const elementoDesc =
            document.getElementById('imagen-descripcion');


        // ACTUALIZAR TARJETAS

        if (valorF1_Temp !== null)
            document.getElementById('temp-valor').innerText =
                `${valorF1_Temp} °C`;

        if (valorF2_Hum !== null)
            document.getElementById('hum-valor').innerText =
                `${valorF2_Hum} %`;

        if (valorF5_Dist !== null)
            document.getElementById('dist-valor').innerText =
                `${valorF5_Dist} cm`;


        // ====================================================
        // COLORES
        // ====================================================

        let colorNum = null;

        if (valorF3_Color !== null) {

            colorNum = parseInt(valorF3_Color);

            let nombreColor = `Código: ${colorNum}`;

            // VERDE
            if (colorNum >= 355 && colorNum <= 510)
                nombreColor = "Verde";

            // AMARILLO
            else if (colorNum >= 490 && colorNum <= 578)
                nombreColor = "Amarillo";

            // BLANCO
            else if (colorNum < 290)
                nombreColor = "Blanco";

            // NEGRO
            else if (colorNum > 780)
                nombreColor = "Negro";

            document.getElementById('color-valor').innerText =
                nombreColor;

            document.getElementById('color-estado').innerText =
                `Lectura activa: ${colorNum}`;
        }


        // ====================================================
        // DETECCIÓN DE FUEGO
        // ====================================================

        if (
            valorF4_Fuego !== null &&
            parseInt(valorF4_Fuego) === 1
        ) {

            document.getElementById('fuego-valor').innerText =
                "¡FUEGO!";

            document.getElementById('fuego-estado').innerText =
                "¡Emergencia!";

            const badgeFuego =
                document.getElementById('badge-fuego');

            badgeFuego.innerText = "PELIGRO";
            badgeFuego.style.background =
                "rgba(239,68,68,0.2)";
            badgeFuego.style.color =
                "#ef4444";

            elementoImagen.src = IMAGEN_CASO_4;

            elementoDesc.innerText =
                "Fase final: fuego detectado.";

            elementoDesc.style.color =
                "#ef4444";
        }

        else {

            // RESTABLECER ESTADO

            if (valorF4_Fuego !== null) {

                document.getElementById('fuego-valor').innerText =
                    "SEGURO";

                document.getElementById('fuego-estado').innerText =
                    "Sin anomalías";

                const badgeFuego =
                    document.getElementById('badge-fuego');

                badgeFuego.innerText = "SEGURO";

                badgeFuego.style.background =
                    "rgba(74,222,128,0.2)";

                badgeFuego.style.color =
                    "#4ade80";
            }

            elementoDesc.style.color = "";


            // ==============================================
            // FASE 0 → VERDE
            // ==============================================

            if (faseRobot === 0) {

                if (
                    colorNum !== null &&
                    colorNum >= 355 &&
                    colorNum <= 510
                ) {

                    faseRobot = 1;

                    elementoImagen.src =
                        IMAGEN_CASO_1;

                    elementoDesc.innerText =
                        `Parte 1: Verde detectado (${colorNum}).`;
                }

                else {

                    elementoImagen.src =
                        IMAGEN_ENTRADA;

                    elementoDesc.innerText =
                        "Esperando color Verde (355 - 510)...";
                }
            }


            // ==============================================
            // FASE 1 → AMARILLO
            // ==============================================

            else if (faseRobot === 1) {

                if (
                    colorNum !== null &&
                    colorNum >= 490 &&
                    colorNum <= 578
                ) {

                    faseRobot = 2;

                    elementoImagen.src =
                        IMAGEN_CASO_2;

                    elementoDesc.innerText =
                        `Parte 2: Amarillo detectado (${colorNum}).`;
                }
            }


            // ==============================================
            // FASE 2 → BLANCO
            // ==============================================

            else if (faseRobot === 2) {

                if (
                    colorNum !== null &&
                    colorNum < 290
                ) {

                    faseRobot = 3;

                    elementoImagen.src =
                        IMAGEN_CASO_3;

                    elementoDesc.innerText =
                        `Parte 3: Blanco detectado (${colorNum}).`;
                }
            }
        }


        // ====================================================
        // HISTORIAL
        // ====================================================

        const respuestaHistorial =
            await fetch(urlHistorial);

        if (respuestaHistorial.ok) {

            const datosHistorial =
                await respuestaHistorial.json();

            const listaFeeds =
                datosHistorial.feeds;

            const tablaBody =
                document.getElementById(
                    'tabla-historial-body'
                );

            tablaBody.innerHTML = "";

            listaFeeds.forEach(feed => {

                const fechaHoraIso =
                    new Date(feed.created_at);

                const horaLocal =
                    fechaHoraIso.toLocaleTimeString(
                        'es-ES',
                        {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }
                    );

                const t =
                    feed.field1 ?
                    parseFloat(feed.field1).toFixed(1)
                    : "---";

                const h =
                    feed.field2 ?
                    parseFloat(feed.field2).toFixed(1)
                    : "---";

                const c =
                    feed.field3 ?
                    parseInt(feed.field3)
                    : "---";

                const f =
                    feed.field4 ?
                    parseInt(feed.field4)
                    : "---";

                const d =
                    feed.field5 ?
                    parseFloat(feed.field5).toFixed(1)
                    : "---";

                const filaHTML = `
                    <tr>
                        <td style="font-family: monospace; color: #38bdf8;">
                            ${horaLocal}
                        </td>
                        <td>${t}</td>
                        <td>${h}</td>
                        <td>${c}</td>
                        <td>${f}</td>
                        <td>${d}</td>
                    </tr>
                `;

                tablaBody.insertAdjacentHTML(
                    'afterbegin',
                    filaHTML
                );
            });
        }


        document.getElementById('global-status').innerText =
            "SISTEMA ONLINE";

        document.getElementById('badge-wifi').innerText =
            "CONECTADO";

        document.getElementById('badge-wifi').style.background =
            "rgba(74,222,128,0.2)";

        document.getElementById('badge-wifi').style.color =
            "#4ade80";

    }

    catch (error) {

        console.error(error);

        document.getElementById('global-status').innerText =
            "SISTEMA DESCONECTADO";

        const wifiBadge =
            document.getElementById('badge-wifi');

        wifiBadge.innerText =
            "DESCONECTADO";

        wifiBadge.style.background =
            "rgba(239,68,68,0.2)";

        wifiBadge.style.color =
            "#ef4444";
    }
}


document.addEventListener("DOMContentLoaded", () => {

    actualizarReloj();

    setInterval(actualizarReloj, 1000);

    consultarThingSpeak();

    setInterval(consultarThingSpeak, 15000);

});
