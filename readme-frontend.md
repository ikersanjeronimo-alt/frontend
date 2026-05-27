# ShareYourStory — Frontend

Documentación técnica del frontend de ShareYourStory. Explica qué hay implementado, cómo está organizado y cómo funciona cada parte.

---

## Arrancar en local

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

> **Prerequisito:** Node.js 20+.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | ~5.8 |
| Framework | React | 19 |
| Bundler | Vite | 8 |
| Estilos | CSS Modules + variables CSS globales | — |
| Enrutamiento | React Router DOM | v7 |
| Mapa | Leaflet + react-leaflet | 1.9 / 4.x |
| i18n | i18next + react-i18next | — |
| Tipografía | Inter (Google Fonts) | — |

No hay dependencia de Bootstrap ni ningún framework CSS externo. Todos los estilos son CSS Modules por componente más un sistema de tokens CSS globales.

---

## Estructura de carpetas

```
frontend/
├── public/
├── src/
│   ├── assets/               # Imágenes y SVGs estáticos
│   ├── components/
│   │   ├── auth/             # TotpPanel (2FA)
│   │   ├── chat/             # ChatLayout y sub-componentes reutilizables
│   │   ├── events/           # EventFormSection
│   │   ├── layout/           # Navbar, Footer, MainLayout, BareLayout, DemoModeBanner
│   │   ├── moderation/       # ReportsSection, MembersSection, BannedWordsSection
│   │   ├── settings/         # AccountSection, ModProfileSection, AppearanceSection, …
│   │   └── ui/               # PageState, ErrorBoundary, SleepingCat, Icons, Select, …
│   ├── context/
│   │   └── AuthContext.tsx         # Estado global de autenticación
│   ├── hooks/                # useApi, useAuth, useRole, useCommunities, useEvents, …
│   ├── lib/                  # i18n, roles, initials, bannedWords, eventInterests, authBus, …
│   ├── mocks/
│   │   └── data.ts           # Única fuente de datos mock (importación siempre dinámica)
│   ├── pages/                # Una página = un .tsx + un .module.css
│   ├── services/             # apiFetch, auth, communities, events, profile, storage, …
│   ├── styles/
│   │   ├── variables.css           # Tokens CSS (colores, sombras, tipografía)
│   │   └── animations.css          # Keyframes y clases de animación
│   ├── types/
│   │   └── api.ts            # Tipos compartidos del contrato con el backend
│   ├── App.tsx               # Configuración del router y layouts anidados
│   ├── index.css             # Reset CSS + imports de estilos globales
│   └── main.tsx              # Punto de entrada de React
├── index.html
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

---

## Sistema de diseño

### Tokens CSS

Todos los colores, sombras y la tipografía están definidos como variables CSS en `src/styles/variables.css` y son accesibles en cualquier `.module.css` sin necesidad de importación adicional.

Los tokens principales:

```css
--primary:     #8A7DC4   /* lavanda media — color principal */
--primary-dk:  #6B5BAA   /* hover de botones */
--primary-lt:  #E8E4F6   /* fondos de chips y bordes suaves */
--primary-vlt: #F3F1FB   /* fondos de cards */
--peach:       #F5A882   /* acento cálido secundario */
--peach-lt:    #FEF0EA   /* fondos de secciones cálidas */
--bg:          #F9F7FC   /* fondo general de la app */
--dark:        #2A2560   /* texto principal */
--mid:         #696283   /* texto secundario */
--lite:        #9E99B5   /* texto terciario, placeholders */
--border:      #E5E0F5   /* bordes de componentes */
--white:       #FFFFFF   /* cards y modales */
--green:       #7BC67E   /* estados online, confirmaciones */
--green-lt:    #E5F7E6   /* fondos de estados positivos */
--shadow-sm    /* sombra suave lavanda */
--shadow-md    /* sombra media lavanda */
--shadow-lg    /* sombra grande lavanda */
--font:        'Inter', sans-serif
```

### Clases de animación

Definidas en `src/styles/animations.css`:

| Clase | Efecto |
|---|---|
| `.animate-fadeInUp` | Entra subiendo desde abajo con fade |
| `.animate-fadeIn` | Aparece con fade |
| `.animate-scaleIn` | Aparece escalando desde 0.95 |
| `.hover-lift` | Sube 4px + sombra más intensa en hover |
| `.blob` | Elipse decorativa (border-radius 50%) |
| `.blob-float` | Animación de flotación |
| `.blob-float-slow` | Flotación más lenta |
| `.delay-1` a `.delay-6` | Delays escalonados de 100ms a 600ms |

### Responsive — Mobile First

Todos los CSS Modules siguen la convención **mobile first**: los estilos base aplican al móvil (≥ 375px) y se escala con `min-width`. Los breakpoints utilizados son:

```css
@media (min-width: 576px) { ... }   /* tablet pequeña */
@media (min-width: 768px) { ... }   /* tablet */
@media (min-width: 992px) { ... }   /* desktop */
@media (min-width: 1200px) { ... }  /* desktop ancho */
```

Nunca se usa `max-width` en CSS propio.

---

## Autenticación — AuthContext

**Archivo:** `src/context/AuthContext.tsx`

Provee el estado global de sesión a toda la app mediante `AuthProvider` y el hook `useAuth()`.

```ts
const { user, isLoading, login, register, logout, updateUsername, loginAsMod, verifyLoginAsMod } = useAuth()
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `user` | `{ id: string, username: string, role: UserRole, token: string } \| null` | `null` = sin sesión |
| `isLoading` | `boolean` | Mientras se verifica el token |
| `login(username, password)` | función | Llama a `POST /api/auth/login` |
| `register(username, password)` | función | Llama a `POST /api/auth/register` |
| `logout()` | función | Limpia sesión y genera usuario anónimo nuevo |
| `updateUsername(username)` | función | Actualiza el username sin recargar |
| `loginAsMod(email, password)` | función | Paso 1 del login de moderadores. Llama a `POST /api/auth/login/mod`, devuelve `{ challengeId, requires2fa }`. No establece sesión todavía. |
| `verifyLoginAsMod(challengeId, code)` | función | Paso 2 del login de moderadores (2FA TOTP). Llama a `POST /api/auth/login/mod/verify`, establece sesión si el código es válido. |

