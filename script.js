/* =================================================================
   script.js  —  Lógica de la presentación
   Secciones:
     1. Referencias y estado
     2. Construcción del menú de miniaturas (vista previa real)
     3. Cambio de diapositiva (animación / transición)
     4. Botones anterior / siguiente
     5. Navegación por teclado
     6. Menú desplegable (no se cierra al elegir)
     7. Cambio de tema (claro / oscuro)
     8. Botón pantalla completa + botón flotante
     9. Memoria: recuerda diapositiva y tema
    10. Descargar / exportar a PDF
   ================================================================= */

/* ============ 1. REFERENCIAS Y ESTADO ============ */
const slides    = Array.from(document.querySelectorAll('.slide'));
const deck      = document.getElementById('deck');
const btnPrev   = document.getElementById('btnPrev');
const btnNext   = document.getElementById('btnNext');
const counter   = document.getElementById('counter');
const thumbList = document.getElementById('thumbList');
const panel     = document.getElementById('thumbPanel');
const overlay   = document.getElementById('overlay');
const btnMenu   = document.getElementById('btnMenu');
const btnMenuFs = document.getElementById('btnMenuFs');
const btnClose  = document.getElementById('btnCloseMenu');
const btnTheme  = document.getElementById('btnTheme');
const btnFull   = document.getElementById('btnFull');
const btnPdf    = document.getElementById('btnPdf');

const STORE_SLIDE = 'pres_slide_actual';   // clave para recordar diapositiva
const STORE_THEME = 'pres_tema';           // clave para recordar tema

let current = 0;            // índice de la diapositiva actual
let animating = false;      // evita cambios mientras hay animación

/* ============ 2. MENÚ DE MINIATURAS (VISTA PREVIA REAL) ============ */
/* Cada miniatura clona la diapositiva y la reduce con scale() para que
   se vea igual que la grande, como una vista previa.                  */
const THUMB_REF_W = 1180;   // ancho de referencia usado en el CSS

slides.forEach((slide, i) => {
  const name = slide.dataset.title || ('Diapositiva ' + (i + 1));

  const item = document.createElement('div');
  item.className = 'thumb';
  item.dataset.index = i;

  // encabezado: número + título
  const head = document.createElement('div');
  head.className = 'thumb-head';
  head.innerHTML = `<span class="thumb-no">${i + 1}</span>
                    <span class="thumb-name">${name}</span>`;

  // lienzo con la diapositiva clonada (vista previa)
  const canvas = document.createElement('div');
  canvas.className = 'thumb-canvas';
  const clone = slide.cloneNode(true);
  clone.classList.add('active');                 // que se vea al frente
  clone.removeAttribute('id');
  canvas.appendChild(clone);

  item.appendChild(head);
  item.appendChild(canvas);

  // al hacer clic cambia de diapositiva PERO el menú NO se cierra
  item.addEventListener('click', () => goTo(i));

  thumbList.appendChild(item);
});
const thumbs = Array.from(document.querySelectorAll('.thumb'));

/* escala cada vista previa según el ancho real del lienzo */
function escalarMiniaturas() {
  document.querySelectorAll('.thumb-canvas').forEach(canvas => {
    const clone = canvas.firstElementChild;
    if (!clone) return;
    const factor = canvas.clientWidth / THUMB_REF_W;
    clone.style.transform = `scale(${factor})`;
  });
}
window.addEventListener('resize', escalarMiniaturas);

