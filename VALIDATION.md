# Validación W3C — ShareYourStory

Guía paso a paso para validar el HTML y el CSS de la aplicación con los validadores oficiales del W3C. Útil para incluir como evidencia en la entrega del PBL.

---

## Qué se va a validar y por qué

ShareYourStory es una aplicación **SPA** (Single Page Application) construida con React, lo que significa que el HTML que ve el navegador **no es el mismo** que está escrito en los ficheros fuente: React lo genera dinámicamente en el navegador a partir de los componentes `.tsx`.

Por eso esta guía valida:

| Capa | Qué se valida | Validador |
|---|---|---|
| **HTML** | El HTML final que React renderiza en el navegador, una página por una | https://validator.w3.org/ |
| **CSS** | El bundle CSS generado por Vite tras compilar SCSS + CSS Modules | https://jigsaw.w3.org/css-validator/ |

---

## Preparación

Antes de empezar la validación, hay que generar la versión de producción de la aplicación (la que se desplegará y la que vamos a validar).

```powershell
cd frontend
npm install     # solo si no se ha hecho antes
npm run build   # compila TypeScript + genera el bundle en dist/
```

Tras el build se obtiene:

- `frontend/dist/index.html` — esqueleto inicial.
- `frontend/dist/assets/*.css` — el CSS compilado (uno o varios ficheros con nombre tipo `index-abc123.css`).
- `frontend/dist/assets/*.js` — el JavaScript compilado.

Para servir esa versión y poder navegar por todas las páginas:

```powershell
npm run preview
```

Esto levanta un servidor en `http://localhost:4173` (puerto distinto del `5173` del modo desarrollo) sirviendo el build de producción.

---

## 1. Validar el HTML

El HTML final de cada página se obtiene en el navegador, no en los ficheros fuente. Hay que validar **una página a la vez** porque las SPA muestran rutas distintas con el mismo `index.html`.

### Páginas a validar

Como mínimo, validar las rutas principales:

- `/` — Landing
- `/onboarding` — Wizard de bienvenida
- `/login` — Login / Registro
- `/dashboard` — Dashboard principal
- `/perfil` — Perfil de usuario
- `/configuracion` — Ajustes
- `/comunidades` — Listado de comunidades
- `/comunidades/general` — Chat de una comunidad (ejemplo)
- `/eventos` — Listado de eventos
- `/eventos/1` — Detalle de un evento (ejemplo)
- `/profesionales` — Listado de profesionales
- `/maquina-del-tiempo` — Carta al futuro
- `/botella` — Mensaje en una botella
- `/mapa` — Mapa de historias
- `/moderacion` — Panel de moderación
- `/loginmod` — Login moderadores
- `/modregister` — Registro de moderador/administrador

### Pasos para validar cada página

1. Asegurarse de que el servidor de preview está arrancado (`npm run preview`).
2. Abrir la página deseada en el navegador, por ejemplo `http://localhost:4173/dashboard`.
3. Esperar a que cargue completamente (animaciones, datos, etc.).
4. Pulsar **F12** para abrir DevTools.
5. Ir a la pestaña **Elements** (Chrome/Edge) o **Inspector** (Firefox).
6. Hacer clic con el botón derecho sobre la etiqueta `<html>` del árbol del DOM.
7. Seleccionar **Copy → Copy outerHTML**.
8. Abrir https://validator.w3.org/#validate_by_input.
9. Pegar el contenido copiado en el cuadro de texto.
10. Pulsar **Check**.
11. Hacer una captura de pantalla del resultado (sea verde "Document checking completed. No errors or warnings to show." o con la lista de errores).

### Cómo interpretar el resultado

- **Verde / "No errors":** la página es HTML válido.
- **Errores rojos:** hay que corregirlos. Cada error indica el fichero (componente React) que lo genera; abrir el `.tsx` correspondiente y arreglar.
- **Warnings amarillos:** advertencias, no rompen la validación. Suelen ser sobre atributos opcionales recomendados.

### Aviso importante sobre el DOCTYPE

Cuando se copia con **Copy outerHTML**, el texto resultante NO incluye la línea `<!DOCTYPE html>` (esta etiqueta vive ANTES de `<html>`, no dentro). El validador lo marcará como error:

> Error: Start tag seen without seeing a doctype first. Expected <!DOCTYPE html>.

**Es un falso positivo del método de captura**, no un problema real del código (el `index.html` del build sí lo incluye). Para evitarlo, antes de pegar en el validador añade manualmente la línea `<!DOCTYPE html>` al principio del texto copiado.