Login y register usan **username + contraseña** (sin email). Si el backend no está disponible, cae a mock local automáticamente.

El usuario anónimo recibe un JWT en `POST /api/auth/anonymous`. El frontend lo guarda en `localStorage` (`sys_token`) y lo envía en cada petición. Al registrarse, se pasa el `anonToken` para que el backend migre el historial.

---

## Pantallas implementadas

### 01. LandingPage — `/`
Primera impresión. Hero con CTA + grid de funcionalidades.

- **Hero:** Título, subtítulo, botón "Empieza a compartir", nota anónima.
- **Features grid:** 5 cards (Comunidades como destacada grande en la izquierda, 4 cards pequeñas: Eventos, Mapa, Botella, Máquina del tiempo). En desktop: grid CSS `1.6fr 1fr 1fr` con la card Comunidades abarcando 2 filas.
- Navega a la pantalla correspondiente al hacer clic en cada card.

### 02. OnboardingPage — `/onboarding`
Wizard de 4 pasos para nuevos usuarios.

- **Paso 1 — Bienvenida:** Introducción a la plataforma y sus valores.
- **Paso 2 — Username:** Input pre-rellenado con el username del usuario. Validación mínimo 3 caracteres.
- **Paso 3 — Intereses:** Grid de 10 chips de temas (ansiedad, autoestima, relaciones…). Mínimo 1 requerido.
- **Paso 4 — Privacidad:** Resumen de valores de la plataforma. Al finalizar navega a `/dashboard`.
- Indicador de progreso: puntos de colores, el activo tiene `width: 24px` y border-radius extendido.
- Transición entre pasos con clase `cardOut` (fade-out) antes de cambiar el estado.

### 03. LoginPage — `/login`
Acceso o creación de cuenta.

- **Tab switcher:** "Iniciar sesión" / "Crear cuenta" — alterna entre modos con animación de selección.
- **Modo registro:** Muestra un campo extra de username.
- Toggle de visibilidad de contraseña (ojo / mono tapando los ojos).
- "¿La olvidaste?" link visible solo en modo login.
- Error inline en pill roja.
- Submit con 800ms de delay simulado → `login()` → navega a `/dashboard`.
- Botón "🔒 Continuar de forma anónima" → `/dashboard` sin credenciales.

