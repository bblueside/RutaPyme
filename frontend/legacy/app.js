// RutaPyme · interfaz mínima. Todo lo que se muestra viene de la API REST real.
"use strict";

const NOMBRES_TIPO = { bodega: "Bodega", barrio: "Barrio", punto_recogida: "Punto de recogida" };

const $ = (selector) => document.querySelector(selector);

// --- Comunicación con la API ---------------------------------------------

async function llamarApi(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(ruta, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error ? datos.error.mensaje : `Error ${respuesta.status}`);
  }
  return datos;
}

// --- Utilidades de interfaz -----------------------------------------------

let temporizadorAviso;
function mostrarAviso(texto, tipo = "exito") {
  const aviso = $("#aviso");
  aviso.textContent = texto;
  aviso.className = `aviso ${tipo} visible`;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 4000);
}

const ENTIDADES_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
function escapar(texto) {
  return String(texto).replace(/[&<>]/g, (caracter) => ENTIDADES_HTML[caracter]);
}

function insignia(tipo) {
  return `<span class="insignia ${escapar(tipo)}">${escapar(NOMBRES_TIPO[tipo] ?? tipo)}</span>`;
}

function filaVacia(columnas, texto) {
  return `<tr><td class="vacio" colspan="${columnas}">${texto}</td></tr>`;
}

// --- Pintar la red ----------------------------------------------------------

function pintarResumen(resumen) {
  $("#total-puntos").textContent = resumen.puntos;
  $("#total-conexiones").textContent = resumen.conexiones;
  for (const [tipo, cantidad] of Object.entries(resumen.por_tipo)) {
    $(`#total-${tipo}`).textContent = cantidad;
  }
}

function pintarPuntos(puntos, listaAdyacencia) {
  $("#tabla-puntos").innerHTML = puntos.length
    ? puntos.map((p) => `
        <tr>
          <td class="codigo">${escapar(p.id)}</td>
          <td>${insignia(p.tipo)}</td>
          <td class="numero">${listaAdyacencia[p.id].length}</td>
        </tr>`).join("")
    : filaVacia(3, "Aún no hay puntos registrados.");

  $("#lista-puntos").innerHTML = puntos.map((p) => `<option value="${escapar(p.id)}">`).join("");
}

function pintarConexiones(conexiones) {
  $("#tabla-conexiones").innerHTML = conexiones.length
    ? conexiones.map((c) => `
        <tr>
          <td class="codigo">${escapar(c.origen)}</td>
          <td aria-hidden="true">→</td>
          <td class="codigo">${escapar(c.destino)}</td>
          <td class="numero">${escapar(c.costo)}</td>
        </tr>`).join("")
    : filaVacia(4, "Aún no hay conexiones registradas.");
}

function pintarAdyacencia(lineas) {
  $("#lista-adyacencia").innerHTML = lineas.length
    ? lineas.map((linea) => `<li>${escapar(linea)}</li>`).join("")
    : "<li>La red está vacía.</li>";
}

function refrescarImagen() {
  const imagen = $("#imagen-red");
  imagen.src = `/api/red/imagen?v=${Date.now()}`; // evita que el navegador use una imagen vieja
}

async function refrescar() {
  const [puntos, conexiones, red] = await Promise.all([
    llamarApi("GET", "/api/puntos"),
    llamarApi("GET", "/api/conexiones"),
    llamarApi("GET", "/api/red"),
  ]);
  pintarResumen(red.resumen);
  pintarPuntos(puntos.puntos, red.lista_adyacencia);
  pintarConexiones(conexiones.conexiones);
  pintarAdyacencia(red.texto);
  refrescarImagen();
}

// --- Acciones del usuario -------------------------------------------------

async function ejecutar(accion) {
  try {
    const datos = await accion();
    if (datos && datos.mensaje) mostrarAviso(datos.mensaje, "exito");
    await refrescar();
    return true;
  } catch (error) {
    mostrarAviso(error.message, "error");
    return false;
  }
}

$("#form-punto").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const exito = await ejecutar(() => llamarApi("POST", "/api/puntos", {
    id: formulario.identificador.value,
    tipo: formulario.tipo.value,
  }));
  if (exito) formulario.identificador.value = "";
});

$("#form-conexion").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const costo = formulario.costo.value === "" ? null : Number(formulario.costo.value);
  const exito = await ejecutar(() => llamarApi("POST", "/api/conexiones", {
    origen: formulario.origen.value,
    destino: formulario.destino.value,
    costo,
  }));
  if (exito) formulario.reset();
});

$("#form-consulta").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const resultado = $("#resultado-consulta");
  const id = evento.target.identificador.value.trim();
  resultado.classList.remove("oculto", "error");
  try {
    const datos = await llamarApi("GET", `/api/puntos/${encodeURIComponent(id)}`);
    const salidas = datos.salidas.length
      ? datos.salidas.map((s) => `${escapar(s.destino)} (${escapar(s.costo)} min)`).join(", ")
      : "no tiene salidas registradas";
    resultado.innerHTML = `<strong>${escapar(datos.punto.id)}</strong> · ${insignia(datos.punto.tipo)} → ${salidas}`;
  } catch (error) {
    resultado.classList.add("error");
    resultado.textContent = error.message;
  }
});

$("#boton-ejemplo").addEventListener("click", () => {
  if (confirm("Se reemplazará la red actual por la red de ejemplo. ¿Continuar?")) {
    ejecutar(() => llamarApi("POST", "/api/red/ejemplo"));
  }
});

$("#boton-vaciar").addEventListener("click", () => {
  if (confirm("Se borrarán todos los puntos y conexiones. ¿Continuar?")) {
    ejecutar(() => llamarApi("DELETE", "/api/red"));
  }
});

$("#imagen-red").addEventListener("error", async () => {
  const mensaje = $("#imagen-error");
  try {
    await llamarApi("GET", "/api/red/imagen");
  } catch (error) {
    mensaje.textContent = error.message;
  }
  mensaje.classList.remove("oculto");
});
$("#imagen-red").addEventListener("load", () => $("#imagen-error").classList.add("oculto"));

// --- Inicio -----------------------------------------------------------------

async function iniciar() {
  const estadoApi = $("#estado-api");
  try {
    await llamarApi("GET", "/api/salud");
    estadoApi.textContent = "API conectada";
    estadoApi.className = "pastilla ok";
    const { tipos } = await llamarApi("GET", "/api/tipos");
    $("#select-tipo").innerHTML = tipos
      .map((tipo) => `<option value="${escapar(tipo)}">${escapar(NOMBRES_TIPO[tipo] ?? tipo)}</option>`)
      .join("");
    await refrescar();
  } catch (error) {
    estadoApi.textContent = "API sin conexión";
    estadoApi.className = "pastilla caida";
    mostrarAviso("No se pudo conectar con la API. ¿Está corriendo python main.py?", "error");
  }
}

iniciar();
