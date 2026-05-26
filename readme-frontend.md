# ShareYourStory — Frontend

Guía completa del frontend para alguien que llega nuevo al proyecto.

---

## Índice

1. [¿Qué es esto?](#qué-es-esto)
2. [Tecnologías](#tecnologías)
3. [Arrancar el proyecto](#arrancar-el-proyecto)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Cómo funciona la autenticación](#cómo-funciona-la-autenticación)
6. [Rutas y páginas](#rutas-y-páginas)
7. [Sistema de estilos](#sistema-de-estilos)
8. [Componentes compartidos](#componentes-compartidos)
9. [Cómo añadir una página nueva](#cómo-añadir-una-página-nueva)
10. [Estado del proyecto](#estado-del-proyecto)

---

## ¿Qué es esto?

ShareYourStory es una aplicación web de apoyo emocional para jóvenes. Permite crear comunidades de chat moderadas por profesionales de salud mental, asistir a eventos terapéuticos, enviar mensajes anónimos y escribir cartas al futuro, entre otras funcionalidades.

**Estado actual:** el frontend está integrado con el backend de Spring Boot. Cada hook y servicio intenta llamar al endpoint real; si el backend está caído (network error), la llamada cae automáticamente a un fallback local definido en `src/mocks/data.ts` y la app sigue funcionando para el demo. Si el backend responde con un error de servidor (4xx/5xx fuera del flujo de auth), el error se propaga a la UI.

Hoy en día solo `POST /api/auth/register/mod` existe en el backend, así que el resto de las llamadas caen al mock — pero el código está listo para activarse en cuanto cada endpoint se implemente, sin tocar el front.

---

## Tecnologías

| Herramienta | Versión | Para qué sirve |
|---|---|---|
| **React** | 19 | La librería principal para construir la interfaz |
| **TypeScript** | 6 | JavaScript con tipos — el compilador avisa de errores antes de ejecutar |
| **Vite** | 8 | Servidor de desarrollo y herramienta de build (mucho más rápido que Webpack) |
| **React Router** | 7 | Gestiona las rutas — qué componente se muestra según la URL |
| **CSS Modules** | — | Estilos encapsulados por componente, sin conflictos de nombres |
| **Leaflet / react-leaflet** | 1.9 / 5 | Mapa interactivo del mundo en la página `/mapa` |
| **Bootstrap** | 5 | Solo se usa para sobreescribir variables SCSS globales, no se usan sus clases |

---

## Arrancar el proyecto

```bash
# Desde la carpeta frontend/
npm install       # instalar dependencias (solo la primera vez)
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # comprueba TypeScript + genera el build de producción
npm run lint      # ejecuta ESLint para detectar problemas de código
```

> **Nota:** Si tienes el devcontainer con Docker activo, el servidor de desarrollo ya corre dentro del contenedor en el puerto 5173 y apunta al backend en `http://java-app:8080`. Fuera del contenedor, el proxy de Vite redirige `/api/*` a `http://localhost:8080`.

---

## Estructura de carpetas

```
frontend/
├── public/               # Ficheros estáticos servidos tal cual (favicon, etc.)
├── src/
│   ├── main.tsx          # Punto de entrada — monta <App /> en el DOM
│   ├── App.tsx           # Define todas las rutas con React Router
│   ├── App.css           # Solo el wrapper .page-content
│   ├── index.css         # Reset global + importa variables y animaciones
│   │
│   ├── context/
│   │   └── AuthContext.tsx   # Estado global de autenticación (ver sección abajo)
│   │
│   ├── services/             # Todas las llamadas al backend
│   │   ├── api.ts            # apiFetch helper (auth header, network errors, evento auth:expired)
│   │   ├── auth.ts           # login/register/anonymous + capa de traducción de roles
│   │   ├── profile.ts        # GET/PATCH /api/users/me/*
│   │   ├── communities.ts    # GET /api/communities, join/leave, mensajes
│   │   ├── events.ts         # GET/POST eventos
│   │   ├── stories.ts        # historias del mapa
│   │   ├── bottles.ts        # botellas al mar
│   │   ├── letters.ts        # cartas al futuro
│   │   ├── professionals.ts  # profesionales
│   │   └── moderation.ts     # reportes
│   │
│   ├── hooks/                # Hooks de datos — todos usan useApi
│   │   ├── useApi.ts             # Helper canónico: fetcher real con fallback al mock
│   │   ├── useCommunities.ts     # → GET /api/communities
│   │   ├── useEvents.ts          # → GET /api/events
│   │   ├── useProfessionals.ts   # → GET /api/professionals
│   │   ├── useProfile.ts         # → GET /api/users/me/profile
│   │   ├── useMapStories.ts      # → GET /api/stories
│   │   ├── useModerationReports.ts # → GET /api/reports
│   │   └── useCommunityChat.ts   # GET mensajes + sendMessage optimistic
│   │
│   ├── types/
│   │   └── api.ts            # Tipos compartidos (ApiUser, ApiCommunity, ApiEvent, etc.)
│   │
│   ├── mocks/
│   │   └── data.ts           # Única fuente de mocks (MOCK_COMMUNITIES, MOCK_EVENTS, ...)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Barra de navegación superior
│   │   │   ├── Navbar.module.css
│   │   │   ├── Footer.tsx          # Pie de página
│   │   │   └── Footer.module.css
│   │   └── ui/
│   │       ├── Icons.tsx           # SVG inline (IconHeart, IconCalendar, IconLock, etc.)
│   │       ├── Select.tsx          # Dropdown genérico con teclado y a11y
│   │       ├── Select.module.css
│   │       └── PageState.tsx       # Loading / error / empty unificado
│   │
│   ├── pages/            # Una página = un .tsx + un .module.css al lado
│   │   ├── LandingPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── CommunityListPage.tsx
│   │   ├── CommunityChatPage.tsx
│   │   ├── EventListPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── EventCreatePage.tsx     # Crear evento (solo MOD/ADMIN)
│   │   ├── ProfessionalsPage.tsx
│   │   ├── PrivateChatPage.tsx     # Placeholder (chat 1 a 1 con profesional)
│   │   ├── TimeMachinePage.tsx
│   │   ├── BottleMessagePage.tsx
│   │   ├── MapPage.tsx
│   │   ├── ModerationPage.tsx
│   │   ├── ModLoginPage.tsx        # Login para moderadores
│   │   └── ModRegisterPage.tsx     # Registro de moderador / admin
│   │
│   └── styles/
│       ├── variables.css         # Tokens de diseño (colores, sombras, tipografía…)
│       ├── animations.css        # Keyframes y clases de animación reutilizables
│       └── bootstrap-theme.scss  # Sobreescritura de variables de Bootstrap
│
├── vite.config.ts        # Configuración de Vite (proxy /api, silenciar warnings de Sass)
├── tsconfig.json         # Configuración de TypeScript
├── eslint.config.js      # Reglas de ESLint
└── package.json          # Dependencias y scripts
```

### Reglas importantes

- Cada página vive en un único fichero `.tsx` con un fichero `.module.css` al lado. No hay carpetas por componente — la sencillez es intencionada mientras el proyecto es pequeño.
- **Los mocks viven solo en `src/mocks/data.ts`.** No metas datos hardcoded en componentes. Si necesitas un mock nuevo, añádelo allí.
- **Los hooks de datos siempre usan `useApi(fetcher, fallback)`.** Si añades un hook nuevo, no reinventes `useState + useEffect`.
- **Los emojis pictográficos están prohibidos en la UI.** Usa SVG de `components/ui/Icons.tsx` (añade el icono si no existe). Los símbolos tipográficos monocromos (`✓ ✕ ✎ ➤ ☰ ★`) sí se permiten como texto.

---

## Cómo funciona la autenticación

El sistema de autenticación es el núcleo del frontend. Está en `src/context/AuthContext.tsx`.

### La idea principal: el usuario anónimo

**Todo visitante recibe una identidad desde el primer segundo**, sin necesidad de registrarse. Al cargar la app, `AuthContext` llama a `POST /api/auth/anonymous` y el backend devuelve un token JWT y un username aleatorio (ej. `SerenaRío4291`).

Ese token se guarda en `localStorage` con la clave `sys_token`. La próxima vez que el usuario abra la app, el token se envía de vuelta al backend para recuperar la misma identidad anónima.

### Política de fallback (importante)

Cada función del contexto (`init`, `login`, `register`, `updateUsername`, `logout`) llama al backend real. Si la llamada falla, se distingue entre dos casos:

- **Network error** (back caído, CORS, DNS) → se cae a un mock local. El demo sigue funcionando sin backend.
- **Error de servidor** (401, 422, 500…) → el error se propaga a la UI para que el usuario vea el mensaje. **No** caemos al mock; si las credenciales son incorrectas, queremos decírselo al usuario.

Esto vive en `services/api.ts` (helper `isNetworkError`) y se aplica de forma consistente en `AuthContext` y en todos los hooks de datos.

### El objeto `user`

El contexto expone un objeto `user` que puede ser `null` (mientras carga) o un objeto con esta forma:

```typescript
{
  id: string       // UUID del usuario
  username: string // Nombre visible, ej. "ValienteViento2047"
  role: 'ANON' | 'USER' | 'MODERATOR' | 'ADMIN'
  token: string    // JWT para autorizar llamadas a la API
}
```

### Roles: traducción entre backend y frontend

El backend trabaja con `'PROFESSIONAL' | 'ADMINISTRATOR' | 'USER' | 'ANON'`. El frontend trabaja con `'ANON' | 'USER' | 'MODERATOR' | 'ADMIN'`. La traducción vive **solo** en `services/auth.ts` (helper `mapBackendRole`):

| Backend | Frontend |
|---|---|
| `PROFESSIONAL` | `MODERATOR` |
| `ADMINISTRATOR` | `ADMIN` |
| `USER` | `USER` |
| `ANON` | `ANON` |

Los tipos `BackendUser` / `BackendAuthResponse` son privados de `services/auth.ts` y no se exportan. El resto de la app solo conoce `UserRole`.

### Funciones disponibles

Cualquier componente puede llamar a `useAuth()` para acceder a:

```typescript
const { user, isLoading, login, register, logout, updateUsername } = useAuth()
```

| Función | Qué hace |
|---|---|
| `login(username, password)` | Llama a `POST /api/auth/login`. Si las credenciales son incorrectas (error de servidor), lanza un `ApiError` con el mensaje. Si el back está caído, cae al mock. |
| `register(username, password)` | Llama a `POST /api/auth/register` enviando también el token anónimo para migrar el historial. Mismo manejo de errores que `login`. |
| `logout()` | Borra el token de `localStorage` y re-inicia sesión anónima (vuelve a llamar a `POST /api/auth/anonymous` con fallback al mock). |
| `updateUsername(username)` | Optimistic: actualiza el estado local primero, luego llama a `PATCH /api/users/me/username` en segundo plano. Errores se silencian (best-effort). |

### Ejemplo de uso en un componente

```typescript
import { useAuth } from '../context/AuthContext'

export function MiComponente() {
  const { user } = useAuth()

  return <p>Hola, {user?.username ?? 'cargando...'}</p>
}
```

### Jerarquía de roles

- **ANON** — usuario anónimo, puede leer y participar en comunidades.
- **USER** — usuario registrado con username y contraseña.
- **MODERATOR** — puede acceder a `/moderacion` y gestionar reportes. Se crea desde `/modregister` o por el backend.
- **ADMIN** — acceso total, incluido crear cuentas de moderador.

> **Nota de seguridad:** anteriormente el rol se asignaba leyendo el prefijo del username (`startsWith('admin') → ADMIN`). Eso era privilege escalation por cliente. Se eliminó en la auditoría — el rol viene siempre del JWT del backend (o del mock fallback que asigna USER).

### Sesión expirada (401)

Si el `apiFetch` recibe un 401 fuera de las rutas `/api/auth/*`, asume que el token ha expirado: limpia `localStorage` y dispara un `CustomEvent('auth:expired')` en `window`. El `AuthProvider` lo escucha y reinicia sesión anónima — sin reload de página, manteniendo el estado de la SPA.

Los 401 dentro de `/api/auth/*` (credenciales incorrectas) **no** se tratan como sesión expirada; se propagan al componente que llamó.

---

## Datos del backend: el patrón `useApi`

Todos los hooks de datos (`useCommunities`, `useEvents`, `useProfessionals`, `useProfile`, `useMapStories`, `useModerationReports`) usan el mismo helper genérico, `useApi`:

```typescript
// src/hooks/useApi.ts
export function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: unknown[] = []) {
  // Llama a fetcher() al montar (y cuando cambien deps).
  //  - Si responde, devuelve esos datos.
  //  - Si hay network error, cae a fallback (NO marca error).
  //  - Si hay error de servidor, expone el mensaje en `error`.
  // Devuelve { data, setData, loading, error }
}
```

Eso permite que cada hook quede en 4 líneas:

```typescript
// src/hooks/useCommunities.ts
import { useApi } from './useApi'
import { getCommunities } from '../services/communities'
import { MOCK_COMMUNITIES } from '../mocks/data'

export function useCommunities() {
  return useApi(getCommunities, MOCK_COMMUNITIES)
}
```

### Cómo añadir un hook nuevo

1. Crear el servicio en `src/services/`:
   ```typescript
   // src/services/posts.ts
   import { apiFetch } from './api'
   import type { ApiPost } from '../types/api'

   export const getPosts = () => apiFetch<ApiPost[]>('/api/posts')
   ```
2. Añadir el mock correspondiente en `src/mocks/data.ts`:
   ```typescript
   export const MOCK_POSTS: ApiPost[] = [/* ... */]
   ```
3. Crear el hook:
   ```typescript
   // src/hooks/usePosts.ts
   import { useApi } from './useApi'
   import { getPosts } from '../services/posts'
   import { MOCK_POSTS } from '../mocks/data'

   export function usePosts() {
     return useApi(getPosts, MOCK_POSTS)
   }
   ```

Eso es todo. El componente lo consume como `const { data, loading, error } = usePosts()`.

### Mutaciones optimistas

`useCommunityChat` es el ejemplo canónico: cuando llamas a `sendMessage(text)`, primero añade el mensaje al estado local (optimistic), después intenta `POST /api/communities/:id/messages`. Si el servidor responde error, se hace rollback del mensaje. Si el error es de red, se mantiene (estamos en modo demo). Repite el patrón en mutaciones similares.

---

---

## Rutas y páginas

Todas las rutas están definidas en `src/App.tsx`. La `Navbar` y el `Footer` envuelven todas las rutas y siempre están visibles.

### `/` — Landing Page

**Fichero:** `LandingPage.tsx`

La página de inicio. Tiene dos secciones:

- **Hero:** título grande, subtítulo y botón "Empieza a compartir" que lleva a `/onboarding`. Hay dos blobs decorativos animados de fondo.
- **Grid de funcionalidades:** cinco tarjetas clicables, una por funcionalidad principal (Comunidades, Eventos, Mapa, Botella, Máquina del tiempo). La de Comunidades es más grande (tarjeta `featured`). Cada tarjeta navega a su ruta al hacer clic.

---

### `/onboarding` — Onboarding

**Fichero:** `OnboardingPage.tsx`

Wizard de bienvenida de 4 pasos para nuevos usuarios. Hay un indicador de puntos arriba que muestra en qué paso está el usuario.

| Paso | Contenido |
|---|---|
| 0 | Bienvenida — qué ofrece la app |
| 1 | Username — input para personalizar el nombre (si está vacío, no puede avanzar) |
| 2 | Temas de interés — chips seleccionables (ansiedad, depresión, etc.), se puede saltar |
| 3 | Privacidad — explica cómo funciona el anonimato |

La transición entre pasos tiene una pequeña animación de salida (200 ms). Al llegar al último paso, el botón cambia a "Entrar a ShareYourStory" y navega a `/dashboard`.

---

### `/login` — Login / Registro

**Fichero:** `LoginPage.tsx`

Dos pestañas: "Iniciar sesión" y "Crear cuenta". Comparten el mismo formulario — el modo cambia qué validaciones se aplican y qué función del contexto se llama.

**Validaciones:**
- Username: mínimo 3 caracteres.
- Contraseña en registro: mínimo 8 caracteres.
- Los errores del backend (username ocupado, credenciales incorrectas) se muestran en un `<p>` rojo.

También hay un botón "Continuar de forma anónima" que va directamente a `/dashboard` sin registrarse.

---

### `/dashboard` — Dashboard

**Fichero:** `DashboardPage.tsx`

Pantalla principal tras el login. Tiene:

- **Banner** con saludo personalizado y nombre del usuario.
- **Selector de estado de ánimo** centrado: 5 caritas SVG (line-art, monocromas, `stroke="currentColor"`) del muy mal al muy bien — `IconMoodVeryBad`/`Bad`/`Neutral`/`Good`/`VeryGood` en `components/ui/Icons.tsx`. Al seleccionar uno aparece un mensaje de confirmación.
- **Grid de dos columnas:**
  - Izquierda: lista de "Mis comunidades" y "Mensajes recientes".
  - Derecha: próximo evento y "Acciones rápidas" (Botella, Máquina del tiempo, Mapa).

Todo usa datos mock. Cuando el backend esté listo, cada bloque se reemplazará por una llamada a la API.

---

### `/perfil` — Perfil

**Fichero:** `ProfilePage.tsx`

Perfil del usuario actual. Muestra:

- **Banner** con blob animado y avatar circular con las iniciales del username.
- **Username editable** — clic en el botón "✎ Editar username" despliega un input inline.
- **Badge de rol** y fecha de incorporación (actualmente calculada como -56 días desde hoy, valor mock).
- **Estadísticas** en cuadrícula: mensajes, eventos, comunidades, semanas activo.
- **Dos columnas:** actividad reciente (timeline) y preferencias con enlace a configuración.

---

### `/configuracion` — Configuración

**Fichero:** `SettingsPage.tsx`

Pantalla de ajustes con un sidebar de secciones. En móvil, el sidebar se colapsa con un botón de hamburguesa.

| Sección | Contenido |
|---|---|
| Mi cuenta | Avatar, username editable con botón "Guardar" |
| Privacidad | 3 toggles: perfil anónimo, estado en línea, historial de actividad |
| Notificaciones | 3 toggles: mensajes, eventos, email |
| Apariencia | Toggle de modo compacto + aviso de "modo oscuro próximamente" |
| Idioma | Selector de ES / EN / PT |
| Seguridad | Enlace a `/login` para gestionar contraseña |
| Ayuda | 3 FAQ habituales |
| Cerrar sesión | Llama a `logout()` y navega a `/` |

El componente `Toggle` (interruptor) está definido dentro del mismo fichero como función auxiliar.

---

### `/comunidades` — Lista de comunidades

**Fichero:** `CommunityListPage.tsx`

Listado de 8 comunidades de apoyo. Tiene:

- **Buscador** que filtra por nombre y descripción en tiempo real.
- **Chips de categoría** (Ansiedad, Depresión, Autoestima…) para filtrar por tema.
- **Grid de tarjetas** — cada tarjeta muestra emoji, nombre, moderador, descripción, número de miembros y un botón "Unirse" / "✓ Unido". El estado de unión se guarda con un `Set<string>` en el estado local.
- Clic en una tarjeta navega a `/comunidades/:id`.

---

### `/comunidades/:comunidadId` — Chat de comunidad

**Fichero:** `CommunityChatPage.tsx`

Layout de tres columnas (en escritorio):

- **Sidebar izquierdo** (solo visible ≥ 992px): lista de comunidades unidas (filtrado por `MOCK_JOINED_COMMUNITY_IDS`) + botón "Explorar comunidades".
- **Chat central:** header con nombre y moderador, nota pinneada del moderador (`MOCK_PINNED_NOTES[id]`), área de mensajes con burbujas, input con envío por Enter (sin Shift).
- **Panel derecho** (toggle con botón ⓘ, visible ≥ 1200px o al abrir en móvil): info de la comunidad, estadísticas, avatar del moderador, lista de miembros activos.

Los mensajes propios aparecen a la derecha en lavanda. Los ajenos aparecen a la izquierda con el avatar e iniciales del autor. El username del autor solo se muestra si el mensaje anterior era de otra persona (agrupación visual).

Si el `:comunidadId` no existe (en mocks o en el backend), la página muestra **"Comunidad no encontrada"** con CTA para volver al listado. No hay fallback silencioso a otra comunidad.

El scroll baja automáticamente al último mensaje solo si el usuario ya estaba cerca del final (umbral 120px). Si el usuario está leyendo historial arriba, no se le secuestra el scroll cuando entra un mensaje nuevo.

---

### `/eventos` — Lista de eventos

**Fichero:** `EventListPage.tsx`

Lista de 6 eventos (vienen de `useEvents()` → `MOCK_EVENTS` o del backend). Cada tarjeta muestra:

- Fecha, hora, duración y nombre del anfitrión.
- Descripción breve.
- Botón corazón (`IconHeart filled={liked}`) para marcar "me interesa" — estado local.
- Si el usuario es MOD/ADMIN, aparece un botón "+ Crear evento" en el header que lleva a `/eventos/nuevo`.

Cada card es cliqueable (patrón `cardLinkOverlay`) y lleva al detalle.

---

### `/eventos/nuevo` — Crear evento

**Fichero:** `EventCreatePage.tsx`

Formulario para que moderadores/admins creen un evento (título, descripción, fecha, hora, duración, host). Si el usuario no es MOD/ADMIN, muestra "Acceso restringido".

> **Pendiente backend:** al pulsar "Publicar evento" se simula con un `setTimeout` y redirige a `/eventos`. Cuando exista `POST /api/events`, conectar.

---

### `/eventos/:eventId` — Detalle de evento

**Fichero:** `EventDetailPage.tsx`

Página de detalle con dos columnas:

- **Columna principal:** hero con título y host, descripción, lista "qué puedes esperar" (4 ítems con SVG: `IconShield`, `IconHand`, `IconLock`, `IconQuestion`), tags. Si el usuario es MOD/ADMIN, puede añadir un formulario (opción múltiple o texto libre) debajo de la descripción.
- **Sidebar:** ficha con fecha (`IconCalendar`), duración (`IconClock`), host (`IconUser`) y botón "Me interesa" (`IconHeart filled={liked}`, paleta peach).

Obtiene el evento llamando a `useEvents()` y haciendo `.find(e => e.id === eventId)`. Si no lo encuentra, muestra "Evento no encontrado.".

---

### `/profesionales` — Profesionales

**Fichero:** `ProfessionalsPage.tsx`

Grid de 8 profesionales (psicólogos, terapeutas, psiquiatras). Tiene buscador (por nombre, especialidad o etiqueta) y chips de filtro por tipo de profesional y disponibilidad.

Cada tarjeta muestra avatar con iniciales, nombre, especialidad, bio, tags, valoración con estrellas, número de sesiones y una pill de disponibilidad (`AvailabilityPill` con `IconDot color="var(--green)"` / `color="var(--peach)"`):
- Verde — Disponible ahora
- Peach — Disponible a las HH:MM de hoy
- Gris — Mañana

El botón "Contactar" navega a `/chat/:professionalId` (pantalla en construcción). Mientras tanto, ese botón es la única vía para llegar a `PrivateChatPage` — si se quiere ocultar la promesa hasta que esté implementada, deshabilitar el botón aquí.

---

### `/chat/:professionalId` — Chat 1 a 1 con profesional

**Fichero:** `PrivateChatPage.tsx`

Placeholder. Esta pantalla cubre **solo conversaciones 1 a 1 entre un usuario y un profesional** (psicólogo/terapeuta/psiquiatra). **No existen chats privados entre usuarios anónimos**: los anónimos se comunican únicamente vía comunidades (chat grupal moderado) o `/botella` (mensaje anónimo one-shot). Se llega desde el botón "Contactar" de `/profesionales`. Pendiente implementar; alternativa: deshabilitar la entrada hasta que esté lista.

---

### `/loginmod` — Login de moderador

**Fichero:** `ModLoginPage.tsx`

Login específico para moderadores y administradores. Usa **email + contraseña** (a diferencia del login de usuario, que usa username). Llama a `loginMod(email, password)` → `POST /api/auth/login/mod`.

Si responde correctamente, guarda el token en `localStorage` y llama a `_setUserFromToken(user)` del `AuthContext` para refrescar el estado global. Navega a `/moderacion`.

Si las credenciales son incorrectas o el back falla, muestra el mensaje en un `<p>` rojo. **No hay fallback al mock** aquí — el flujo de moderador requiere backend real.

---

### `/modregister` — Registro de moderador o administrador

**Fichero:** `ModRegisterPage.tsx`

Solo accesible a usuarios con permisos suficientes (no hay guard todavía, igual que `/moderacion`). Tiene dos pestañas:

| Pestaña | Campos |
|---|---|
| Moderador | Nombre, apellido, username, email, empresa, profesión (opcional: Psicólogo/Terapeuta/Psiquiatra), especialización (opcional: Ansiedad/Depresión/Estrés/Duelo/Autoestima/Relaciones), contraseña |
| Administrador | Nombre, apellido, username, email, contraseña (sin empresa, sin profesión/especialización) |

Llama a `registerMod(payload)` → `POST /api/auth/register/mod`. Tras éxito, muestra un mensaje de confirmación con CTA "Registrar otro" o "Volver al panel".

> **Nota:** los campos `profession` y `specialization` se envían si el usuario los elige, pero el backend actual los ignora silenciosamente (no están en `RegisterRequest`). Cuando se añadan al backend, no hace falta tocar el front.

---

### `/maquina-del-tiempo` — Máquina del tiempo

**Fichero:** `TimeMachinePage.tsx`

Flujo de 3 pasos para escribir una carta al yo futuro:

| Paso | Qué hace el usuario |
|---|---|
| `write` | Escribe la carta (mín. 20 caracteres, máx. 1000) e introduce su email. Ambos campos son obligatorios para continuar. |
| `confirm` | Ve la carta en un recuadro de confirmación junto con la fecha de entrega (exactamente 5 años desde hoy) y el email. Puede volver a editar. |
| `sent` | Pantalla de confirmación. La carta "está en camino". Hay un botón para escribir otra. |

El botón "Enviar al futuro" llama a `sendLetter(letter, email)` (`POST /api/letters`). Si el backend está caído, el catch silencia el error y la UI avanza al paso `sent` igualmente.

---

### `/botella` — Mensaje en una botella

**Fichero:** `BottleMessagePage.tsx`

Tres estados visuales:

| Estado | Descripción |
|---|---|
| `write` | Textarea (máx. 400 caracteres) + botón "Lanzar al mar". También hay un botón "Recoger una botella del mar". |
| `sent` | Confirmación de que el mensaje salió. Botones para lanzar otra o recoger una. |
| `received` | Muestra un mensaje recibido del backend (o de `MOCK_BOTTLE_STORIES` si el back falla). |

Además, en el fondo hay tres "botellas decorativas" (imagen `/bottle.png`) que al clicarse abren un popup con una historia de `MOCK_BOTTLE_STORIES`. El fondo tiene dos olas SVG animadas.

> Las llamadas reales son `sendBottle(text)` y `receiveBottle()` (en `services/bottles.ts`). En el catch se hace fallback al texto "No hay botellas disponibles".

---

### `/mapa` — Mapa de historias

**Fichero:** `MapPage.tsx`

Mapa mundial interactivo con Leaflet. Las historias vienen de `useMapStories()` (8 historias mock por defecto, marcadores como divIcon con fondo lavanda).

**Flujo para añadir una historia:**
1. Clic en el botón flotante "+ Añadir mi historia" → activa el modo de selección (cursor cambia a crosshair).
2. Un banner arriba indica "Haz clic en el mapa para anclar tu historia".
3. Clic en cualquier punto del mapa → aparece un marcador temporal y un panel de escritura.
4. El usuario escribe su historia (máx. 300 caracteres, mín. 10) y pulsa "Anclar historia".
5. Se hace optimistic update (la historia aparece como local) y se llama a `createStory(...)`. Si el back responde, sustituye el local por el remoto. Si falla, se mantiene el local. Toast "¡Tu historia ya está en el mapa!" durante 2 segundos.

> **Nota Leaflet + Vite:** Leaflet no encuentra sus imágenes de marcadores cuando pasa por un bundler. Al inicio del fichero hay código que sobreescribe los paths manualmente apuntando a los ficheros de `unpkg.com`.

---

### `/moderacion` — Panel de moderación

**Fichero:** `ModerationPage.tsx`

**Aún sin route guard** — la ruta es accesible para cualquier usuario. Implementar `<RequireRole>` está en el roadmap. Tiene tres secciones:

**Reportes:**
- Header con número de reportes pendientes.
- Tabs de filtro: Todos / Pendientes / Resueltos / Descartados.
- Lista de reportes (vienen de `useModerationReports()`). Clic en uno lo expande y muestra 3 botones de acción:
  - Resolver — eliminar mensaje (llama a `updateReport(id, 'resolved')`).
  - Avisar al usuario.
  - Descartar reporte (llama a `updateReport(id, 'dismissed')`).

Cada acción es optimistic: se actualiza el estado local primero; si el backend responde error, se revierte al estado anterior.

**Miembros:**
- Tabla de miembros leída de `MOCK_MOD_MEMBERS` con username, comunidad, fecha de ingreso y reportes recibidos.
- Botones "Avisar" y "Banear" sin onClick por ahora.

**Filtro automático:**
- CRUD de palabras prohibidas (no estadísticas). Lista inicial `INITIAL_BANNED_WORDS = ['puta','idiota','imbécil','tonto']` mantenida en estado local — sin persistencia ni backend.
- Cada palabra muestra la vista previa de la censura (ej. `puta` → `p***`) mediante el helper `maskWord(word)`.
- Operaciones: añadir, editar (Enter para guardar, Escape para cancelar), eliminar. Validación: sin duplicados.
- TODOs con los endpoints futuros (`GET/POST/PATCH/DELETE /api/moderation/banned-words`) marcados en el componente.

---

## Sistema de estilos

### Variables globales (`src/styles/variables.css`)

Todos los colores, sombras y tamaños están definidos como variables CSS en `:root`. Nunca se usan valores hexadecimales directamente en los módulos de página.

```css
/* Colores principales */
--primary:     #8A7DC4   /* lavanda — botones, acentos */
--primary-dk:  #6B5BAA   /* hover */
--primary-lt:  #E8E4F6   /* fondos suaves */
--peach:       #F5A882   /* acento cálido */
--green:       #7BC67E   /* estado online, positivo */

/* Texto */
--dark:  #2A2560   /* texto principal */
--mid:   #696283   /* texto secundario */
--lite:  #9E99B5   /* placeholders */

/* Sombras (siempre tonos lavanda, nunca negro puro) */
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl
```

### Animaciones (`src/styles/animations.css`)

Clases de animación listas para usar en cualquier elemento:

| Clase | Efecto |
|---|---|
| `animate-fadeInUp` | Aparece subiendo desde abajo |
| `animate-fadeIn` | Aparece con fade |
| `animate-scaleIn` | Aparece creciendo |
| `hover-lift` | Sube ligeramente al pasar el ratón |
| `blob` + `blob-float` / `blob-float-slow` | Burbuja decorativa flotante |
| `delay-1` … `delay-6` | Retrasa la animación (útil para grids con efecto escalonado) |

Ejemplo de uso:
```tsx
<div className="animate-fadeInUp delay-2 hover-lift">...</div>
```

### CSS Modules

Cada página tiene su propio fichero `.module.css`. Los nombres de clase son locales — `.card` en `EventListPage.module.css` no choca con `.card` en `CommunityListPage.module.css`.

```tsx
import styles from './MiPagina.module.css'

<div className={styles.card}>...</div>
```

### Mobile-first

Siempre se diseña para móvil primero y se amplía con `min-width`. Los breakpoints son: **576 / 768 / 992 / 1200 px**.

```css
/* Móvil (base) */
.grid { grid-template-columns: 1fr; }

/* Tablet y mayor */
@media (min-width: 768px) {
  .grid { grid-template-columns: 1fr 1fr; }
}
```

### Convenciones de nombres de clase

Las clases que representan variantes siguen el patrón `tipo_valor`:

```css
.status_pending  { ... }
.type_taller     { ... }
.stat_orange     { ... }
.pill_resolved   { ... }
```

### Iconos: SVG inline, no emojis

Los emojis pictográficos (`🔒 🛡️ ❤️ 📅` etc.) están prohibidos en la UI por regla del proyecto. En su lugar, usar SVG inline definidos en `src/components/ui/Icons.tsx`. Todos los iconos:

- Heredan el color del padre vía `stroke="currentColor"`.
- Reciben `size` (px) y `className` opcionales.
- Llevan `aria-hidden="true"` (son decorativos).

Lista actual: `IconSearch`, `IconEye`, `IconEyeOff`, `IconShield`, `IconHand`, `IconLock`, `IconQuestion`, `IconCalendar`, `IconClock`, `IconUser`, `IconUsers`, `IconChat`, `IconMap`, `IconBottle`, `IconHeart` (con prop `filled`), `IconDot` (con prop `color`).

```tsx
import { IconHeart, IconDot } from '../components/ui/Icons'

<IconHeart filled={liked} size={18} />
<IconDot color="var(--green)" size={8} />
```

Si necesitas un icono nuevo, copia el patrón del wrapper `Svg` interno de `Icons.tsx`. **Excepción**: si el emoji viene como dato del backend (campo `emoji` de una entidad), se renderiza como texto tal cual — la regla solo prohíbe emojis hard-coded en componentes.

Los **símbolos tipográficos Unicode monocromos** sí se permiten como texto (`✓ ✕ ✎ ➤ ☰ ★`) — son glyphs, no emojis pictográficos a color.

---

## Componentes compartidos

### `<Navbar />`

**Fichero:** `src/components/layout/Navbar.tsx`

Siempre visible. Contiene:

- **Logo** "S / ShareYourStory" — enlace a `/`.
- **Links de navegación** (ocultos en móvil) — definidos en el array `NAV_LINKS`.
- **UsernameChip** — muestra el username del usuario. Al hacer clic se convierte en un `<input>` para editar el username. Guardar con Enter o clic fuera; cancelar con Escape.
- **Botón "Entrar"** — navega a `/login`.
- **Hamburguesa** — abre el menú móvil.

El componente `UsernameChip` está definido dentro del mismo fichero como función interna.

### `<Footer />`

**Fichero:** `src/components/layout/Footer.tsx`

Pie de página minimalista con logo, enlace a "Cómo conseguir ayuda profesional" y nota de privacidad (icono `IconLock`).

### `<Select<T> />`

**Fichero:** `src/components/ui/Select.tsx`

Dropdown custom genérico tipado por `T extends string`. Reemplaza `<select>` nativos cuando se quiere control visual completo. Soporta:

- Panel flotante redondeado con hover lavanda.
- Navegación con teclado (Arriba/Abajo/Enter/Escape).
- Cierre al clicar fuera (mousedown listener).
- Placeholder opcional como "ningún valor".
- `ariaLabel` y `id` para accesibilidad.

Uso: `<Select<Profession> value={profesion} onChange={setProfesion} options={PROFESSION_OPTIONS} ariaLabel="Profesión" />` (ver `ModRegisterPage` como ejemplo).

### `<PageState />`

**Fichero:** `src/components/ui/PageState.tsx`

Renderiza estados `loading` / `error` / `empty` de forma unificada. Acepta `loading`, `error`, `empty`, `emptyMessage`, `onRetry`. Devuelve `null` si nada aplica, así que se puede inlinear sin condicionales.

> **Nota:** hoy usa clases de Bootstrap (`d-flex`, `text-center`, `py-5`) y `<Spinner>` de `react-bootstrap`. Eso contradice la convención "Bootstrap solo SCSS, no clases" — reemplazo pendiente.

---

## Cómo añadir una página nueva

1. **Crear el fichero de la página** en `src/pages/`:

```tsx
// src/pages/MiPagina.tsx
import styles from './MiPagina.module.css'

export function MiPagina() {
  return (
    <div className={styles.page}>
      <h1>Mi nueva página</h1>
    </div>
  )
}
```

2. **Crear el fichero de estilos** al lado:

```css
/* src/pages/MiPagina.module.css */
.page {
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
}
```

3. **Registrar la ruta** en `src/App.tsx`:

```tsx
import { MiPagina } from './pages/MiPagina'

// Dentro de <Routes>:
<Route path="/mi-ruta" element={<MiPagina />} />
```

4. Si es accesible desde la barra de navegación, añadir la entrada al array `NAV_LINKS` en `Navbar.tsx`:

```tsx
{ to: '/mi-ruta', label: 'Mi ruta' }
```

---

## Estado del proyecto

### Lo que funciona

- Las 19 pantallas se renderizan correctamente.
- La autenticación anónima funciona: intenta `POST /api/auth/anonymous` y cae al mock si el back está caído.
- Login, registro, logout, updateUsername — todos llaman al backend real con fallback selectivo (solo en network errors).
- Login de moderador (`/loginmod`) y registro (`/modregister`) llaman al backend real. Sin fallback (requieren back).
- Los 6 hooks de datos (`useCommunities`, `useEvents`, `useProfessionals`, `useProfile`, `useMapStories`, `useModerationReports`) intentan el endpoint real con fallback al mock centralizado.
- `useCommunityChat` con optimistic update y rollback en errores de servidor.
- Mocks unificados en `src/mocks/data.ts` — no hay datos hardcoded en componentes.
- El mapa de Leaflet carga y permite añadir historias (con optimistic update).
- Toda la app es responsive (móvil y escritorio).
- Iconos pictográficos como SVG en `components/ui/Icons.tsx`. Cero emojis hard-coded en la UI.

### Lo que está pendiente

**Necesita backend:**

| Endpoint | Cómo lo usa el front |
|---|---|
| `POST /api/auth/anonymous`, `/login`, `/register`, `/login/mod` | `AuthContext` ya los llama con fallback al mock |
| `PATCH /api/users/me/username` | `updateUsername` ya lo llama (best-effort) |
| `GET /api/communities`, `POST /api/communities/:id/join`, mensajes | `useCommunities`, `useCommunityChat` ya los llaman |
| `GET /api/events`, `POST /api/events`, `POST /api/events/:id/join` | `useEvents`, `EventCreatePage` ya los llaman |
| `GET /api/stories`, `POST /api/stories` | `useMapStories`, `MapPage` ya los llaman |
| `POST /api/bottles`, `GET /api/bottles/received` | `BottleMessagePage` ya los llama |
| `POST /api/letters` | `TimeMachinePage` ya los llama |
| `GET /api/professionals` | `useProfessionals` ya lo llama |
| `GET /api/reports`, `PATCH /api/reports/:id` | `useModerationReports`, `ModerationPage` ya los llaman |
| `GET/PATCH /api/users/me/{profile,settings,mod-profile,password}` | `SettingsPage`, `useProfile` ya los llaman |
| `GET/POST/PATCH/DELETE /api/moderation/banned-words` | `ModerationPage` filtro automático — pendiente conectar (hoy estado local) |

**Pendiente frontend (sin depender de backend):**

- Route guards: `<RequireRole>` para `/moderacion`, `/modregister`, `/eventos/nuevo`.
- Ruta catch-all `*` con página `NotFound`.
- Implementar `PrivateChatPage` (`/chat/:professionalId`) o deshabilitar el botón "Contactar" hasta que esté. Recordatorio: este chat es 1 a 1 con profesional, no entre anónimos.
- Eliminar o etiquetar como "no implementado" features que aún no hacen nada: selector de Idioma, "Modo oscuro próximamente", Modo compacto, Mood selector sin persistencia.
- En `SettingsPage > Perfil profesional`, ocultar el input `company` para `ADMIN`.
- Romper god components: `SettingsPage` (8 secciones), `ModerationPage` (3 secciones), `EventDetailPage` (formulario embebido).
- Lazy loading por ruta (especialmente `/mapa` por Leaflet).
- `@fontsource/inter` en lugar de Google Fonts CDN.
- Reemplazar el `<Spinner>` de `react-bootstrap` en `PageState` por uno propio y quitar `react-bootstrap` de dependencias.
- Decidir política de token storage (`localStorage` vs `sessionStorage` vs httpOnly cookie).

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_BACKEND_URL` | URL base del backend | `http://localhost:8080` |
| `PORT` | Puerto del servidor de desarrollo | `5173` |

En el devcontainer, `VITE_BACKEND_URL` se establece automáticamente a `http://java-app:8080`. Falta crear un `.env.example` con estos valores documentados para nuevos colaboradores.
