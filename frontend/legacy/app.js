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

// La imagen resalta una sola consulta a la vez: la ruta (Feature 3) o la cobertura (Feature 2).
function rutaImagen() {
  if (rutaActiva) {
    return `/api/red/imagen/ruta/${encodeURIComponent(rutaActiva.origen)}/${encodeURIComponent(rutaActiva.destino)}`;
  }
  return coberturaActiva
    ? `/api/red/imagen/cobertura/${encodeURIComponent(coberturaActiva.origen)}`
    : "/api/red/imagen";
}

function refrescarImagen() {
  const imagen = $("#imagen-red");
  imagen.src = `${rutaImagen()}?v=${Date.now()}`; // evita que el navegador use una imagen vieja
  let etiqueta = "Dibujado con NetworkX";
  if (rutaActiva) etiqueta = `Ruta ${rutaActiva.origen} → ${rutaActiva.destino} · dibujado con NetworkX`;
  else if (coberturaActiva) etiqueta = `Cobertura desde ${coberturaActiva.origen} · dibujado con NetworkX`;
  $("#etiqueta-imagen").textContent = etiqueta;
}

// --- Cobertura de entregas (Feature 2) -------------------------------------

let coberturaActiva = null; // { origen, destino } mientras se muestra una cobertura

const lista = (elementos) => `<ul class="cobertura-lista">${elementos.join("")}</ul>`;

function pintarCamino(camino) {
  return `<div class="camino">${camino
    .map((id) => `<span class="nodo">${escapar(id)}</span>`)
    .join('<span aria-hidden="true">→</span>')}</div>`;
}

function pintarTraza(traza) {
  const pasos = traza.map((p) => `<li><strong>${escapar(p.visita)}</strong> (capa ${escapar(p.capa)}): ${escapar(p.decision)}</li>`);
  return `<details class="traza"><summary>Traza del recorrido (${traza.length} pasos)</summary><ol>${pasos.join("")}</ol></details>`;
}

function pintarCoberturaCompleta(datos) {
  const alcanzables = datos.alcanzables.length
    ? lista(datos.alcanzables.map((p) => `<li><strong class="codigo">${escapar(p.id)}</strong> ${insignia(p.tipo)}
        <small>· ${escapar(p.saltos)} trayecto(s), llega desde ${escapar(p.llega_desde)}</small></li>`))
    : '<p class="ayuda">Ningún punto alcanzable.</p>';
  const noAlcanzables = datos.no_alcanzables.length
    ? lista(datos.no_alcanzables.map((p) => `<li><strong class="codigo">${escapar(p.id)}</strong> ${insignia(p.tipo)}
        <small>· ${escapar(p.motivo)}</small></li>`))
    : '<p class="ayuda">Todos los puntos de la red están cubiertos.</p>';
  return `
    <p class="veredicto ${datos.total_alcanzables ? "si" : "no"}">${escapar(datos.mensaje)}</p>
    <div class="cobertura-columnas">
      <div><h3>Alcanzables (${datos.total_alcanzables})</h3>${alcanzables}</div>
      <div><h3>No alcanzables (${datos.total_no_alcanzables})</h3>${noAlcanzables}</div>
    </div>
    <div class="cobertura-bloque"><h3>Orden de visita</h3>${pintarCamino(datos.orden_visita)}</div>
    ${pintarTraza(datos.traza)}`;
}

function pintarVerificacion(datos) {
  const detalle = datos.alcanzable
    ? `<div class="cobertura-bloque"><h3>Camino de evidencia · ${escapar(datos.saltos)} trayecto(s)</h3>
        ${pintarCamino(datos.camino)}<p class="nota">${escapar(datos.nota)}</p></div>`
    : `<div class="cobertura-bloque"><h3>¿Por qué no?</h3><p>${escapar(datos.explicacion)}</p></div>`;
  return `
    <p class="veredicto ${datos.alcanzable ? "si" : "no"}">${escapar(datos.mensaje)}</p>
    ${detalle}
    ${datos.traza ? pintarTraza(datos.traza) : ""}`;
}

