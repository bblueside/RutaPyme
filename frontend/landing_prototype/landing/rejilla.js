// Rejilla interactiva de la sección de cifras: resalta las líneas y el área alrededor del cursor.
// Solo anima estilos (variables CSS); no pide datos ni toca el recorrido.
(function () {
  const rejilla = document.querySelector('.ls-rejilla');
  if (!rejilla) return;

  const seccion = rejilla.parentElement;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (sinMovimiento.matches) return;   // queda solo la capa base, estática

  const foco = document.createElement('div');
  foco.className = 'ls-rejilla__foco';
  rejilla.append(foco);

  const SUAVIZADO = 0.16;   // 0..1: cuánto se acerca la rejilla al cursor en cada cuadro
  const objetivo = { x: 0, y: 0, foco: 0 };
  const actual = { x: 0, y: 0, foco: 0 };
  let animando = false;

  function pintar() {
    actual.x += (objetivo.x - actual.x) * SUAVIZADO;
    actual.y += (objetivo.y - actual.y) * SUAVIZADO;
    actual.foco += (objetivo.foco - actual.foco) * SUAVIZADO;

    rejilla.style.setProperty('--ls-mx', actual.x + 'px');
    rejilla.style.setProperty('--ls-my', actual.y + 'px');
    rejilla.style.setProperty('--ls-foco', actual.foco.toFixed(3));

    const quieto = Math.abs(objetivo.x - actual.x) < 0.3 && Math.abs(objetivo.y - actual.y) < 0.3
      && Math.abs(objetivo.foco - actual.foco) < 0.01;
    if (quieto && objetivo.foco === 0) { animando = false; return; }
    requestAnimationFrame(pintar);
  }

  function arrancar() {
    if (animando) return;
    animando = true;
    requestAnimationFrame(pintar);
  }

  seccion.addEventListener('pointermove', (e) => {
    const caja = rejilla.getBoundingClientRect();
    objetivo.x = e.clientX - caja.left;
    objetivo.y = e.clientY - caja.top;
    if (objetivo.foco === 0) { actual.x = objetivo.x; actual.y = objetivo.y; }  // evita el barrido desde (0,0)
    objetivo.foco = 1;
    arrancar();
  });
  seccion.addEventListener('pointerleave', () => { objetivo.foco = 0; arrancar(); });
})();