### 04. DashboardPage — `/dashboard`
Hub principal post-login.

- Banner de bienvenida con username del usuario.
- **Selector de estado de ánimo:** 5 emojis (😔 😟 😐 🙂 😊). El seleccionado se resalta y aparece un mensaje de confirmación personalizado.
- **Columna izquierda:** Lista de comunidades activas (con badge de mensajes no leídos), mensajes recientes.
- **Columna derecha:** Card de próximo evento, grid de 3 acciones rápidas (Botella, Máquina del tiempo, Mapa), consejo del día de un profesional.

### 05. ProfilePage — `/perfil`
Perfil del usuario.

- Banner con fondo lavanda (140px). Avatar con iniciales del username a `position: absolute; bottom: -44px`.
- Username mostrado como texto estático. La edición se realiza en `/configuracion` → sección "Mi cuenta".
- Fila de 4 estadísticas en grid 2→4 columnas.
- Dos columnas: timeline de actividad reciente + preferencias (lista con valor y flecha).

### 06. SettingsPage — `/configuracion`
Ajustes de cuenta y privacidad.

- **Sidebar izquierda:** 7 secciones (Mi cuenta, Privacidad, Notificaciones, Apariencia, Idioma, Seguridad, Ayuda) + "Cerrar sesión".
- En móvil la sidebar está oculta; un botón la abre como overlay fijo.
- Sección "Privacidad": componente `Toggle` personalizado (switch CSS 44×26px, sin dependencia JS).
- Sección "Idioma": selector con bandera y nombre.
- "Cerrar sesión" llama a `logout()` y navega a `/`.

### 07. ProfessionalsPage — `/profesionales`
Catálogo de profesionales de salud mental.

- Búsqueda por nombre/especialidad (filtra en tiempo real).
- Filtros: Todos / Psicólogos / Terapeutas / Psiquiatras / Disponibles ahora.
- **Grid de cards** con: avatar (iniciales), nombre, especialidad, rating (función `renderStars()` con ★ y ½), número de sesiones, pill de disponibilidad (verde / naranja / azul), botón "Contactar".
- `Availability` type: `'now' | 'today' | 'tomorrow'` → colores diferentes.
- "Contactar" navega a `/chat/:id`.

### 08. PrivateChatPage — `/chat/:professionalId`
Chat 1 a 1 entre el usuario y un profesional de salud mental (psicólogo / terapeuta / psiquiatra).

- **Layout 3 columnas** (igual que CommunityChatPage): sidebar izquierda con lista de todos los profesionales + chat central + panel derecho de info.
- **Header:** avatar con iniciales, nombre y especialidad del profesional. Botón ⓘ abre el panel derecho.
- **Burbujas:** propias (lavanda, derecha) y del profesional (lavanda claro, izquierda con iniciales).
- **Empty state:** mensaje si todavía no hay conversación.
- **Panel derecho:** disponibilidad (pill verde/naranja/gris), bio y tags del profesional.
- **Not-found:** si el `:professionalId` no existe muestra "Profesional no encontrado" con CTA a `/profesionales`.
- Censura con `maskBannedWords`. Error de envío visible bajo el composer con `role="alert"`.
- Se llega desde el botón "Contactar" de `ProfessionalsPage`.

### 09. CommunityListPage — `/comunidades`
Explorador de comunidades.

- Buscador en tiempo real por nombre y descripción.
- Filtros por categoría: Todos / Ansiedad / Depresión / Autoestima / Relaciones / Duelo / Mindfulness.
- Grid 1→2→3 columnas con cards de comunidad: emoji, nombre, moderador, descripción, online count, miembros, botón Unirse/Unido.
- Estado de "unido" gestionado con `Set<string>` en local state.
- Empty state cuando los filtros no devuelven resultados.

### 10. CommunityChatPage — `/comunidades/:comunidadId`
Chat en tiempo real dentro de una comunidad.