function mostrarResultadoCobertura(contenido, esError = false) {
  const contenedor = $("#resultado-cobertura");
  contenedor.classList.remove("oculto");
  contenedor.innerHTML = esError ? `<p class="veredicto error">${escapar(contenido)}</p>` : contenido;
}

function limpiarCobertura() {
  coberturaActiva = null;
  $("#resultado-cobertura").classList.add("oculto");
  $("#resultado-cobertura").innerHTML = "";
}

// Consulta la cobertura y la pinta. Devuelve true si la API respondió bien.
async function consultarCobertura(consulta) {
  const ruta = consulta.destino
    ? `/api/cobertura/${encodeURIComponent(consulta.origen)}/${encodeURIComponent(consulta.destino)}`
    : `/api/cobertura/${encodeURIComponent(consulta.origen)}`;
  try {
    const datos = await llamarApi("GET", ruta);
    coberturaActiva = { origen: datos.origen.id, destino: datos.destino ? datos.destino.id : "" };
    mostrarResultadoCobertura(consulta.destino ? pintarVerificacion(datos) : pintarCoberturaCompleta(datos));
    return true;
  } catch (error) {
    mostrarResultadoCobertura(error.message, true);
    return false;
  }
}

// --- Ruta de menor costo (Feature 3) ---------------------------------------

let rutaActiva = null; // { origen, destino } mientras se muestra una ruta

const minutos = (valor) => (valor === null || valor === undefined ? "∞" : `${valor} min`);

function pintarTramos(tramos) {
  const filas = tramos.map((t) => `
    <tr>
      <td class="codigo">${escapar(t.origen)}</td>
      <td aria-hidden="true">→</td>
      <td class="codigo">${escapar(t.destino)}</td>
      <td class="numero">${escapar(t.costo)}</td>
      <td class="numero">${escapar(t.acumulado)}</td>
    </tr>`);
  return `<div class="tabla-desplazable"><table>
    <thead><tr><th>Desde</th><th></th><th>Hasta</th><th class="numero">Costo (min)</th><th class="numero">Acumulado</th></tr></thead>
    <tbody>${filas.join("")}</tbody></table></div>`;
}

function pintarComparacion(comparacion) {
  const ahorro = comparacion.diferencia > 0;
  return `<div class="cobertura-bloque comparacion ${ahorro ? "ahorro" : ""}">
      <h3>Comparación con el camino de menos trayectos</h3>
      ${pintarCamino(comparacion.camino)}
      <p class="nota">${escapar(comparacion.saltos)} trayecto(s) · ${escapar(comparacion.costo)} min
        ${ahorro ? `· <strong>${escapar(comparacion.diferencia)} min más caro</strong>` : ""}</p>
      <p>${escapar(comparacion.mensaje)}</p>
    </div>`;
}

function pintarCostosDefinitivos(orden, costos) {
  const pasos = orden.map((id, indice) => `<li><span class="paso-numero">${indice + 1}</span>
      <strong class="codigo">${escapar(id)}</strong> <small>· ${escapar(minutos(costos[id]))}</small></li>`);
  return `<div class="cobertura-bloque"><h3>Orden en que los puntos quedaron definitivos</h3>
    <ul class="cobertura-lista definitivos">${pasos.join("")}</ul></div>`;
}

function pintarTrazaDijkstra(traza) {
  const pasos = traza.map((p) => {
    const mejoras = p.mejora.length
      ? `<br><small>Mejora: ${p.mejora.map((m) => `${escapar(m.punto)} (${escapar(minutos(m.antes))} → ${escapar(minutos(m.ahora))})`).join(", ")}</small>`
      : "";
    const descartes = p.descarta.length
      ? `<br><small>Descarta: ${p.descarta.map((d) => `${escapar(d.punto)} (${escapar(d.motivo)})`).join(", ")}</small>`
      : "";
    const pendientes = p.pendientes.length
      ? `<br><small>Pendientes: ${p.pendientes.map((q) => `${escapar(q.punto)} ${escapar(minutos(q.costo))}`).join(", ")}</small>`
      : "";
    return `<li><strong>${escapar(p.definitivo)}</strong> (${escapar(minutos(p.costo))}): ${escapar(p.decision)}${mejoras}${descartes}${pendientes}</li>`;
  });
  return `<details class="traza"><summary>Traza de Dijkstra (${traza.length} pasos)</summary><ol>${pasos.join("")}</ol></details>`;
}