Alternativa más limpia: usa el modo **"By URL"** del validador apuntando a una URL pública (con ngrok, Cloudflare Tunnel, o el preview de Vite expuesto). Así descarga el documento completo y respeta el doctype automáticamente.

### Falsos positivos típicos en una SPA

Estos warnings son esperables y no representan un error real:

- Atributos del estilo `data-*` añadidos por React DevTools si está instalado en el navegador. Para evitarlos, validar en una ventana de **navegación privada** sin extensiones.
- Espacios en blanco entre etiquetas. No son errores.

---

## 2. Validar el CSS

Aquí se valida el CSS compilado (el resultado de procesar SCSS + CSS Modules), porque es lo que llega al navegador.

### Pasos

1. Tras `npm run build`, abrir la carpeta `frontend/dist/assets/`.
2. Localizar el o los ficheros con extensión `.css` (suelen llamarse `index-<hash>.css`).
3. Abrir https://jigsaw.w3.org/css-validator/#validate_by_upload.
4. En la pestaña **By file upload**, seleccionar el fichero `.css`.
5. En **More Options**, asegurarse de que:
   - **Profile:** `CSS level 3 + SVG`.
   - **Warnings:** `All`.
6. Pulsar **Check**.
7. Hacer una captura del resultado.

### Validación alternativa por fragmentos

Si interesa validar ficheros concretos del código fuente (por ejemplo `variables.css` o un `.module.css` específico), se pueden pegar directamente en https://jigsaw.w3.org/css-validator/#validate_by_input. Los **CSS Modules son CSS estándar**, solo cambian los nombres de las clases al compilar.

Los ficheros candidatos en el código fuente son:

- `frontend/src/styles/variables.css` — variables globales de diseño.
- `frontend/src/styles/animations.css` — animaciones reutilizables.
- `frontend/src/pages/*.module.css` — estilos de cada página.

> **Nota:** Los CSS Modules del proyecto son CSS estándar, no SCSS. Se pueden pegar directamente en el validador sin compilar previamente.

### Falsos positivos típicos en CSS

- **Vendor prefixes** (`-webkit-`, `-moz-`): el validador los marca como advertencia, pero son necesarios para compatibilidad con navegadores. Mantenerlos.
- **Variables CSS personalizadas** (`--primary`, `--peach`): válidas en CSS Level 3, asegurarse de tener el perfil correcto seleccionado.
- **Reglas `@property`, `:has()`, `:is()`:** son CSS moderno válido; algunos validadores antiguos pueden no reconocerlas.

---

## 3. Cómo presentar la prueba en el PBL

Estructura sugerida para incluir en la documentación de la entrega:

1. **Carpeta `validacion-w3c/`** con dos subcarpetas:
   - `html/` — una captura por cada ruta validada, con el nombre de la ruta (`landing.png`, `dashboard.png`, etc.).
   - `css/` — captura del resultado del validador CSS sobre el bundle.
2. **Un documento resumen** (`validacion-w3c/README.md` o equivalente) con:
   - Fecha en que se hizo la validación.
   - Versión del commit validado (`git rev-parse HEAD`).
   - Tabla con cada ruta y su resultado (Sin errores / N errores).
   - Lista de warnings aceptados conscientemente y por qué (ver "Falsos positivos" arriba).

Ejemplo de tabla para el resumen:

| Ruta | Resultado HTML | Notas |
|---|---|---|
| `/` | Sin errores | — |
| `/dashboard` | Sin errores | — |
| `/comunidades` | 1 warning | Atributo `noValidate` en formulario (aceptado) |
| ... | ... | ... |

---

## 4. Validación bonus: accesibilidad

El W3C también mantiene los estándares **WCAG** de accesibilidad. No hay un validador online oficial único, pero se recomienda:

- **WAVE** (https://wave.webaim.org/) — Pega la URL pública o el HTML y obtienes un informe visual.
- **Lighthouse** — Integrado en DevTools de Chrome/Edge: pestaña **Lighthouse**, marcar **Accessibility**, generar informe.

Estos no son obligatorios para la validación W3C de HTML/CSS, pero suman puntos al demostrar buena praxis en el PBL.

---

## Resumen rápido (chuleta)

```powershell
cd frontend
npm run build
npm run preview        # http://localhost:4173
```

1. Navegar a cada ruta en el navegador.
2. DevTools -> Elements -> botón derecho en `<html>` -> Copy outerHTML.
3. Pegar en https://validator.w3.org/#validate_by_input -> Check.
4. Subir `dist/assets/*.css` a https://jigsaw.w3.org/css-validator/#validate_by_upload -> Check.
5. Capturar pantallas y guardar en `validacion-w3c/`.