- **Layout 3 columnas:** sidebar izquierda (oculto <992px) + chat central (flex:1) + panel derecho (oculto <992px, overlay en móvil).
- **Sidebar:** Lista de comunidades del usuario, la activa resaltada.
- **Chat:** Burbujas propias (lavanda, derecha) y ajenas (lavanda claro, izquierda). Username visible solo cuando cambia el emisor. Auto-scroll con `useRef` + `useEffect`.
- **Panel derecho:** Info de la comunidad (nombre, descripción, stats, moderador), lista de miembros activos.
- Botón ⓘ activa el panel como overlay en móvil.
- Enter envía mensaje, Shift+Enter inserta salto de línea.
- El layout tiene `height: calc(100vh - 64px); overflow: hidden` para que el chat no expanda la página.

### 11. EventListPage — `/eventos`
Listado de eventos y talleres.

- Filtros por tipo: Todos / Talleres / Sesiones / Charlas.
- Cards horizontales: emoji, tipo (pill con color propio), fecha, título, moderador, descripción recortada a 2 líneas, barra de progreso de plazas, botón "Apuntarse" / "✓ Apuntado".
- Los datos se obtienen mediante el hook `useEvents()` (con fallback al mock centralizado en `mocks/data.ts`).

### 12. EventDetailPage — `/eventos/:eventId`
Vista completa de un evento.

- Localiza el evento con `useEvents().data.find(id)` a partir del `useParams`.
- **Hero:** Emoji, título, badge de tipo, moderador.
- **Layout 2 columnas (992px+):** columna principal (descripción, qué esperar, tags) + sidebar sticky (info rows: fecha/hora/formato/aforo, barra de plazas, botón CTA).
- Botón CTA alterna entre "Apuntarse", "✓ Apuntado" y "Completo" (deshabilitado).

### 13. TimeMachinePage — `/maquina-del-tiempo`
El usuario escribe una carta que recibirá por email en 5 años.

- **Flujo:** `write` → `confirm` → `sent`.
- `deliveryDate` = fecha actual + 5 años, formateada con `toLocaleDateString('es-ES')`.
- Textarea estilo carta con líneas decorativas absolutas.
- `MAX_CHARS = 1000`, mínimo 20 caracteres + email válido para continuar.
- **Animación de lanzamiento:** emoji de sobre con `@keyframes launch` (translateY + rotate + fadeOut) al pasar a estado `sent`.

### 14. BottleMessagePage — `/botella`
Mensajes anónimos enviados a un usuario aleatorio.

- **Fondo:** Gradiente de océano (azul profundo → azul claro).
- **Ondas animadas:** Dos capas SVG con `@keyframes wave` en bucle (la segunda con `animation-delay`).
- **Flujo:** `write` → lanzamiento (animación de botella) → `sent` → "Recoger una botella" → `received` (mensaje aleatorio de 3 mocks).
- `MAX_CHARS = 400`.
- Los botones de recepción se deshabilitan mientras la petición está en vuelo para evitar dobles solicitudes.

### 15. MapPage — `/mapa`
Mapa mundial de historias anónimas.

- **Librería:** Leaflet 1.9 + react-leaflet. Tiles CartoDB Voyager (gratis, sin API key).
- **Fix de iconos Leaflet en Vite:** Sobreescritura de `L.Icon.Default._getIconUrl` + `mergeOptions` con paths locales bundleados.
- **Marcadores:** `L.divIcon` con HTML inline — círculo de color + emoji (escapado para prevenir XSS). 2 tipos: historia publicada (lavanda) y marcador pendiente mientras se escribe (melocotón).
- **Añadir historia:** FAB activa modo click → clic en el mapa crea `pendingMarker` + panel de escritura → envío agrega la story al estado.
- `MapClickHandler` es un componente hijo que usa el hook `useMapEvents` (necesario porque `useMapEvents` solo funciona dentro de `MapContainer`).
- 12 historias mock distribuidas por el mundo.
- Stats bar en esquina inferior: total de historias en el mapa.

### 16. EventCreatePage — `/eventos/nuevo`
Formulario de creación de evento. Solo accesible para `MODERATOR` y `ADMIN` (guard `<RequireRole>`).

- Campos: título, descripción, tipo (Taller/Sesión/Charla), fecha, hora, formato (Online/Presencial), aforo, tags.
- Validación inline. Al enviar muestra mensaje de éxito + redirige a `/eventos` a los 1.8 s.
- **Sin backend real todavía** — simula el envío. Se conectará a `POST /api/events` cuando exista.