function pintarRuta(datos) {
  const detalle = datos.existe_ruta
    ? `<div class="cobertura-bloque"><h3>Ruta elegida · ${escapar(datos.costo_total)} min en ${escapar(datos.saltos)} trayecto(s)</h3>
        ${pintarCamino(datos.camino)}</div>
       ${datos.tramos.length ? `<div class="cobertura-bloque"><h3>Tramos</h3>${pintarTramos(datos.tramos)}</div>` : ""}
       ${datos.saltos > 0 ? pintarComparacion(datos.comparacion_menos_saltos) : ""}`
    : `<div class="cobertura-bloque"><h3>¿Por qué no?</h3><p>${escapar(datos.explicacion)}</p></div>`;
  return `
    <p class="veredicto ${datos.existe_ruta ? "si" : "no"}">${escapar(datos.mensaje)}</p>
    ${detalle}
    ${pintarCostosDefinitivos(datos.orden_definitivos, datos.costos_definitivos)}
    ${pintarTrazaDijkstra(datos.traza)}`;
}

function mostrarResultadoRuta(contenido, esError = false) {
  const contenedor = $("#resultado-ruta");
  contenedor.classList.remove("oculto");
  contenedor.innerHTML = esError ? `<p class="veredicto error">${escapar(contenido)}</p>` : contenido;
}

function limpiarRuta() {
  rutaActiva = null;
  $("#resultado-ruta").classList.add("oculto");
  $("#resultado-ruta").innerHTML = "";
}

// Consulta la ruta y la pinta. Devuelve true si la API respondió bien.
async function consultarRuta(consulta) {
  const ruta = `/api/ruta/${encodeURIComponent(consulta.origen)}/${encodeURIComponent(consulta.destino)}`;
  try {
    const datos = await llamarApi("GET", ruta);
    rutaActiva = { origen: datos.origen.id, destino: datos.destino.id };
    mostrarResultadoRuta(pintarRuta(datos));
    return true;
  } catch (error) {
    mostrarResultadoRuta(error.message, true);
    return false;
  }
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
  // Con una cobertura a la vista se recalcula con la red nueva; si el origen ya no existe, se limpia.
  if (coberturaActiva && !(await consultarCobertura(coberturaActiva))) limpiarCobertura();
  if (rutaActiva && !(await consultarRuta(rutaActiva))) limpiarRuta();
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

$("#form-cobertura").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const origen = formulario.origen.value.trim();
  if (!origen) {
    mostrarResultadoCobertura("Indique el punto de origen.", true);
    return;
  }
  const exito = await consultarCobertura({ origen, destino: formulario.destino.value.trim() });
  if (!exito) coberturaActiva = null; // un error de la API no deja una cobertura a medias en la imagen
  else limpiarRuta(); // la imagen resalta una sola consulta a la vez
  refrescarImagen();
});

$("#boton-limpiar-cobertura").addEventListener("click", () => {
  limpiarCobertura();
  refrescarImagen();
});

$("#form-ruta").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const origen = formulario.origen.value.trim();
  const destino = formulario.destino.value.trim();
  if (!origen || !destino) {
    mostrarResultadoRuta("Indique el punto de origen y el de destino.", true);
    return;
  }
  const exito = await consultarRuta({ origen, destino });
  if (!exito) rutaActiva = null; // un error de la API no deja una ruta a medias en la imagen
  else limpiarCobertura(); // la imagen resalta una sola consulta a la vez
  refrescarImagen();
});

$("#boton-limpiar-ruta").addEventListener("click", () => {
  limpiarRuta();
  refrescarImagen();
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
    await llamarApi("GET", rutaImagen());
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