/* resalta la miniatura seleccionada y la deja a la vista */
function highlightThumb(index) {
  thumbs.forEach(t => t.classList.remove('active'));
  if (thumbs[index]) {
    thumbs[index].classList.add('active');
    thumbs[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

/* ============ 3. CAMBIO DE DIAPOSITIVA (TRANSICIÓN) ============ */
function goTo(index, dir = null) {
  if (index < 0 || index >= slides.length || index === current || animating) return;

  if (dir === null) dir = index > current ? 'next' : 'prev';

  animating = true;
  const prevSlide = slides[current];
  const nextSlide = slides[index];

  prevSlide.classList.remove('active');
  prevSlide.classList.add(dir === 'next' ? 'exit-left' : 'exit-right');
  nextSlide.classList.add('active');

  current = index;
  updateUI();
  guardarEstado();   // recuerda la diapositiva actual

  window.setTimeout(() => {
    prevSlide.classList.remove('exit-left', 'exit-right');
    animating = false;
  }, 560);
}

function next() { goTo(current + 1, 'next'); }
function prev() { goTo(current - 1, 'prev'); }

function updateUI() {
  counter.textContent = `${current + 1} / ${slides.length}`;
  btnPrev.disabled = current === 0;
  btnNext.disabled = current === slides.length - 1;
  highlightThumb(current);
}

/* ============ 4. BOTONES ANTERIOR / SIGUIENTE ============ */
btnPrev.addEventListener('click', prev);
btnNext.addEventListener('click', next);

/* ============ 5. NAVEGACIÓN POR TECLADO ============ */
/* Funciona igual en modo normal y en pantalla completa. */
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      e.preventDefault(); next(); break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault(); prev(); break;
    case 'Home': goTo(0); break;
    case 'End':  goTo(slides.length - 1); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'Escape': closeMenu(); break;
  }
});

/* ============ 6. MENÚ DESPLEGABLE ============ */
/* Se abre con el botón de la barra o con el flotante (pantalla completa).
   Ya NO se cierra al seleccionar una diapositiva: el usuario lo controla. */
function openMenu()  {
  panel.classList.add('open');
  overlay.classList.add('show');
  escalarMiniaturas();   // recalcula tamaños al abrir
}
function closeMenu() { panel.classList.remove('open'); overlay.classList.remove('show'); }
btnMenu.addEventListener('click', openMenu);
btnMenuFs.addEventListener('click', openMenu);
btnClose.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

/* ============ 7. CAMBIO DE TEMA (CLARO / OSCURO) ============ */
function setTheme(mode) {
  if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  theme = mode;
}
let theme = 'light';
btnTheme.addEventListener('click', () => {
  setTheme(theme === 'light' ? 'dark' : 'light');
  guardarEstado();   // recuerda el tema
});

/* ============ 8. PANTALLA COMPLETA + BOTÓN FLOTANTE ============ */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}
btnFull.addEventListener('click', toggleFullscreen);

document.addEventListener('fullscreenchange', () => {
  document.body.classList.toggle('is-fullscreen', !!document.fullscreenElement);
  if (!document.fullscreenElement) closeMenu();   // al salir, cierra el menú
});

/* ============ 9. MEMORIA: RECUERDA DIAPOSITIVA Y TEMA ============ */
/* Usa localStorage para que, al volver a entrar (sin cerrar) o recargar,
   continúe en la misma diapositiva y con el mismo tema. Si el navegador
   bloquea el almacenamiento (archivo local), simplemente se ignora.    */
function guardarEstado() {
  try {
    localStorage.setItem(STORE_SLIDE, String(current));
    localStorage.setItem(STORE_THEME, theme);
  } catch (e) { /* almacenamiento no disponible */ }
}
function restaurarEstado() {
  let idx = 0, modo = 'light';
  try {
    const s = localStorage.getItem(STORE_SLIDE);
    const t = localStorage.getItem(STORE_THEME);
    if (s !== null && !isNaN(+s)) idx = Math.min(Math.max(+s, 0), slides.length - 1);
    if (t === 'dark' || t === 'light') modo = t;
  } catch (e) { /* almacenamiento no disponible */ }
  return { idx, modo };
}

/* ============ 10. DESCARGAR / EXPORTAR A PDF ============ */
/* Abre el diálogo de impresión del navegador. Con las reglas @media print
   del CSS, cada diapositiva sale en su propia página. El usuario elige
   "Guardar como PDF" como destino. No requiere librerías ni internet.   */
btnPdf.addEventListener('click', () => {
  closeMenu();
  window.print();
});

/* ============ ARRANQUE ============ */
(function init() {
  const { idx, modo } = restaurarEstado();
  setTheme(modo);

  current = idx;
  slides[current].classList.add('active');
  updateUI();

  // ajusta el tamaño de las vistas previas una vez montado el DOM
  requestAnimationFrame(escalarMiniaturas);
  window.addEventListener('load', escalarMiniaturas);
})();