### 17. ModLoginPage — `/loginmod`
Login de moderadores y administradores con autenticación en dos factores (TOTP).

- **Fase 1 — Credenciales:** email + contraseña. Al enviar llama a `loginAsMod()` → obtiene un `challengeId`.
- **Fase 2 — TOTP:** input de 6 dígitos (Google Authenticator). Llama a `verifyLoginAsMod()` → establece sesión si el código es válido.
- Usa el componente `TotpPanel` (sin prop `enroll`).
- Botón "Volver" en la fase TOTP reinicia al estado de credenciales.

### 18. ModRegisterPage — `/modregister`
Registro de moderadores y administradores con enrolamiento TOTP.

- **Dos pestañas:** Moderador (pide profesión y especialización opcionales) / Administrador (sin empresa).
- **Fase 1 — Formulario:** nombre, apellido, username, email, contraseña, rol, empresa (solo mod), profesión, especialización.
- **Fase 2 — Enrolamiento:** `TotpPanel` con `enroll={secret, otpauthUri}` muestra el QR de Google Authenticator. Verificación del primer código con `verifyModRegistration`.
- **Fase 3 — Éxito:** confirmación + CTA a `/loginmod`.

### 19. ModerationPage — `/moderacion`
Panel de control para moderadores.

- **Stats row:** 4 cards (Pendientes, Resueltos hoy, Comunidades, Miembros) con colores naranja/verde/lavanda.
- **Alert badge** en el header cuando hay reportes pendientes.
- **3 secciones** con nav de pills:
  - **Reportes:** Filtros (Todos / Pendientes / Resueltos / Descartados), lista de reportes expandibles. Clic en un reporte pendiente → botones inline (Resolver, Avisar, Descartar). Borde izquierdo de color según estado.
  - **Miembros:** Tabla de miembros con avatar, info, badge de reportes acumulados, botones Avisar/Banear.
  - **Filtro automático:** 4 stats cards (palabras bloqueadas, advertencias hoy, bloqueados hoy, precisión %).

---

## Componentes de layout

### Navbar (`src/components/layout/Navbar.tsx`)

- Sticky en top con `z-index: 100`.
- **Logo** (NavLink a `/`) a la izquierda.
- **Links centrales:** Comunidades, Eventos, Mapa, Botella, Máquina del tiempo, Ayuda profesional.
- **Username chip** a la derecha: muestra el username del usuario o "Anónimo". Clic → edición inline con Enter para guardar y Escape para cancelar. Llama a `updateUsername()`.
- **Botón "Entrar"** → `/login`. Solo visible si no hay sesión.
- **Hamburger** en móvil (<992px): despliega menú vertical con los mismos links.

### Footer (`src/components/layout/Footer.tsx`)

- Fondo `var(--dark)` (azul marino oscuro).
- Logo (NavLink a `/`) a la izquierda en blanco.
- Link "Cómo conseguir ayuda profesional" → `/profesionales` en lavanda claro, empujado a la derecha con `margin-left: auto`.
- Nota de privacidad en blanco con opacidad 35%.
- Layout flex en una sola fila.

---

## Datos mock y TODOs de integración

Actualmente **toda la data es local** — arrays y objetos TypeScript hardcodeados en cada página. Cuando el backend esté listo, hay que sustituir:

| Página | Endpoint a conectar |
|---|---|
| LoginPage | `POST /api/auth/login`, `POST /api/auth/register` |
| AuthContext | `POST /api/auth/anonymous`, `GET /api/auth/me` |
| CommunityListPage | `GET /api/communities` |
| CommunityChatPage | `GET /api/communities/:id/messages`, WebSocket STOMP |
| EventListPage / EventDetailPage | `GET /api/events`, `POST /api/events/:id/join` |
| ProfessionalsPage | `GET /api/professionals` |
| MapPage | `GET /api/stories`, `POST /api/stories` |
| TimeMachinePage | `POST /api/letters` |
| BottleMessagePage | `POST /api/bottles`, `GET /api/bottles/received` |
| ModerationPage | `GET /api/reports`, `PATCH /api/reports/:id` |
| ProfilePage | `GET /api/users/me`, `PATCH /api/users/me/username` |

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción en /dist
npm run preview  # Preview del build de producción
npm run lint     # ESLint sobre todos los archivos TS/TSX
```
