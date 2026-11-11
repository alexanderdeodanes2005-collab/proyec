
let base = "";
let estadoAnterior = null;
let intervaloMotor = null;

let historial = JSON.parse(
    localStorage.getItem("historialMotor") || "[]"
);


async function conectar() {

    let ip = document.getElementById("ip").value.trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

    const status = document.getElementById("status");

    if (!ip) {
        status.textContent = "Escribe la IP del ESP32";
        return;
    }

    base = "http://" + ip;
    status.textContent = "Conectando...";

    try {

        const respuesta = await fetch(base + "/", {
            signal: AbortSignal.timeout(3000)
        });

        if (!respuesta.ok) {
            throw new Error("El ESP32 no responde");
        }

        document.getElementById("login").style.display = "none";
        document.getElementById("viscabarca").style.display = "block";
        document.querySelector(".motor").style.display = "block";
        document.getElementById("INT").style.display="block"

        status.textContent = "ESP32 conectado";

        estadoAnterior = null;

        if (intervaloMotor !== null) {
            clearInterval(intervaloMotor);
        }

        mostrarHistorial();
        actualizarMotor();

        intervaloMotor = setInterval(actualizarMotor, 500);

    } catch (error) {

        status.textContent =
            "No se pudo vincular. Revisa la IP y el Wi-Fi.";

        base = "";
    }
}



function mostrarHistorial() {

    const tabla = document.getElementById("historialMotor");

    if (!tabla) return;

    tabla.innerHTML = "";

   historial.slice(0, 5).forEach(evento =>{

        const fila = document.createElement("tr");

        const celdaFecha = document.createElement("td");
        const celdaHora = document.createElement("td");
        const celdaEstado = document.createElement("td");

        celdaFecha.textContent = evento.fecha;
        celdaHora.textContent = evento.hora;
        celdaEstado.textContent = evento.estado;

        fila.appendChild(celdaFecha);
        fila.appendChild(celdaHora);
        fila.appendChild(celdaEstado);

        tabla.appendChild(fila);
    });
}
function limpiarHistorial() {

    historial = [];

    localStorage.removeItem("historialMotor");

    mostrarHistorial();

}

function registrarEvento(estado) {

    const ahora = new Date();

    const fecha = ahora.toLocaleDateString("es-SV");
    const hora = ahora.toLocaleTimeString("es-SV");

    historial.unshift({
        fecha: fecha,
        hora: hora,
        estado: estado
    });

    historial = historial.slice(0, 200);

    localStorage.setItem(
        "historialMotor",
        JSON.stringify(historial)
    );

    mostrarHistorial();
}

async function actualizarMotor() {

    if (!base) return;

    try {

        const respuesta = await fetch(base + "/motor", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("Error de respuesta");
        }

        const estado = (await respuesta.text()).trim();

       const indicador = document.getElementById("Motor");

if (indicador) {
    indicador.textContent = "MOTOR " + estado;
    indicador.style.color =
        estado === "ENCENDIDO" ? "#00ff00" : "#ff3333";
} else {
    console.error("No existe el elemento con ID Motor");
}

        if (estadoAnterior === null) {

            estadoAnterior = estado;


        } else if (estado !== estadoAnterior) {

            registrarEvento(estado);

            estadoAnterior = estado;
        }

    } catch (error) {

        console.log("Error de conexión con ESP32");
    }
}
