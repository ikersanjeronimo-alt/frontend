# CLAUDE.md — Contexto del proyecto ShareYourStory-PBL

> Este fichero **sí está versionado** en el repo del frontend (no está en `.gitignore`, contra lo que decía esta nota antes). Es el contexto persistente para Claude entre conversaciones. No apuntes secretos aquí.

---

## Reglas para Claude (importante leer antes de cada prompt)

- **Idioma:** El usuario escribe en castellano. Responde siempre en castellano salvo que pida lo contrario.
- **Diseño de UI — reglas estrictas:**
  - **Diseños simples y efectivos.** No añadir secciones, animaciones, bloques decorativos ni elementos visuales solo por rellenar. Cada cosa en pantalla debe tener una razón funcional.
  - **Prohibido usar emojis en la UI.** Ni en botones, etiquetas, títulos, iconos decorativos ni en ningún texto fijo del código. La única excepción son los emojis de símbolo tipográfico (la X el simbolo del nav comprimido...).
  - Si necesitas un icono, usa texto, símbolo tipográfico o SVG — nunca emoji.
- **Preguntas:** Al usuario **le gusta que le hagas preguntas**. Si hay ambigüedad sobre alcance, diseño, naming, o cualquier decisión relevante, **pregunta antes de implementar** en vez de asumir. Mejor pecar de preguntar de más que entregar algo que no es lo que esperaba.
- **Al terminar una tarea, SIEMPRE:**
  1. Explicar al usuario qué se cambió (resumen claro por ficheros/áreas, sin pegar el diff entero).
  2. Pasar los **comandos de commit** listos para copiar/pegar (uno o varios, agrupando lógicamente). **Formato simple, en dos líneas**: un `git add <ficheros>` con los paths explícitos + un `git commit -m "<prefijo>: <descripción corta en castellano>"` de una sola línea. **Nada de HEREDOC ni cuerpos multilínea** — todo el contexto va en el resumen previo, no en el mensaje de commit. Prefijos del repo: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`. Ejemplos válidos: `style: añadir SVGs a las acciones rápidas del dashboard`, `refactor: cambiar de nick a username`, `feat: añadir inicio de sesion de moderadores`. Ejemplo de formato:
     ```
     git add frontend/src/components/ui/Icons.tsx frontend/src/pages/DashboardPage.tsx
     git commit -m "style: añadir SVGs a las acciones rápidas del dashboard"
     ```
     **No hacer commit automáticamente** — solo proporcionar los comandos para que el usuario los ejecute.
- **Mantener este fichero vivo:** Cada vez que hagas un **cambio relevante** en el código (nueva pantalla, nuevo endpoint, refactor importante, cambio de stack, etc.) o el usuario te diga algo **importante** (preferencia, decisión de diseño, contexto del proyecto, regla de trabajo) → **actualiza este `CLAUDE.md`** para que la siguiente conversación lo refleje. No esperes a que te lo pidan.
- **No subir secretos:** El fichero está en `.gitignore`, pero igualmente: no apuntes contraseñas reales, tokens, ni datos personales aquí.
- **Si dudas sobre si algo merece estar aquí:** pregunta al usuario.

---

## Resumen del proyecto

**ShareYourStory** es una app web de apoyo emocional para jóvenes. Permite:
- Comunidades de chat moderadas por profesionales de salud mental (chat grupal).
- Chat 1 a 1 con profesionales (psicólogos / terapeutas / psiquiatras). **No hay chats privados entre usuarios anónimos**: los anónimos solo hablan en comunidades (grupal moderado) o vía botella al mar (anónimo one-shot).
- Eventos terapéuticos (talleres, sesiones grupales, charlas).
- Mensajes anónimos (botella al mar).
- Cartas al yo futuro (máquina del tiempo).
- Mapa mundial de historias (Leaflet).
- Panel de moderación.

Es un **PBL** (Project-Based Learning), por eso el alcance está más cerca de "demo funcional" que de producto en producción.

**Estado actual (2026-06-03, tras el realineamiento front↔back):**
- Frontend: 21 pantallas integradas contra el backend real (sin mocks; los mocks se eliminaron). Rama de tiempo real fusionada (stores zustand + servicios `*WS.ts`).
- Backend: **funcional, no "verde"**. 47 endpoints repartidos en 11 controladores (auth+2FA, comunidades + membresía real, chat privado, eventos, historias, botellas, máquina del tiempo, profesionales, moderación, `users/me/*`), JWT real, WebSocket STOMP autenticado, rate limiting con bucket4j y `@RestControllerAdvice` global. **Solo compila / no se ha probado en ejecución end-to-end** (ver "Pendientes / Roadmap").
- **Son DOS repos git independientes**: `ShareYourStory-PBL-backend/` y `ShareYourStory-PBL-frontend/`, cada uno con su `.git`.

---

## Stack

### Backend (repo `ShareYourStory-PBL-backend/`)
- **Java 21** + **Spring Boot 4.1.0-SNAPSHOT** (snapshot, ojo con esto — build no reproducible, ver Roadmap).
- Módulos: `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-security`, **`spring-boot-starter-websocket`** (STOMP), **`spring-boot-starter-mail`** (máquina del tiempo). **`oauth2-authorization-server` y `lombok` se quitaron del `pom.xml`** (sin uso).
- **`com.warrenstrange:googleauth`** (TOTP) + **`com.bucket4j:bucket4j-core`** (rate limiting).
- **MySQL** (driver `mysql-connector-j`) — `ddl-auto=update`, base de datos `shareYourStory` en `mysql:3306`.
- Maven wrapper (`mvnw` / `mvnw.cmd`).
- **Sin Lombok** → getters/setters a mano.
- Paquete raíz: `shareyourstory` (clase main: `ShareYourStoryApplication`).
- **SMTP por variables de entorno** (`MAIL_HOST/MAIL_PORT/MAIL_USERNAME/MAIL_PASSWORD`, `application.properties:24-30`) — ya **no** hardcodeado. Ver Roadmap (revocar App Password comprometida que sigue en el historial git).

### Frontend (`frontend/`)
- **React 19** + **TypeScript 6** + **Vite 8**.
- **React Router 7** para rutas (con `React.lazy` + `Suspense` en `/mapa` y `/moderacion`).
- **CSS Modules** por página + variables globales en `src/styles/variables.css`.
- **Leaflet / react-leaflet 5** para el mapa (iconos bundled localmente, no unpkg).
- **i18next + react-i18next** para i18n (Español / English / Euskera).
- **Estado global con zustand ^5** (`src/store/`: `communitiesStore`, `communityChatStore`, `eventsStore`, `privateChatStore`, `storiesStore`) para los datos que llegan en tiempo real por WebSocket. Además `AuthContext` + stores singleton vía `useSyncExternalStore` para datos compartidos no-WS (palabras prohibidas, eventos likeados).
- **Tiempo real con STOMP** sobre `lib/wsClient.ts` + servicios `src/services/*WS.ts` (`communitiesWS`, `communityChatWS`, `eventsWS`, `privChatWS`, `storiesWS`). La bandeja del profesional usa `usePrivateInbox`. **STOMP sobre WebSocket NATIVO (sin SockJS)**: el backend ya no usa `.withSockJS()`, así que el cliente abre un `new WebSocket(wss://.../ws)` directo (no reañadir SockJS en un lado sin el otro). **`initWS()` NO se llama en `main.tsx`** (allí solo se registran callbacks con `init*WS()`); la conexión la arranca `AuthContext` vía `syncWSAuth()` en cuanto hay token, para que el primer CONNECT lleve el JWT (si no, el backend lo rechaza y sale un error STOMP en la 1ª carga). No reintroducir `initWS()` en el arranque.
- Sin React Query/SWR — helper `useApi(fetcher, initialData, deps)` + `optimisticMutation` para mutaciones puntuales (lecturas/escrituras no-WS).
- **Sin Bootstrap** (Sprint 2: tirado `react-bootstrap`, `bootstrap`, `sass`; `PageState` reescrito con spinner CSS propio).

### Infra
- **Devcontainer** con `compose.yml` (`.devcontainer/compose.yml`): servicios `java-app`, `frontend` y `mysql`.
- Frontend dev: `http://localhost:5173`. Backend: `http://localhost:8080`. MySQL: `3306`.
- Proxy de Vite: `/api/*` → `VITE_BACKEND_URL` (por defecto `http://localhost:8080`).

---

## Estructura del repo

**Dos repos git independientes** bajo un directorio de trabajo común (`C:\Repos\workspace`):

```
workspace/
├── .devcontainer/                 # compose.yml, devcontainer.json (orquesta los dos)
├── ERS-ShareYourStory.md          # Especificación de requisitos (F1–F6)
├── ShareYourStory-Diseno.docx     # Gemelo de la ERS (regenerable con gen-docx.js)
├── gen-docx.js                    # Generador del .docx
├── AUDITORIA.md / PROMPT-AUDITORIA.md
│
├── ShareYourStory-PBL-backend/    # repo git propio
│   ├── src/main/java/shareyourstory/
│   │   ├── ShareYourStoryApplication.java
│   │   ├── auth/                  # AuthController, AuthService, JWT, SecurityConfig,
│   │   │                          #   RateLimitFilter, RateLimitService, GoogleAuthService
│   │   ├── config/                # GlobalExceptionHandler (@RestControllerAdvice), WebMvcConfig
│   │   ├── websocket/             # WebSocketConfig, WebSocketService (STOMP)
│   │   └── domain/                # community, event, bottle (incl. chat privado), storyMap,
│   │                              #   timeMachine, moderation, user
│   ├── src/main/resources/application.properties
│   ├── db/                        # 01..07 modelo ER, SQL, procedimientos, triggers, replicación
│   ├── pom.xml
│   ├── README.md                  # (vacío — pendiente)
│   └── RATE_LIMITING.md           # (pendiente de consolidar)
│
└── ShareYourStory-PBL-frontend/   # repo git propio (este CLAUDE.md vive aquí)
    ├── src/                       # App React (ver readme-frontend.md para detalle)
    ├── readme-frontend.md
    ├── VALIDATION.md
    └── CLAUDE.md                  # este fichero
```

---

## Backend: estado actual

> ⚠️ **Esta sección se reescribió el 2026-06-03.** La versión anterior decía "backend muy verde, solo `register/mod` y `User`" y narraba un flujo 2FA hacia endpoints `/verify` que **nunca existieron**. Era falso. Lo de abajo está verificado contra el código real.

### Lo que existe (verificado)

**Auth (`auth/`)**
- **`SecurityConfig`** — CORS a `http://localhost:5173` con métodos incl. **`PATCH`**. `/api/users/me/**` y `/api/testJWT` requieren autenticación (`SecurityConfig.java:49`); el resto pasa por la cadena con `AuthTokenFilter` (JWT) que puebla el `SecurityContext` si hay `Bearer` válido. `BCryptPasswordEncoder` + `AuthenticationManager`.
- **`AuthController`** (rutas absolutas, sin `@RequestMapping` de clase):
  - `POST /api/auth/anonymous` → `AuthResponse{token,user}`. Reusa la fila ANON si llega un `anonToken` válido; si no, crea una nueva (`AuthService.java:57`).
  - `POST /api/auth/register` → **upgrade anónimo→usuario**: si llega un `anonToken` de un ANON, **promociona esa misma fila** a `USER` (conserva identidad/datos); si no, crea `USER` (`AuthService.java:78`).
  - `POST /api/auth/login` → username+password; **bloquea staff** (deben usar loginmod).
  - `POST /api/auth/register/mod` → crea PROFESSIONAL/ADMINISTRATOR. **Exige que el llamante sea ya `ADMINISTRATOR`** (403 si no, `AuthController.java:72`).
  - `POST /api/auth/register/admin/bootstrap` → crea el **primer** ADMINISTRATOR (201) con 2FA activado; **409 si ya existe alguno** (`AuthController.java:80`).
  - **2FA mod (contrato REAL, NO hay `/verify`)**: `GET /api/auth/register/mod/2fa/qr?email=` → URI otpauth para el QR. `POST /api/auth/register/mod/2fa/qr {email,code}` → valida el primer código y marca **`twoFactorEnabled=true`** (`AuthService.enableQR`). `POST /api/auth/login/mod {email,password}` → `LoginModChallengeResponse{challengeId,requires2fa}` (UUID con TTL 5 min en memoria). `POST /api/auth/login/mod/2fa/code {challengeId,code}` → `{token}` (consume challenge + valida TOTP).
  - `GET /api/users/me` → restaura sesión al recargar (`AuthUserResponse{id,username,role}`); `PATCH /api/users/me/username`.
- **`GlobalExceptionHandler`** (`config/`, `@RestControllerAdvice`): `BadCredentials/Authentication → 401`, `DataIntegrityViolation → 409`, `UsernameNotFound/NoSuchElement → 404`, `MethodArgumentNotValid → 400`. **Deliberadamente sin catch-all** para no pisar los status de Spring.
- **`JWTService`** — HS256, subject = username; `AuthTokenFilter` captura firma inválida.
- **`GoogleAuthService`** — lib `com.warrenstrange:googleauth` (genera secreto, valida TOTP, construye QR).
- **Rate limiting** (`RateLimitFilter` + `RateLimitService`, bucket4j en memoria, por **IP** y además por **token** si hay `Bearer`; 429 JSON). Reglas (POST): `2fa` 5/min, `login` 10/min, `refresh` 20/min, `register` 20/min, **`anonymous` 60/min** (la app lo llama sola en cada carga sin token; un límite bajo provocaba 429 al recargar), `mail` (timeMachine) 5/min, `content` (bottles, stories y cualquier `…/messages`) 30/min.

**Modelo de usuario (`domain/user/`)**
- **`UserRole`** enum: **`ANON | USER | PROFESSIONAL | ADMINISTRATOR`** (el front mapea `PROFESSIONAL→MODERATOR`, `ADMINISTRATOR→ADMIN` en `services/auth.ts`).
- **`User`** (tabla `users`): `userId(Integer)`, `name`, `lastName`, `userName`(único), `nickName`(único, default=userName), `userPassword`, `companyName`, `mail`(único), `creationDate`, `profession`/`specialization` (**String, sí se persisten**), `professionRef`/`specializationRef` (**FK a entidades `Profession`/`Specialization` — muertas, ver Roadmap**), `role` (default ANON), `secretKey`, **`twoFactorEnabled`**, `topics`(CSV), **`warnings`**, **`banned`**. `getAuthorities()` devuelve `ROLE_<role>`.

**Dominios**
- **`community`** — membresía real (`community_members`), DTOs (`id` String, mensaje con `time`/`own`, `modUserId`, `chatClosed`, `pinnedNote`, `unread`), endpoints `join/leave` (devuelven la comunidad), `pinned-note`, `chat-closed`, `members/active`, `kick`, borrar mensaje; autorización MOD/ADMIN. **Presencia ("online") derivada de sesiones STOMP vivas** (`CommunityPresenceService` + `WebSocketPresenceListener`), no de un contador persistido.
- **`bottle`** — alberga `Bottle` (botella al mar: `authorId`/`received`/`createdAt`) **y el chat privado** (`PrivateMessageController` en `/api/chats`, identidad por JWT sin `userId` del cliente, + bandeja `/inbox`).
- **`event`** — `interest` (POST/DELETE devuelven el evento), `GET /{id}`; "Me interesa" = contador global.
- **`storyMap`** — mapa de historias (`GET/POST /api/stories`).
- **`timeMachine`** — la **fecha la elige el usuario** (`POST /api/timeMachine {message,email,deliveryDate}`, 201/400); scheduler entrega por `deliveryDate <= hoy` y borra tras enviar.
- **`moderation`** — reportes de **historias, mensajes de comunidad y mensajes privados** (`ReportTargetType`); `resolve {action: resolve|warn|dismiss}` ("Avisar" es acción distinta); miembros reales (`/members`, `warn`/`ban`). Procedimientos almacenados `sp_resolve_report`, `fn_count_pending_reports` y trigger `trg_reports_audit` **se siguen usando** sin cambios.
- **`users/me/*`** — `profile` (stats calculables + `topics`), `mod-profile` (GET/PATCH), `password`, `onboarding`, `dashboard/messages`. ⚠️ `settings` y `mood` se **aceptan pero no persisten** (sin consumidor); `ApiProfile.activity` se entrega **vacío** (no hay modelo de actividad).

**WebSocket (`websocket/`)** — STOMP, broker simple `/topic`. Difusión por `/topic/storyMap`, `/topic/events`, `/topic/communities`, `/topic/communities/{id}` y **mensajes privados por cola de usuario `/user/queue/private`** (`convertAndSendToUser`). CONNECT autenticado por JWT. ⚠️ El comentario de `WebSocketConfig.java:42-43` aún describe el modelo viejo `/topic/privateChats/{id}` "a migrar", pero `WebSocketService.java:33` **ya usa** `/queue/private` (comentario obsoleto, ver Roadmap).

### Inventario real de endpoints (47) ✕ consumo del frontend

> Cruzado entre `@*Mapping` del backend y `apiFetch` de `src/services/*.ts` el 2026-06-03. **Casi todo está implementado.** Los únicos huecos son 2 desajustes, marcados ⚠️.

| Servicio front | Endpoint(s) backend | Estado |
|---|---|---|
| `auth.ts` | `POST /api/auth/anonymous`, `/login`, `/register` | ✅ |
| `auth.ts` | `POST /api/auth/register/mod`, `GET+POST /register/mod/2fa/qr`, `POST /login/mod`, `POST /login/mod/2fa/code` | ✅ (2FA real por `/2fa/qr` + `/2fa/code`) |
| `auth.ts` | `GET /api/users/me`, `PATCH /api/users/me/username` | ✅ |
| `profile.ts` | `GET /profile`, `GET+PATCH /mod-profile`, `PATCH /password`, `POST /onboarding`, `PATCH /settings`, `POST /mood` | ✅ (`settings`/`mood` no persisten) |
| `dashboard.ts` | `GET /api/users/me/dashboard/messages` | ✅ |
| `communities.ts` | `GET+POST /api/communities`, `POST+DELETE /:id/join`, `GET+POST /:id/messages`, `DELETE /:id/messages/:msgId`, `GET /:id/members/active`, `DELETE /:id/members/:userId`, `PATCH /:id/pinned-note`, `PATCH /:id/chat-closed` | ✅ |
| presencia (WS) | suscripción a `/topic/communities/{id}/presence` | ✅ (reemplaza al viejo `POST /:id/online`, ver 2026-06-04 abajo) |
| `chats.ts` | `GET+POST /api/chats/:id/messages`, `GET /inbox`, `GET+POST /inbox/:userId/messages` | ✅ |
| `events.ts` | `GET /api/events`, `GET /:id`, `POST /api/events`, `POST+DELETE /:id/interest` | ✅ |
| `bottles.ts` | `POST /api/bottles`, `GET /received`, `GET /floating` | ✅ |
| `stories.ts` | `GET+POST /api/stories` | ✅ |
| `letters.ts` | `POST /api/timeMachine` | ✅ |
| `professionals.ts` | `GET /api/professionals` | ✅ |
| `moderation.ts` | `GET+POST /reports`, `POST /reports/:id/resolve`, `GET /members`, `POST /members/:id/warn`, `POST /members/:id/ban` | ✅ |
| `types/api.ts` | `VerifyTotpPayload`/`VerifyLoginPayload` + comentarios hacia `/verify` | ⚠️ **Tipos/comentarios muertos**: el back nunca tuvo `/verify`. Pendiente de código (es `.ts`). |

**Backend implementado pero SIN consumidor en el front** (existe, nadie lo llama desde `services/`): `GET /api/testJWT`, `PUT+DELETE /api/communities/:id`, `PUT+DELETE /api/events/:id`, `GET /api/moderation/reports/pending`, `GET /api/moderation/reports/:id/audit`, `GET /api/moderation/stats`, `POST /api/auth/register/admin/bootstrap` (se invoca desde la página de bootstrap, no desde un service). Nota: `POST /api/communities` y `POST /api/events` ya tienen consumidor — `createCommunity` en `communities.ts` y `createEvent` en `events.ts` (añadido 2026-06-04).

---

## Frontend: claves de alto nivel

> Ver `readme-frontend.md` para el detalle exhaustivo de cada pantalla.

### Autenticación
- `AuthContext` (`frontend/src/context/AuthContext.tsx`) es el núcleo.
- Idea: **todo visitante recibe identidad anónima** desde el primer segundo vía `POST /api/auth/anonymous`. El JWT se guarda en `localStorage` con clave `sys_token`. Si el back no responde (network error), hay **fallback mock local** (`createMockAnonUser`).
- **Arranque resiliente del anónimo:** el bootstrap usa `authService.initAnonymousWithRetry()` (reintenta con backoff ante red caída / 429 / hipo del backend). Antes era una sola llamada y cualquier fallo dejaba `user=null` hasta recargar a mano ("a veces no carga el anónimo a la primera"). Además, la re-anonimización por expiración **no pisa con `null`** un usuario que ya estaba bien (solo el `logout` explícito limpia en caso de fallo).
- **Política de fallback (decidida en auditoría):** `try { real() } catch { mock() }` solo si el error es de red (status 0). Errores de servidor (401, 422, 500) se propagan a la UI para que el usuario los vea. Cuando el back funcione, el fallback deja de dispararse sin tocar código.
- Roles en el front: `'ANON' | 'USER' | 'MODERATOR' | 'ADMIN'`. El back trabaja con `'PROFESSIONAL' | 'ADMINISTRATOR' | 'USER' | 'ANON'`. La **traducción vive en `services/auth.ts`** (helper `mapBackendRole`): `PROFESSIONAL → MODERATOR`, `ADMINISTRATOR → ADMIN`. Tipos `BackendUser`/`BackendAuthResponse` son privados de esa capa; el resto de la app solo conoce `UserRole`.
- Hook `useAuth()` expone: `user`, `isLoading`, `login`, `register`, `logout`, `updateUsername`, `loginAsMod`, `verifyLoginAsMod`. **Para checks de rol usa `useRole()`** (`hooks/useRole.ts` → `{ user, isMod, isAdmin, isAnon, isLoggedIn }`), no rehagas el check inline.
- **Antes existía** una asignación de rol por prefijo de username (`startsWith('admin') → ADMIN`) que abría privilege escalation. Eliminada en la Tarea 2 de la auditoría — no reintroducir.
- 401 fuera del flujo de auth (`/api/auth/*`) dispara `authBus.fireExpired(expiredToken)` (`lib/authBus.ts`, singleton con buffer) que el `AuthProvider` escucha. El buffer hace que si el 401 llega antes de que el provider monte, el listener lo recibe en cuanto se subscribe. **No usar `window.dispatchEvent`** para esto: el bus es resistente a race conditions del orden de mount.
- **Expiración de sesión (sesión caducada):** en el 401, `apiFetch` conserva el token recién caducado y lo pasa por el bus. Si el token era de un **usuario logueado** (rol del claim ≠ `ANON`), el `AuthProvider` abre `SessionExpiredModal` (`components/auth/`) con dos opciones: **Salir** (→ logout/anónimo) o **Seguir conectado** (→ `authService.refreshSession` → `POST /api/auth/refresh`, que reemite token dentro de una **ventana de gracia** del back). Si el token era **anónimo** (o ilegible), se re-anonimiza en silencio como antes. Un `expiredRef` evita reabrir el modal con 401 concurrentes. Cadenas en i18n namespace `session`.

### Naming convention reciente
- **Reciente refactor (commit `614f997`): se renombró `nick` → `username`** en todo el frontend. Si ves restos de `nick`, son legacy → cambiar.

### Rutas (`frontend/src/App.tsx`)
`/`, `/onboarding`, `/login`, `/dashboard`, `/perfil`, `/configuracion`, `/profesionales`, `/chat/:professionalId`, `/comunidades`, `/comunidades/:comunidadId`, `/eventos`, `/eventos/:eventId`, `/maquina-del-tiempo`, `/botella`, `/mapa`, `/moderacion`, `/loginmod`, `/modregister`.

### Convenciones de código en el front
- Una página = un `.tsx` + un `.module.css` al lado en `src/pages/`. Sin subcarpetas por página (decisión deliberada hasta que crezca).
- Sub-componentes de una page van en `src/components/<area>/` (settings/, moderation/, events/, chat/, auth/, layout/, ui/) **con su propio `.module.css`** al lado. **Prohibido importar el CSS de la page padre** desde un sub-componente — acoplamiento invertido eliminado en B1.
- Hooks de datos en `src/hooks/use*.ts`. **Todos usan `useApi(fetcher, initialData, mockFallback?, deps?)`** de `hooks/useApi.ts`: llama al backend, devuelve `data: T` desde el primer render (con `initialData` vacío durante `loading`), y solo si hay error de red Y `ALLOW_MOCK_FALLBACK` carga el `mockFallback` via **dynamic import** (`() => import('../mocks/data').then(m => m.MOCK_X)`). Esto saca `mocks/data.ts` del bundle de prod cuando la flag está off.
- Llamadas API en `src/services/*.ts`, todas pasan por `apiFetch` de `src/services/api.ts`. `apiFetch` mete `Authorization: Bearer <sys_token>` automáticamente, **timeout de 15s** y soporta `signal: AbortSignal` opcional, distingue network error (status 0, helper `isNetworkError`) de error de servidor, solo añade `Content-Type: application/json` si hay body (evita CORS preflight en GETs), y para 401 fuera de `/api/auth/*` dispara `authBus.fireExpired()`.
- **Acceso a localStorage centralizado en `src/services/storage.ts`** con sub-objetos tipados (`tokenStorage`, `themeStorage`, `langStorage`, `bannedWordsStorage`, `eventInterestsStorage`, `modAccountStorage`). Errores de quota/private mode silenciados de forma uniforme. **Prohibido `localStorage.*` directo** fuera de este módulo — usa o crea el wrapper correspondiente.
- **Mocks en `frontend/src/mocks/data.ts`** — única fuente de verdad. **Se importan SOLO via dynamic import** desde los hooks (`() => import('../mocks/data').then(m => m.MOCK_X)`). Para chats hay `buildMockMessages(communityId)` y `buildMockPrivateMessages(professionalId)` con plantillas rotando por id (cada comunidad/profesional muestra un hilo distinto). Prohibido meter datos hardcoded en componentes.
- Tipos compartidos del backend en `src/types/api.ts`. Los tipos del backend "crudos" (con `BackendRole`, etc.) viven solo en `services/auth.ts` y no salen de esa capa.
- Estilos: variables CSS globales (`--primary`, `--peach`, `--dark`, etc.), nunca hexadecimales sueltos.
- Mobile-first; breakpoints `576 / 768 / 992 / 1200`.
- Animaciones reutilizables en `src/styles/animations.css` (`animate-fadeInUp`, `hover-lift`, `blob blob-float`, `delay-1..6`).
- **Emojis pictográficos prohibidos en la UI** (regla estricta, decidida en auditoría). Reemplazar siempre por SVG en `components/ui/Icons.tsx` (`IconLock`, `IconHeart`, `IconCalendar`, `IconUsers`, etc., todos con `stroke="currentColor"`). Excepción: emojis que vienen como dato del backend (campo `emoji` de una entidad). **Símbolos tipográficos Unicode monocromos sí están permitidos**: `✓ ✕ ✎ ➤ ☰ ★ ½`.

### Pantallas con detalle conocido
- **Alcance del chat 1 a 1**: `PrivateChatPage` (`/chat/:professionalId`) es **solo entre un usuario y un profesional** (psicólogo / terapeuta / psiquiatra). **No se ofrecen chats privados entre usuarios anónimos**: los anónimos hablan en comunidades (grupal moderado) o vía `/botella` (anónimo one-shot). Se llega desde "Contactar" de `ProfessionalsPage`.
- `TimeMachinePage` y `BottleMessagePage` — UI completa. Errores de envío (network + flag) caen al banner demo y simulan éxito; errores de servidor se muestran al usuario.
- `ModerationPage` — protegida con `<RequireRole roles={['MODERATOR', 'ADMIN']}>` desde Sprint 1.
- `CommunityChatPage` — si el `:comunidadId` no existe en los mocks, muestra "Comunidad no encontrada" con CTA a `/comunidades`.
- `EventCreatePage` — **conectado al backend real** desde 2026-06-04. Llama a `POST /api/events` vía `createEvent` de `events.ts`. Mapeo de campos: `desc`→`description`, `date+time`→`date` (ISO combinado), `host`→`topic`, `duration`→`place` (único campo disponible en la entidad `Event`). El form embebido `EventFormSection` de `EventDetailPage` sigue sin backend (`POST /api/events/:id/form*` no existe).
- `CommunityCreatePage` (`/comunidades/nueva`, solo MOD/ADMIN) — **conectado al backend real** desde 2026-06-04. Llama a `POST /api/communities` vía `createCommunity` de `communities.ts`. La categoría se convierte a mayúsculas antes de enviar (el backend espera el nombre del enum `CommunityTypes`: `ANSIEDAD`, `DEPRESION`, etc.). Tras crear, navega al ID real de la comunidad.

---

## Variables de entorno

| Variable | Dónde | Valor por defecto | Notas |
|---|---|---|---|
| `VITE_BACKEND_URL` | `frontend/.env` | `http://localhost:8080` | URL del backend para el proxy de Vite |
| `VITE_USE_MOCK_FALLBACK` | `frontend/.env` | `true` (dev), `false` (prod) | Si `true`, los errores de red caen al mock y se activa el banner "Modo demostración". Cuando el back funcione, poner `false` para que los errores propaguen al UI |
| `PORT` | (opcional, frontend) | `5173` | Puerto del dev server |
| `DB_URL` | `application.properties` | `jdbc:mysql://mysql:3306/shareYourStory` | Apunta al servicio `mysql` del compose |
| `DB_USERNAME` | `application.properties` | `app_rw` | Usuario de **mínimo privilegio**, NO `root` (creado por `db/02`) |
| `DB_PASSWORD` | `application.properties` | `app_rw_pwd` | Solo dev |
| `JWT_SECRET` / `JWT_EXPIRATION` | `application.properties` | (clave dev) / `3600000` | Definir `JWT_SECRET` en producción |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | `application.properties` | (vacío) | App Password de Gmail por entorno (ver Roadmap) |

---

## Cómo arrancar

### Todo con devcontainer (recomendado)
- Abrir el repo en VS Code → "Reopen in Container" → arranca java-app, frontend, mysql.
- Frontend en `http://localhost:5173`, backend en `http://localhost:8080`.

### Solo backend (sin devcontainer)
```powershell
.\mvnw.cmd spring-boot:run
```
Necesita MySQL corriendo en `localhost:3306` con la BD `shareYourStory`. Si solo lanzas mysql desde el compose: `docker compose -f .devcontainer/compose.yml up mysql`.

### Solo frontend
```powershell
cd frontend
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc -b + vite build
npm run lint        # ESLint
npm test            # Vitest, run-once
npm run test:watch  # Vitest, modo watch
```

---

## Decisiones de diseño / convenciones aprendidas

- **EOL: LF en todo el repo.** `.gitattributes` impone `* text=auto eol=lf`. Esto es para que el devcontainer Linux no marque como modificados los ficheros que Windows tiene en CRLF. Si añades un fichero nuevo, no fuerces CRLF.
- **HMR en devcontainer:** Vite usa polling (`server.watch.usePolling: true`) porque inotify no cruza el bind mount Windows→Linux. Si el HMR vuelve a fallar, revisar `vite.config.ts`.
- **Cards cliqueables (HTML5 válido):** Las tarjetas que navegan a otra ruta NO usan `<button onClick={navigate}>`, porque HTML5 prohíbe `<div>`/`<h3>`/`<p>` dentro de `<button>`. Patrón actual:
  - Contenedor `<article className={styles.card}>` con `position: relative`.
  - Dentro, `<Link className={styles.cardLinkOverlay}>` vacío con `position: absolute; inset: 0` que captura el click sobre toda la card. Incluir `aria-label` descriptivo.
  - Si la card tiene un botón de acción interno (ej. "Unirse"), ese botón es un `<button>` independiente con `position: relative; z-index: 2`, y su handler hace `e.preventDefault(); e.stopPropagation()`.
  - Aplicado en `LandingPage`, `CommunityListPage`, `EventListPage`, `DashboardPage`. Si añades una nueva card cliqueable, sigue este mismo patrón.
- **`npm run preview` en devcontainer:** Vite preview está configurado con `preview.host: true` y `port: 4173` en `vite.config.ts`. El puerto `4173` está en `forwardPorts` de `.devcontainer/devcontainer.json`. Si VS Code no lo forwardea solo, abrir la pestaña "Ports" y hacer "Forward a Port" → 4173.
- **No usar Lombok** — está comentado en `pom.xml`. Getters/setters a mano.
- **El front asume contrato JSON con el back** definido en `src/types/api.ts`. Al implementar endpoints, **el back debe respetar esos tipos** (camelCase, mismos nombres de campo, etc.) o cambiarlos en ambos lados a la vez.
- **Login moderadores ≠ login usuarios**: dos endpoints distintos (`/api/auth/login` y `/api/auth/login/mod`). Mod usa email; usuario usa username.
- **Username anónimo** se genera en el front si el back no responde — formato `anonimo<4 dígitos>` actualmente.
- **Helper `useApi(fetcher, fallback)`** (`frontend/src/hooks/useApi.ts`) es el patrón canónico para data fetching en este proyecto. Todos los hooks `useX` lo usan (4 LOC cada uno). Si añades un hook nuevo de datos, sigue el mismo patrón en vez de reinventar `useState + useEffect`. El state vive en un único objeto (`data`/`loading`/`error`) para no caer en la regla `react-hooks/set-state-in-effect` de ESLint v10.
- **Traducción de roles backend ↔ frontend**: la capa vive en `services/auth.ts` (`mapBackendRole`). El resto de la app solo conoce `UserRole` (`ANON|USER|MODERATOR|ADMIN`). No exportar `BackendRole` ni `BackendUser` fuera de esa capa.
- **Mocks unificados**: `frontend/src/mocks/data.ts` es la única fuente. Prohibido datos inline en componentes. Si necesitas un mock nuevo (p. ej. para una pantalla nueva), añádelo allí y léelo desde un hook (`useApi(...)`).
- **Iconos: SVG inline a mano** en `components/ui/Icons.tsx` (no `lucide-react`, decisión de auditoría). Wrapper `Svg` con defaults `stroke="currentColor" strokeWidth="2"`. Cada icono es una función `IconXxx({ size, className })`. Para añadir uno nuevo, copia el patrón de los existentes.
- **Fallback selectivo en `apiFetch`**: solo `isNetworkError(e)` cae al mock. Errores 4xx/5xx propagan a la UI. Las funciones del `AuthContext` (`login`, `register`) ya implementan este patrón — replicarlo en cualquier servicio nuevo.
- **Modo demo controlado por flag**: `VITE_USE_MOCK_FALLBACK` (lee en `lib/env.ts` como `ALLOW_MOCK_FALLBACK`). Cuando está activo, los errores de red caen al mock Y disparan `markDemoMode()` (banner global "Modo demostración"). Cuando está off, los errores propagan al UI sin mock. **Patrón obligatorio en cualquier nuevo `catch` que silencie errores**: `if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) { markDemoMode(); fallback() } else { throw e }`.
- **Stores singleton vía `useSyncExternalStore`** (`lib/demoMode.ts`, `lib/bannedWords.ts`, `lib/eventInterests.ts`): patrón para estado global que vive fuera del árbol React. Cada uno expone `getX()`, `subscribeX(fn)`, `setX/addX/etc()`. El hook React (`useDemoMode`, `useBannedWords`, `useEventInterests`) lo consume con `useSyncExternalStore`. Usar este patrón para nuevos stores compartidos en vez de Context (más simple, sin re-renders innecesarios, accesible desde código no-React como `apiFetch`).
- **`optimisticMutation` helper** (`lib/optimisticMutation.ts`): encapsula el patrón "aplica optimista → llama al back → reemplaza con respuesta del server, o rollback en error, o marca demo en network error". Usar en cualquier mutación que necesite optimistic update (chat, joinComunidad, like de evento, etc.) en vez de copiar el try/catch a mano.
- **`useApi` como helper de lectura, `optimisticMutation` para escritura**. Si necesitas más complejidad (paginación, refetch, cache), considerar TanStack Query — pero hoy NO lo necesitamos.
- **Errores de escritura propagan al UI; nunca se silencian salvo en modo demo**. Aplicado en `sendBottle`, `sendLetter`, `updateUsername`, `submitMood`, `markInterest`. Patrón: `try { await op() } catch (e) { if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) { markDemoMode(); /* asumir éxito */ } else { setError(e.message); /* mostrar al usuario */ } }`.
- **`<RequireRole roles={[...]} redirectTo="/">` para proteger rutas**. Usado en `/moderacion`, `/modregister` (con redirect a `/loginmod`), `/eventos/nuevo`. **No** hacer checks de rol inline dentro de cada página — usar el wrapper.
- **`<NotFoundPage>` y ruta catch-all `*`** al final de `<Routes>` en App.tsx. Cualquier URL inválida muestra una página 404 con CTA al home.
- **Lazy-load para rutas pesadas o poco frecuentes** con `React.lazy(() => import('./pages/X').then(m => ({ default: m.X })))` y `<Suspense fallback={<PageState loading/>}>` envolviendo Routes. Hoy: `MapPage` (Leaflet), `ModerationPage`. Si añades una pantalla nueva pesada (>50KB) o solo accesible para mods/admins, considerar lazy.
- **Filtro de palabras prohibidas en render**: `maskBannedWords(text, bannedWords)` (de `lib/bannedWords.ts`) se aplica al renderizar **cualquier texto generado por usuarios** — chat de comunidades, mensajes del dashboard, popups de mapa, popups de botella, etc. Subscribirse a la lista con `useBannedWords()`. Cuando se añada un surface nuevo con texto de usuario, **aplicar el mask**.
- **i18n con `react-i18next`** (`lib/i18n.ts`): tres idiomas Español/English/Euskera, persistido en `localStorage` (`sys_lang`), inicializado antes del primer render. Hook `useTranslation()` + `t('namespace.key')`. Recursos inline en `lib/i18n.ts` hasta crecer a >50 strings por idioma; entonces mover a `locales/{lang}.json`. Cobertura actual parcial (ver TODOs).
- **Persistencia local cuando no hay back** (`lib/bannedWords.ts`, `lib/eventInterests.ts`, `sys_lang`, `sys_theme`, `sys_token`): patrón con `localStorage` + clave `sys_*` + módulo singleton con `get/set/subscribe`. Cuando exista el back, sustituir solo la capa de fetch — los hooks consumidores no cambian.
- **Sub-componentes en `components/<area>/`**: para descomponer god components, los sub-componentes viven en su propia subcarpeta de `components/` (no en `pages/`). Convención actual: `components/auth/`, `components/settings/`, `components/moderation/`, `components/events/`, `components/layout/`, `components/ui/`. Cada sub-componente tiene su **propio `.module.css`**. **Prohibido importar el CSS Module de la page padre** desde un sub-componente — acoplamiento invertido eliminado en la auditoría B1.
- **`useSavedFlash(ms)` hook** (`hooks/useSavedFlash.ts`): para el patrón "✓ Guardado" temporal. Devuelve `[shown, flash]`. Llama a `flash()` tras un éxito y `shown` queda true durante `ms` (2000 por defecto). Cancela el timer al desmontar. Usar este en vez de `useState + setTimeout` inline.
- **Eventos "Me interesa" con contador real**: el back devuelve `interestedCount` **incluyendo** al usuario actual si ya tiene interés registrado. Para evitar doble conteo, `EventDetailPage` captura el estado inicial de `liked` con `useRef(liked)` en el primer render y calcula un **delta**: `(event.interestedCount ?? 0) + (liked === likedOnMount.current ? 0 : liked ? 1 : -1)`. Si el estado no cambió desde el monte → delta 0; si el usuario acaba de dar like → +1; si acaba de quitarlo → −1. **Todos los roles pueden dar Me interesa, incluido ANON** (`canLike = !!user`); el backend lo permite mediante `authenticated()` que acepta cualquier JWT válido incluido el de ANON.

---

## Cosas pendientes / TODO conocidos

> ⚠️ **Histórico (anterior al 2026-06-03).** Muchos `[ ]` de "Backend" de aquí abajo (implementar `/api/auth/anonymous`, `/login`, `/register`, `users/me/*`, comunidades, eventos, etc.) **YA están implementados** tras el realineamiento. La fuente de verdad actual de pendientes es la sección **"Pendientes / Roadmap"** más abajo. Se conserva este bloque como registro de la evolución del proyecto, no como lista activa.

### Backend
- [x] ~~Renombrar `passowrd` → `password` en `RegisterRequest`.~~ (hecho 2026-05-21)
- [x] ~~No exponer `User` (con password hash) en respuesta del registro mod.~~ (ahora devuelve 204 No Content)
- [x] ~~Asignar `role` en `AuthService.register`.~~ (hecho: el front lo envía y el back lo valida con `@Pattern`)
- [ ] Implementar `POST /api/auth/anonymous`, `/login`, `/register`, `/login/mod`. **El front ya los llama** (con fallback al mock controlado por `VITE_USE_MOCK_FALLBACK`); cuando existan, poner el flag a `false` en `.env` y el demo deja de caer al mock automáticamente.
- [ ] Implementar JWT real (ahora todo es `permitAll`).
- [ ] Endpoints de `users/me/*` (profile, settings, onboarding, mod-profile, password, username, mood). **El front ya los llama.**
- [ ] Lógica de comunidades (con `joined`, `unread`, `pinnedNote` por user actual), eventos (con `interestedCount` por evento), historias, botellas, cartas, profesionales y moderación. **El front ya los llama** vía `useApi`; sin back, ven datos de `mocks/data.ts`.
- [ ] Nuevos endpoints que el front ya espera (Sprint 2):
  - `GET /api/communities/:id/members/active` → `ApiChatMember[]`
  - `GET /api/users/me/dashboard/messages` → `ApiDashboardMessage[]`
  - `GET /api/bottles/floating` → `ApiBottleStory[]`
  - `GET /api/moderation/members` → `ApiModerationMember[]`
  - `POST /api/users/me/mood` (body `{ value: 1..5 }`)
  - `POST/DELETE /api/events/:id/interest`
- [ ] Decisión arquitectónica resuelta en auditoría: el back **mantiene** `PROFESSIONAL | ADMINISTRATOR | USER | ANON`; el front mantiene `ANON | USER | MODERATOR | ADMIN`. La traducción está hecha en `services/auth.ts`. **No hace falta cambiar el enum del back.** Solo añadir `USER` y `ANON` al enum de Java cuando se implementen los endpoints de usuario final.
- [ ] `RegisterModRequest` acepta `profession` y `specialization` (armonización 2026-05-25) pero **NO los persiste todavía** — `User` no tiene los campos. Cuando se quiera, añadirlos a `User` con `@Enumerated(EnumType.STRING)` o FK a `ProfessionType`/`SpecializationType`.
- [ ] **Filtro automático de palabras (CRUD + aplicación server-side)**: el front ya aplica la censura al renderizar (vía `maskBannedWords` en `lib/bannedWords.ts`) con lista persistida en `localStorage`. Cuando el back lo asuma:
  - Entidad `BannedWord` (id, word, createdBy?, createdAt) y repositorio.
  - Endpoints `GET/POST /api/moderation/banned-words`, `PATCH/DELETE /api/moderation/banned-words/:id` (solo MODERATOR/ADMIN).
  - Aplicar el filtro **server-side** antes de guardar/enviar mensajes; el front pasa a ser solo UI de CRUD (la censura en render se mantiene como red de seguridad).
- [x] ~~**2FA TOTP (Google Authenticator) en el flujo de moderadores/administradores.**~~ — armonizado 2026-05-25. Los 4 endpoints (`/register/mod`, `/register/mod/verify`, `/login/mod`, `/login/mod/verify`) implementados en el back con la lib `com.warrenstrange:googleauth`, JWT real (`JWTService`), y un `ConcurrentHashMap<challengeId, ChallengeData>` con TTL 5 min en `AuthService` para los challenges. Cuando el flujo arranque, el front deja de caer al mock de `lib/totp.ts` automáticamente. Pendientes derivados:
  - **`totpActivated: boolean`** en `User` — hoy `verifyModRegistration` valida el primer código pero no marca la activación. Cualquier user creado puede hacer login aunque nunca confirme el QR. Bajo riesgo (es para mods), pero hay que añadir el flag y bloquear login si no está `true`.
  - **Map de challenges es in-memory** — sin TTL real (solo timestamp), sin limpieza periódica, se pierde al reiniciar. Para producción mover a Redis o tabla.
  - **Eliminar `frontend/src/lib/totp.ts`** y los catch del fallback en `services/auth.ts` cuando se valide que el flujo funciona contra el back real. Hoy se mantienen porque `VITE_USE_MOCK_FALLBACK=true` permite seguir desarrollando sin back.

### Frontend
- [x] ~~Reemplazar arrays mock inline por llamadas (servicios) con fallback al mock centralizado.~~ (hecho — auditoría tareas 1+2)
- [x] ~~Conectar `ProfilePage` con `useProfile()`.~~ (hecho — antes lo ignoraba)
- [x] ~~Activar servicios reales en `AuthContext` con fallback selectivo.~~ (hecho — auditoría tarea 2)
- [x] ~~Capa de traducción de roles back↔front.~~ (hecho en `services/auth.ts`)
- [x] ~~Sustituir emojis pictográficos por SVG.~~ (hecho — auditoría tarea 3)
- [x] ~~Arreglar fallback silencioso de CommunityChatPage cuando el id no existe.~~ (hecho)
- [x] ~~Arreglar auto-scroll del chat que secuestraba la lectura del historial.~~ (hecho)
- [x] ~~Bug fix: `modSaved` activándose tras error en `SettingsPage`.~~ (hecho)
- [x] ~~Borrar lógica de privilege escalation por prefijo de username.~~ (hecho — antes `startsWith('admin') → ADMIN`)
- [x] ~~Guard de rol en rutas (`<RequireRole>`)~~ — Sprint 1.
- [x] ~~**Restaurar `<RequireRole>` en `/modregister`**~~ — hecho 2026-06-05. La ruta exige `roles={['ADMIN']}` (solo ADMINISTRATOR puede crear mods/admins). El endpoint `/api/auth/register/admin/bootstrap` existe y permite crear el primer admin sin sesión.
- [x] ~~Ruta catch-all `*` con `<NotFoundPage />`~~ — Sprint 1.
- [x] ~~`.env.example` con `VITE_BACKEND_URL` y `VITE_USE_MOCK_FALLBACK`~~ — Sprint 1.
- [x] ~~"Modo oscuro próximamente": implementado como toggle real~~ — hecho 2026-05-23.
- [x] ~~Quitar `react-bootstrap` y reemplazar `Spinner` de `PageState` por uno propio~~ — Sprint 1.
- [x] ~~Lazy loading por ruta (`/mapa` y `/moderacion`)~~ — Sprint 2.
- [x] ~~Bug joinedSet de CommunityListPage~~ — Sprint 1.
- [x] ~~Sanitizar `emoji` antes del `divIcon` de Leaflet~~ — Sprint 1.
- [x] ~~Bundle iconos de Leaflet locales (no unpkg)~~ — Sprint 1.
- [x] ~~Deshabilitar botón "Contactar" en ProfessionalsPage hasta tener PrivateChatPage~~ — Sprint 1 (texto "Próximamente", `disabled`).
- [x] ~~Propagar errores en `sendBottle`/`sendLetter`/`updateUsername`~~ — Sprint 1.
- [x] ~~Banner "Modo demostración" + flag `VITE_USE_MOCK_FALLBACK`~~ — Sprint 1.
- [x] ~~Filtro de palabras compartido (`lib/bannedWords.ts`) con censura en render~~ — Sprint 1.
- [x] ~~`_setUserFromToken` → `loginAsMod` en context~~ — Sprint 2.
- [x] ~~Unificar `useCommunityChat` con `useApi` (vía `optimisticMutation`)~~ — Sprint 2.
- [x] ~~Reemplazar `MOCK_*` importados directamente por hooks~~ — Sprint 2 (`useCommunityMembers`, `useDashboardMessages`, `useFloatingBottles`, `useModerationMembers`). Campos `unread` y `pinnedNote` movidos a `ApiCommunity`.
- [x] ~~Decisión: mood selector~~ — Sprint 2: conecta a `POST /api/users/me/mood` con propagación de errores y demo mode.
- [x] ~~Decisión: selector de idioma~~ — Sprint 2: i18n real con Español / English / Euskera (cobertura parcial, ver pendientes).
- [x] ~~Decisión: modo compacto~~ — Sprint 2: borrado del toggle.
- [x] ~~Decisión: like de eventos~~ — Sprint 2: `lib/eventInterests.ts` con persistencia local + contador `interestedCount`.
- [x] ~~Romper SettingsPage en `components/settings/`~~ — Sprint 2 (8 sub-componentes, página 90 LOC vs 436 antes).
- [x] ~~Romper ModerationPage en `components/moderation/`~~ — Sprint 2 (3 sub-componentes, página 47 LOC vs 349 antes).
- [x] ~~Extraer EventForm de EventDetailPage en `components/events/`~~ — Sprint 2 (página 148 LOC vs 435 antes).
- [x] ~~Mover inline styles a CSS Modules~~ — Sprint 2 (solo quedan el `width: ${pct}%` dinámico y el placeholder de PrivateChatPage).
- [x] ~~Implementar `PrivateChatPage`~~ — Sprint 3. Chat 1 a 1 funcional con mock (4 mensajes seed), avatar + nombre + especialidad en el header, optimistic update vía `optimisticMutation`, not-found si el profesional no existe. Botón "Contactar" de ProfessionalsPage reactivado.
- [x] ~~Ocultar `company` en ModProfileSection para ADMIN~~ — Sprint 3. `ApiModProfile.company` ahora `string | undefined`; FIELDS se filtran si `user.role === 'ADMIN'`.
- [ ] Decidir y aplicar política de token storage. Hoy: `localStorage`. **Decisión auditoría 2026-05-24: privacidad = marketing, así que se mantiene `localStorage` por ahora.** Revisar si cambia el alcance.
- [ ] `@fontsource/inter` en lugar de Google Fonts CDN. **Decisión auditoría 2026-05-24: pospuesto (privacidad = marketing).** El render-blocking sigue siendo argumento técnico válido para hacerlo eventualmente.
- [ ] (Decisión pendiente del usuario) Sustituir también los símbolos tipográficos `✓ ✕ ✎ ➤ ☰ ★` por SVG dedicados para consistencia total. Hoy se quedan como Unicode.
- [x] ~~Navbar dependiente del rol~~ — Sprint 3. MODERATOR/ADMIN ven: Moderación, Comunidades, Eventos, Profesionales. ANON/USER mantienen los 6 originales. Botón "Entrar" oculto cuando `isLoggedIn`.
- [x] ~~i18n cobertura completa~~ — Sprint 3. Las 16 pantallas internas + sub-secciones traducidas. Total ~280 keys × 3 idiomas. Recursos siguen inline en `lib/i18n.ts` (~1100 LOC). Si crece más, mover a `locales/{lang}.json` con `i18next-http-backend`.
- [x] ~~**MOCK_MOD_PROFILE singleton**~~ — Auditoría 2026-05-26 (B6). Seed derivado de `useAuth()` (username del usuario actual); el MOCK_MOD_PROFILE ya no se importa en runtime. Cuando exista `GET /api/users/me/mod-profile`, migrar a `useModProfile()` con `useApi`.
- [x] ~~**PrivateChatPage mensajes mock idénticos**~~ — Auditoría 2026-05-26 (C6). `buildMockPrivateMessages(professionalId)` rota entre 3 plantillas; cada profesional muestra un hilo distinto. Idem para `buildMockMessages(communityId)` en comunidades.
- [x] ~~**Refactor `auth:expired` → bus singleton**~~ — Auditoría 2026-05-26 (B4). `lib/authBus.ts` con buffer del último evento; resistente a race conditions del orden de mount.
- [ ] **Símbolos tipográficos `✓ ✕ ✎ ➤ ☰ ★` → SVG dedicados** (consistencia visual total). Decisión usuario 2026-05-25: pospuesto.

---

## Pendientes / Roadmap (post-realineamiento front↔back, 2026-06-03)

> Esta es la **lista activa** de pendientes. Cubre también cosas fuera del código.

### 1. Urgente (manual, seguridad)
- **Revocar la App Password de Gmail comprometida.** Estuvo hardcodeada en `EmailConfig.java` y **sigue en el historial git del backend** aunque el código actual ya lee `MAIL_USERNAME`/`MAIL_PASSWORD` del entorno (`application.properties:24-30`). Revocarla en la cuenta de Google y definir las variables por entorno antes de cualquier despliegue.

### 2. Verificación end-to-end (nada probado en ejecución, solo compila)
- Levantar front + back + MySQL y probar contra el back real: login/2FA mod, comunidades, **chat privado en tiempo real**, eventos, moderación, botella, máquina del tiempo.

### 3. Base de datos existente (`ddl-auto=update` no basta)
- `update` **no** relaja columnas `NOT NULL` a nullable (p. ej. `reports.story_id`) ni recrea constraints. En una BD ya creada hay que recrear o hacer `ALTER` puntual.
- `db/04` (procedimientos/función) y `db/06` (trigger) **no** se ejecutan solos con el compose (solo se monta `db/02`). Hay que correrlos a mano tras el primer arranque.

### 4. Infra / build
- Spring Boot **`4.1.0-SNAPSHOT`** → build no reproducible. Fijar versión release.
- Front: considerar `manualChunks` y alias `@/*` (deuda vieja).

### 5. Funcional pendiente
- **Bandeja del profesional** (`usePrivateInbox`) aún **no es tiempo real** (su cola `/user/queue/private` ya recibe, falta cablearla a la bandeja).
- `settings`/`mood` **no persisten** en el back (decidir: persistir o quitar del UI).
- `ApiProfile.activity` se entrega **vacío** (no hay modelo de actividad).
- ~~Desajustes de contrato~~: `joinEvent`/`leaveEvent` **eliminados** del front (2026-06-05) — el endpoint `/join` nunca existió y la única acción relevante es `/interest`. `VerifyLoginPayload` **eliminado** de `types/api.ts` (era código muerto). Comentario en `types/api.ts` actualizado a los endpoints reales (`/2fa/qr`, `/2fa/code`).
- ~~Guard `/modregister`~~: ya en producción con `roles={['ADMIN']}` (2026-06-05).

### 6. Pulido / deuda
- Estilos del botón "reportar" en el popup del mapa.
- **Entidades muertas `Valoration` / `Profession` / `Specialization`** (referenciadas por FK en `User` vía `professionRef`/`specializationRef`) → limpieza coordinada back+BD.
- `WebMvcConfig` vacío. Comentario obsoleto en `WebSocketConfig.java:42-43` (describe el modelo `/topic/privateChats` ya migrado a `/queue`).
- Símbolos tipográficos `✓ ✕ ✎ ➤ ☰ ★` → SVG (deuda vieja). Google Fonts CDN (privacidad/render-blocking).

### 7. Tests
- Backend: solo `contextLoads` (no corre sin BD). Front: vitest de funciones puras. Falta **cobertura de contrato** (MockMvc por dominio) y de hooks — justo donde estaban los fallos.

### 8. Seguridad futura (producción)
- Challenges de 2FA y buckets de rate limit **en memoria** (se pierden al reiniciar, no se comparten entre instancias) → Redis/tabla.
- Token JWT en `localStorage` (decisión PBL: privacidad = marketing).

---

## Branches

- `main` — branch principal.
- `main-frontend` — branch de trabajo actual (frontend).
- `main-firstFeature`, `main-firstFeature-correct` — features del backend (login mod, comunicación con el endpoint).
- `main-backend`, `main-backend-loginTest`, `backendTest` — branches del backend.

Commits recientes (con tag):
- `614f997` refactor: cambiar de nick a username
- `27f67e9` feat: sincronizar React con Spring Boot, comunicación con `registerMod`
- `68e30bc` Update compose.yml, change java-app for localhost

---

## Notas misceláneas

- Hay un `src/main/resources/Static/index.html` vacío (1 línea). No se sirve nada estático todavía; el frontend vive en su propio proceso.
- `target/` está en `.gitignore`. El directorio existe localmente con clases compiladas, ignorar.
- El proyecto usa Spring Boot **4.1.0-SNAPSHOT** (no released). El repo `spring-snapshots` está añadido en `pom.xml`. Si Maven falla resolviendo dependencias, verificar acceso a `https://repo.spring.io/snapshot`.
- El `readme-frontend.md` está mantenido y es fuente de verdad para detalles del frontend. Si hay discrepancia entre este CLAUDE.md y `readme-frontend.md`, consultar al usuario y actualizar el que esté mal.

---

## Última actualización

- **2026-06-05** — **Design-review + limpieza de código muerto.**
  - **Design-review (touch targets, fechas, empty states):**
    - `Navbar.module.css`: `.link`/`.linkActive` padding `4px` → `14px` (44px touch target); `.mobileLink` `12px` → `15px`.
    - `EventListPage.tsx`, `EventDetailPage.tsx`, `DashboardPage.tsx`: helper `fmtDate()` que convierte ISO a fecha legible con `toLocaleDateString`; host condicional (oculta el elemento cuando está vacío, elimina el "con ·" huérfano).
    - `ProfilePage.tsx` + `ProfilePage.module.css`: mensaje "Aún no hay actividad registrada." cuando `activity` está vacío. Key `profile.noActivity` añadida a los 3 idiomas.
  - **Limpieza de código muerto:**
    - `services/events.ts`: eliminadas `joinEvent`/`leaveEvent` (el endpoint `/api/events/:id/join` nunca existió en el back; el widget del Dashboard que tenía el botón "Apuntarme" ya solo navegaba sin llamarlas).
    - `types/api.ts`: eliminada `VerifyLoginPayload` (nunca importada); comentario del bloque 2FA actualizado a los endpoints reales (`/2fa/qr`, `/2fa/code`).
  - **CLAUDE.md**: corregidos dos TODOs ya resueltos (RequireRole en `/modregister` estaba hecho desde 2026-06-04; desajustes de contrato ahora resueltos).

- **2026-06-05** — **Vista de chats privados del profesional: redirigir a bandeja, ocultar lista de colegas.**
  - **Problema:** cuando un profesional (MODERATOR en el front) accedía a `/chat/:id`, veía la lista de todos los profesionales en el sidebar en lugar de sus conversaciones con usuarios anónimos. El botón "Mi bandeja" al final del sidebar tampoco tenía sentido.
  - **Cambios:**
    - `PrivateChatPage`: si `isMod && !isInboxMode`, devuelve `<Navigate to="/chat/inbox" replace />` antes de renderizar nada. Los profesionales siempre aterrizan en su bandeja. Eliminado el `ChatSidebarItem` de "Mi bandeja" del sidebar normal (era código muerto para mods). Eliminados import de `useAuth` y la variable `user` (ya sin uso tras borrar el item).
    - `Navbar`: en la rama `isMod`, se sustituye `{ to: '/profesionales', label: t('nav.profesionales') }` por `{ to: '/chat/inbox', label: t('nav.chatsPrivados') }`. Los profesionales ven "Chats privados" en el menú en lugar de "Ayuda profesional".
    - `i18n`: añadida key `nav.chatsPrivados` en ES ("Chats privados"), EN ("Private chats") y EU ("Chat pribatuak").
  - **Comportamiento resultante:** un profesional entra a `/chat/inbox` desde el navbar (o desde cualquier `/chat/*` que le redirige). Ve su lista de conversaciones con usuarios anónimos. Los usuarios normales siguen viendo la lista de profesionales como antes.

- **2026-06-05** — **Tarjetas de "Ayuda profesional": el estado pasa de disponibilidad falsa (now/today/tomorrow) a online/offline real.**
  - **Motivo:** el pill de disponibilidad mostraba solo el punto sin texto. La causa: `ProfessionalController` hardcodeaba `availability="today"` con `availableAt=null` para *todos*, y la rama `today` del pill pintaba el texto desde `availableAt` (vacío → solo punto). Además el matiz now/today/tomorrow no significaba nada (no hay modelo de disponibilidad). Decisión del usuario: estado de conexión real, coherente con la tabla de Miembros.
  - **Backend:** `ProfessionalResponse` cambia `availability`/`availableAt` (String) por **`online` (boolean)**. `ProfessionalController` inyecta `UserPresenceService` y calcula `online = presenceService.isOnline(u.getUsername())` (mismo origen de presencia que el staff del panel: sesiones STOMP vivas, snapshot al pedir el listado, no tiempo real).
  - **Frontend:** `ApiProfessional` pierde `availability`/`availableAt` y gana `online: boolean`. `ProfessionalsPage` y `PrivateChatPage` sustituyen `AvailabilityPill` por `StatusPill` (punto + "En línea"/"Desconectado"). El filtro `filterNow` ("Disponibles ahora") pasa a `filterOnline` ("En línea") y filtra por `p.online`. i18n: `availNow/availToday/availTomorrow/filterNow` → `statusOnline/statusOffline/filterOnline` (ES/EN/EU). CSS: `.pillNow/.pillToday/.pillTomorrow` → `.pillOnline/.pillOffline` en ambos `.module.css`.
  - **Caveat:** `online` es snapshot por sesión WS (igual que el staff): refleja quién tiene la app abierta al cargar el listado, no se actualiza en vivo.

- **2026-06-05** — **Fix: el WebSocket no se reconectaba al cambiar de identidad (login/logout) → presencia online y `/user/queue` con el Principal equivocado.**
  - **Problema:** `initWS()` se ejecuta una sola vez al cargar el módulo (`main.tsx`) y **nada reconectaba el STOMP al cambiar el token**. El `Principal` de la sesión WebSocket se fija en el CONNECT, así que si la app arrancaba anónima (caso típico) y luego hacías login de mod/admin, la conexión seguía viva con el `Principal` **anónimo**. Efecto visible: un admin logueado aparecía **offline** en la tabla de staff (su username nunca entraba en `UserPresenceService`). Mismo defecto latente en los **mensajes privados** (`/user/queue/private` enruta por el Principal).
  - **Fix (frontend):** `lib/wsClient.ts` guarda el `connectedToken` (el token usado por la conexión viva, fijado en `beforeConnect`) y expone **`syncWSAuth()`**: si el token actual difiere, fuerza `deactivate().then(activate())` para que el CONNECT lleve el JWT vigente (los `onConnect` callbacks se vuelven a suscribir solos). `AuthContext.applySession` llama a `syncWSAuth()` tras guardar el token, cubriendo login, login mod (`loginAsModWithToken`), registro, restauración, anónimo y logout. La guarda por igualdad de token evita reconexiones redundantes (p. ej. en refresh con sesión ya válida no reconecta).
  - **Sin cambios de backend.** La presencia (`UserPresenceService`) ya era correcta; el bug era que el cliente nunca reconectaba con la identidad nueva.

- **2026-06-05** — **Pestaña "Miembros" del panel: tabla de mod/admins (con online) + editar/borrar, además de la lista de miembros de comunidad.**
  - **Decisión:** la pestaña Miembros ahora muestra **arriba** una tabla con todo el equipo (PROFESSIONAL + ADMINISTRATOR) y **debajo** se mantiene la lista de miembros de comunidad con Avisar/Banear. Botón **"Añadir mod/admin"** → `/modregister`.
  - **Backend (3 endpoints nuevos en `ModerationController`/`ModerationService`):**
    - `GET /api/moderation/staff` → `StaffMemberResponse[]` (`id, name, username, email, role, company, profession, joined, online`). `online` se calcula con la **presencia global nueva** (`UserPresenceService` + `UserPresenceListener`): mapa en memoria `username -> sesiones STOMP vivas`, alimentado por `SessionConnectedEvent`/`SessionDisconnectEvent` (el CONNECT ata el Principal=username en `WebSocketConfig`). Es snapshot (al cargar/refrescar), no tiempo real. `UserRepository.findByRoleIn(...)` nuevo.
    - `PATCH /api/moderation/staff/{id}` (body `UpdateStaffRequest {name?, email?, company?, profession?}`) → edita campos básicos. **Solo ADMINISTRATOR** (403 si no) y **no la cuenta propia** (400). No edita rol ni username.
    - `DELETE /api/moderation/staff/{id}` → borra el usuario. **Solo ADMINISTRATOR** y **no la cuenta propia** (400). `CommunityMember.userId` es columna lógica (sin FK JPA), así que el borrado no rompe el mapeo; si hubiera FKs a nivel de script SQL podría dar 409.
  - **Frontend:**
    - `types/api.ts`: `ApiStaffMember` (con `online`) + `UpdateStaffPayload`.
    - `services/moderation.ts`: `getModerationStaff`, `updateStaff`, `deleteStaff`. Hook `useModerationStaff` (`useApi`).
    - `components/moderation/MembersSection.tsx`: tabla de staff con punto de estado (En línea/Desconectado), etiqueta de rol, y botones **editar** (`IconPencil`) / **borrar** (`IconTrash`) que **solo aparecen para ADMIN y nunca en la fila propia** (comparando `useRole().user.id` con el id del staff). Borrar usa confirmación inline (Confirmar/Cancelar).
    - `components/moderation/StaffEditModal.tsx` (+ `.module.css`): modal de edición reutilizando `FormField`/`Input`/`Feedback`. Para ADMINISTRATOR oculta empresa/profesión (igual que `ModRegisterPage`).
    - `Icons.tsx`: nuevos `IconPencil` e `IconTrash`.
    - i18n: claves `moderation.staffDesc/addStaff/staffEmpty/online/offline/editBtn/deleteBtn/confirm/cancel/staffEdit*` (ES/EN/EU).
  - **Caveat:** el `online` es por **sesión WS** (si un mod tiene la app abierta en una pestaña → online). Se actualiza al entrar/refrescar la pestaña Miembros, no en vivo.

- **2026-06-05** — **Mensajes privados: resolver/avisar un reporte ahora BORRA el mensaje y desaparece en vivo (como en comunidades).**
  - **Cambio:** en `ModerationService.resolveReport`, la rama `PRIVATE_MESSAGE` ya no sanea el texto sino que **borra la fila de `private_messages`** vía nuevo `PrivateMessageService.deleteMessage(messageId)`. Como un chat privado tiene dos participantes y usa colas personales (no un topic), el `DELETE` se difunde a la cola de **ambos** (`/user/queue/private`), igual que `saveMessage` reparte el mensaje. El `message_id` del reporte es referencia lógica (sin FK); el snapshot `reports.content` conserva el texto para el panel.
  - **Backend:** `PrivateMessageDTO` gana campo `action` + factory `deleted(id, userId, professionalId)` (lleva los ids para que el cliente enrute el borrado al hilo). `PrivateMessageService.deleteMessage` borra y difunde a ambos. Con esto, **las tres ramas de moderación (STORY, MESSAGE, PRIVATE_MESSAGE) borran**; se eliminó la constante `REDACTED_MESSAGE` (ya sin uso).
  - **Frontend:** `privateChatStore` añade `removeMessage(professionalId, id)`; `privChatWS` ramifica por `raw.action === 'DELETE'` → lo quita del hilo (clave = `professionalId`).
  - **Caveat (igual que ya pasaba):** la **bandeja del profesional** (`usePrivateInbox`) no es tiempo real, así que el profesional verá el borrado al recargar; el **usuario** con el hilo abierto sí lo ve en vivo. Es la misma limitación de tiempo real que ya tenían los privados (ver Roadmap §5).

- **2026-06-05** — **Resolver/avisar un reporte de mensaje de comunidad ahora BORRA el mensaje (antes lo enmascaraba).**
  - **Cambio:** en `ModerationService.resolveReport`, la rama `MESSAGE` ya no sanea el texto a `[eliminado por moderación]` sino que **borra la fila de `community_messages`** vía `communityMessageService.deleteMessage(communityId, messageId)`, que difunde el evento `DELETE` por `/topic/communities/{id}`. Resultado: al resolver un mensaje reportado, desaparece en vivo en todas las sesiones del chat, igual que el delete directo del moderador. El `message_id` del reporte es referencia lógica (sin FK), así que borrar el mensaje no rompe nada; el snapshot `reports.content` conserva el texto para el panel.
  - **Limpieza:** eliminado `CommunityMessageService.maskMessage(...)` (introducido el mismo día), ya sin uso.
  - **Sin cambios de front.** Los `PRIVATE_MESSAGE` siguen enmascarándose (sin difusión en vivo) — fuera de alcance.

- **2026-06-05** — **Moderación de mensajes de comunidad en tiempo real (borrado y saneo se ven al instante para todos).**
  - **Problema:** ni el borrado directo de un mensaje (`DELETE /:id/messages/:msgId`) ni el saneo por resolver/avisar un reporte difundían nada por WebSocket. El moderador lo veía (quita el mensaje localmente), pero el resto de la comunidad seguía viendo el mensaje original hasta recargar.
  - **Solución (solo backend; el front ya estaba preparado):**
    - `CommunityMessageDTO`: nuevo campo `action` + factory `deleted(id)` (`action:"DELETE"`). En mensajes normales `action` es null → el cliente lo trata como crear/actualizar.
    - `WebSocketService.broadcastDeletedCommunityMessage(communityId, messageId)`: difunde el borrado por `/topic/communities/{id}`.
    - `CommunityMessageService`: `deleteMessage` ahora recibe `communityId` y **difunde DELETE** tras borrar; nuevo `maskMessage(messageId, texto)` que sanea el texto, guarda y **difunde la actualización** (mismo id → el front hace upsert y cambia el texto en sitio).
    - `CommunityMessageController.deleteMessage`: pasa `communityId` al servicio.
    - `ModerationService`: la rama MESSAGE de `resolveReport` delega en `communityMessageService.maskMessage(...)` (antes saneaba inline sin difundir).
  - **Front:** sin cambios. `communityChatWS` ya ramifica por `payload.action === 'DELETE'` → `removeMessage`; en otro caso `addMessage`, que es **upsert** (si el id ya existe, mezcla y actualiza el texto). `ApiMessage` ya tenía `action?: 'DELETE'`.
  - **Alcance:** cubre mensajes de **comunidad**. Los **mensajes privados** saneados por moderación siguen sin difusión en vivo (van por `/user/queue/private`, otro canal) — pendiente si se quiere. Nota cosmética menor: al actualizar un mensaje saneado el DTO lleva `own:false`, así que en la pantalla del autor el globo redactado puede cambiar de lado (irrelevante, el contenido está censurado).

- **2026-06-05** — **Moderación de historias del mapa: al resolver un reporte de tipo STORY se borra el punto (antes se enmascaraba).**
  - **Cambio:** en `ModerationService.resolveReport`, la rama `STORY` ya no hace `setMessage("[eliminado por moderación]")` sino que **borra la fila de `storyMaps`** por completo. Mensajes de comunidad y privados siguen enmascarándose igual.
  - **FK:** antes de borrar, se desligan todos los reportes que referencian esa historia (`reports.story_id`) vía nuevo `ReportRepository.findByStory_Id(...)` + `setStory(null)` + `saveAll/flush`, para no violar la restricción. El snapshot `reports.content` conserva el texto reportado, así que el panel de moderación sigue mostrando qué se reportó aunque la historia ya no exista.
  - **Tiempo real:** el punto desaparece **en vivo** en los mapas abiertos. Backend: nuevo `StoryMapEventDTO {action, id, message, latitude, longitude}`; `WebSocketService.broadcastNewStoryMap` ahora envía `action:"CREATE"` y el nuevo `broadcastDeletedStoryMap(id)` envía `action:"DELETE"` por `/topic/storyMap`. Frontend: `storiesStore` añade `removeStory(id)`; `storiesWS` ramifica por `raw.action` (`DELETE` → quita el punto; resto → lo añade, con fallback compatible si no viene acción).
  - **Contrato WS de historias:** el mensaje de `/topic/storyMap` pasa a llevar un campo `action`. El GET REST `/api/stories` no cambia (sigue devolviendo entidades `StoryMap` crudas). Front + back compilan limpios.

- **2026-06-04** — **Fix: historias del mapa de 256–300 caracteres no se guardaban (y fallaban en silencio).**
  - **Problema:** el front permite hasta 300 chars (`MapPage` `maxLength={300}`), pero la entidad `StoryMap.message` era un `String` sin `@Column(length)`, así que Hibernate (`ddl-auto=update`) creaba la columna como `VARCHAR(255)`. Una historia de 256–300 chars reventaba en MySQL (`Data too long`). Peor aún: `StoryMapService.createStoryMap` envolvía el `save()` en un `try/catch` que **se tragaba la excepción** y devolvía un `int` (406) en el **body** con HTTP 200, de modo que el front (que ignora el body y confía en que el POST lance) nunca se enteraba → la historia no se guardaba sin ningún error visible.
  - **Solución (backend):**
    - `StoryMap.java`: `@Column(length = 300)` en `message` para casar con el límite del front.
    - `NewStoryMapRequest.java`: validación `@NotBlank @Size(max = 300)` en `text`.
    - `StoryMapController.java`: `@Valid` en el `@RequestBody`; ahora devuelve `ResponseEntity<StoryMap>` con **201 Created** (antes un `int`). Un texto >300 → 400 limpio vía `MethodArgumentNotValid` del `GlobalExceptionHandler`.
    - `StoryMapService.java`: eliminado el `try/catch` que silenciaba el error (y los `System.out.println` de debug); ahora devuelve el `StoryMap` guardado y deja que los fallos de persistencia se propaguen. El front ya tiene el `catch` + `silentMutation` que mostrará el error.
  - **Frontend:** sin cambios de código (el contrato se respeta: `createStory` ignora el body y la historia llega por el broadcast WS).
  - **OJO BD existente:** `ddl-auto=update` **no** ensancha de forma fiable una columna ya creada (solo añade tablas/columnas que faltan). En una BD que ya tenga la tabla `storyMaps`, hay que ejecutar a mano: `ALTER TABLE storyMaps MODIFY message VARCHAR(300);`. En una BD nueva Hibernate ya la crea como `VARCHAR(300)`.

- **2026-06-04** — **Presencia real de "usuarios en línea" derivada de sesiones STOMP (fix: el contador solo subía).**
  - **Problema:** el número de "en línea" era un entero **persistido en la columna `online` de `Community`** que el cliente incrementaba (`POST /:id/online?delta=+1`) al entrar al chat y decrementaba (`delta=-1`) al salir. El `-1` solo se enviaba si React desmontaba de forma ordenada; con cierre de pestaña, F5, pérdida de red o suspensión del móvil, el `+1` quedaba persistido y el `-1` no llegaba nunca. Como el valor era global y sobrevivía a reinicios, la deriva al alza se acumulaba para siempre → "solo sube y sube".
  - **Solución (backend):** presencia derivada de las **suscripciones STOMP vivas**, todo en memoria.
    - Nuevo `domain/community/service/CommunityPresenceService.java`: `Map<communityId, Set<sessionId>>` + `Map<"sessionId:subscriptionId", communityId>` (para resolver el UNSUBSCRIBE, que no trae destino). Métodos `onSubscribe/onUnsubscribe/onDisconnect/count`, y difunde el conteo por `/topic/communities/{id}/presence`.
    - Nuevo `websocket/listener/WebSocketPresenceListener.java`: `@EventListener` para `SessionSubscribeEvent` / `SessionUnsubscribeEvent` / `SessionDisconnectEvent`. El **DISCONNECT** (que el broker dispara también en cierres bruscos / timeout de heartbeat) es lo que hace que el número **baje solo**. Regex `^/topic/communities/(\d+)$` con `matches()` → solo cuenta el topic de una comunidad concreta (excluye el topic de lista y el propio `/presence`).
    - Nuevo `websocket/service/PresenceDTO.java` (`{communityId, online}`).
    - `CommunityService.toResponse` ahora calcula `online` con `presenceService.count(id)` en vez de `c.getOnline()`. `CommunityResponse.from` recibe `online` como parámetro. **Eliminados** `CommunityService.updateOnline` y el endpoint `POST /api/communities/:id/online` del controlador. La columna `online` de la entidad se conserva (compat BD) pero ya no se lee para la respuesta.
  - **Solución (frontend):**
    - `services/communityChatWS.ts`: quitadas las llamadas `updateCommunityOnline(+1/-1)`. Al entrar al chat, además de suscribirse a `/topic/communities/{id}` (mensajes), se suscribe a `/topic/communities/{id}/presence` y actualiza el `online` de esa comunidad en `communitiesStore` en vivo. Ambas suscripciones se limpian juntas al salir.
    - `services/communities.ts`: **eliminada** la función `updateCommunityOnline` (sin más consumidores).
  - **Comportamiento resultante:** el número refleja las sesiones realmente conectadas al chat y baja al salir aunque sea por cierre brusco. Cuenta por **sesión** (cada pestaña abierta suma 1); si se quisiera deduplicar por usuario, bastaría contar por `Principal`/username en `CommunityPresenceService`. Front + back compilan limpios.

- **2026-06-04** — **Conexión real de creación de comunidades y eventos; fixes de permisos y Me interesa.**
  - **`CommunityCreatePage`**: conectado a `POST /api/communities` (antes fake-success comentado). Corrección de bug: la categoría se manda en mayúsculas para que Jackson deserialice el enum `CommunityTypes` correctamente (`'ansiedad'` → `'ANSIEDAD'`). Añadido estado `loading`/`error`; tras crear, navega al ID real.
  - **`EventCreatePage`**: conectado a `POST /api/events` (antes fake-success comentado). Añadida `createEvent` a `services/events.ts` con mapeo de campos al modelo de la entidad `Event` (`description`, `topic`, `place`, `date` combinado con `time`).
  - **`ModRegisterPage`**: el 403 del backend ahora muestra mensaje claro en lugar de "Error 403". Añadidas keys i18n `errEmailDuplicate` y `errForbidden` (× 3 idiomas).
  - **`EventDetailPage` y `EventListPage`**: `canLike = !!user` (antes `user?.role !== 'ANON'`). Los anónimos tienen JWT válido; el backend acepta `authenticated()` para `/interest`.

- **2026-06-03** — **Realineamiento documental front↔back.** Tras una sesión grande de realineamiento de código (ver `AUDITORIA.md`), se puso al día este `CLAUDE.md` contra el **estado real** del backend (verificado endpoint a endpoint):
  - Reescrita la mentira *"backend muy verde, solo `register/mod` y `User`"*: el back tiene **47 endpoints en 11 controladores**, JWT real, WebSocket STOMP autenticado, rate limiting (bucket4j), `@RestControllerAdvice` global, membresía de comunidades, chat privado en `/api/chats`, moderación con 3 tipos de reporte, etc.
  - **Purgada la ficción del 2FA `/verify`**: el contrato real es `GET/POST /api/auth/register/mod/2fa/qr` + `POST /api/auth/login/mod/2fa/code` con `challengeId`. Los endpoints `/verify` **nunca existieron**. (Los tipos `VerifyTotpPayload`/`VerifyLoginPayload` de `types/api.ts` quedan como código muerto → Roadmap.)
  - Corregido el stack: **dos repos git independientes**; back sin `lombok`/`oauth2-authorization-server` (quitados) y con `websocket`/`mail`/`bucket4j`/`googleauth`; front con **zustand ^5** (`store/`) + servicios `*WS.ts` sobre `lib/wsClient.ts`.
  - Sustituida la tabla "Endpoints que el frontend ya espera (No)" por el **inventario real cruzado**, marcando 2 desajustes (`events/:id/join` inexistente; tipos `/verify` muertos).
  - Añadida la sección **"Pendientes / Roadmap"** (8 grupos: App Password Gmail, verificación e2e, BD/`ddl-auto`, infra/build, funcional pendiente, pulido/deuda, tests, seguridad producción) como lista activa; el viejo bloque "Cosas pendientes / TODO" queda marcado como histórico.
  - **Solo se tocó documentación** (este `.md`). Ningún cambio de código.

- **2026-05-27** — **Eliminación de simulaciones de backend en el frontend.**

  Tras limpiar los mocks de datos, se eliminó también todo el código que simulaba lógica de servidor:

  - **`lib/totp.ts` y `lib/totp.test.ts` borrados**: generación y validación de secretos TOTP, almacenamiento en localStorage de cuentas de moderador. El back ya implementa los 4 endpoints del flujo 2FA.
  - **`lib/demoMode.ts` borrado**: singleton que rastreaba si la app había caído al mock. Ya sin consumidores.
  - **`lib/env.ts` borrado**: constante `ALLOW_MOCK_FALLBACK` (leída de `VITE_USE_MOCK_FALLBACK`). Ya sin importadores.
  - **`hooks/useDemoMode.ts` borrado**: hook React para el banner de demo mode.
  - **`components/layout/DemoModeBanner.tsx` y `.module.css` borrados**: el banner "Modo demostración" que aparecía cuando el back estaba caído.
  - **`App.tsx`**: quitado el import y el `<DemoModeBanner />`.
  - **`services/storage.ts`**: borrado `modAccountStorage` (almacenaba cuentas TOTP en localStorage) y la clave `sys_mod_account_` del mapa `KEYS`.
  - **`.env`**: eliminada la variable `VITE_USE_MOCK_FALLBACK` (ya no la lee nadie).

  **Estado resultante:** el frontend no contiene ninguna simulación de lógica de servidor. Todos los errores (red, servidor) se propagan al UI.

- **2026-05-27** — **Eliminación completa de mocks. Preparación para backend real.**

  - **`src/mocks/data.ts` eliminado.** Era la única fuente de datos mock (comunidades, eventos, profesionales, historias, botellas, reportes, perfil, chats, etc.).
  - **`useApi` simplificado**: firma cambia de `useApi(fetcher, initialData, mockFallback?, deps?)` a `useApi(fetcher, initialData, deps?)`. El parámetro `mockFallback` desaparece; cualquier error se propaga al UI via `error: string | null`.
  - **12 hooks actualizados** (`useCommunities`, `useCommunityChat`, `useCommunityMembers`, `useDashboardMessages`, `useEvents`, `useFloatingBottles`, `useMapStories`, `useModerationMembers`, `useModerationReports`, `usePrivateChat`, `useProfessionals`, `useProfile`): eliminados los dynamic imports a `mocks/data`.
  - **`AuthContext.tsx` limpiado**: sin mock de usuario anónimo ni de login/register cuando el back está caído. Si el back no responde, `user` queda `null` y las pantallas lo gestionan con el estado de error.
  - **`services/auth.ts` limpiado**: eliminado todo el código de simulación 2FA TOTP del lado cliente (funciones `mockEnrollment`, `mockChallenges` Map, importaciones de `lib/totp.ts`). Los 4 endpoints mod (`registerMod`, `verifyModRegistration`, `loginMod`, `verifyModLogin`) llaman directamente al back sin fallback.
  - **`optimisticMutation.ts` simplificado**: cualquier error (red o servidor) hace rollback y relanza. Eliminado el `ALLOW_MOCK_FALLBACK` que antes dejaba el cambio optimista en sitio en errores de red.
  - **`silentMutation.ts` simplificado**: cualquier error devuelve el mensaje al consumidor. Antes los errores de red se silenciaban en modo demo.
  - **`BottleMessagePage`, `DashboardPage`, `TimeMachinePage`**: eliminadas las ramas `if (isNetworkError(e) && ALLOW_MOCK_FALLBACK)` que simulaban éxito cuando el back estaba caído.
  - **`optimisticMutation.test.ts` actualizado**: el test "network error → no rollback con flag activa" eliminado; ahora todos los errores producen rollback + throw.
  - **`lib/env.ts` y `lib/demoMode.ts` conservados** pero sin consumidores activos — el banner "Modo demostración" ya no aparecerá. Se pueden limpiar en un paso posterior si se decide quitar toda la infraestructura de demo.
  - **`lib/totp.ts` conservado** (el test `totp.test.ts` lo necesita).
  - **TypeScript: sin errores** tras todos los cambios.

- **2026-05-27** — **Segunda auditoría frontend (bloques 1, 2 y 3): bugs, deuda técnica y pulido UX.**

  **Bloque 1 — Bugs:**
  - **B1**: `common.errSend` añadido al i18n (ES/EN/EU) — faltaba la key que usan `CommunityChatPage` y `PrivateChatPage` al fallar el envío.
  - **B2**: `EventDetailPage` corregido el doble conteo de `interestedCount`. El back ya incluye al usuario en el conteo; el front ahora calcula un delta respecto al estado en el primer render (con `useRef(liked)` → `likedOnMount`). Patrón documentado arriba en "Eventos Me interesa".
  - **B3**: `CommunityChatPage` y `PrivateChatPage` — `handleSend` convertido a async/await con `sendError` state (`useState<string|null>`). El error se muestra bajo el `ChatComposer` con `role="alert"`. Clase `.sendError` añadida en ambos `.module.css`.
  - **B4**: `ModLoginPage` y `ModProfileSection` — regex de email corregida de `/[^\s@]+\.[^\s@]+/` a `/[^\s@]+\.[^\s@]{2,}/` (TLD mínimo 2 caracteres).

  **Bloque 2 — Deuda técnica:**
  - **D1**: `lib/initials.ts` — **nuevo fichero** con la función `initials(name: string): string`. Maneja nombres multi-palabra (primera letra de cada palabra, ej. "Juan Díaz" → "JD") y usernames de una sola palabra (primeros 2 caracteres, ej. "joana" → "JO"). Elimina la función duplicada que vivía en `PrivateChatPage` y el `m.username.slice(0, 2)` de `CommunityChatPage`.
  - **D2**: `lib/roles.ts` — añadida `getRoleLabel(role, t)` que centraliza la traducción de roles a etiqueta visible. Elimina el objeto `ROLE_LABEL` de `ProfilePage` y el ternario de `AccountSection`.
  - **D3**: `components/ui/ErrorBoundary.tsx` — **nuevo fichero**, class component con `getDerivedStateFromError`. Envuelve `<BrowserRouter>` en `App.tsx`. Captura errores de render inesperados antes de que colapsen la app.
  - **D4**: `ModerationPage` — `TABS` envuelto en `useMemo([t])` y renombrada variable `.map(t =>` → `.map(tabItem =>` para eliminar el shadow sobre el hook `t = useTranslation()`.
  - **D5**: `BannedWordsSection` — `key={i}` (índice mutable) cambiado a `key={w}` (valor estable, las palabras son únicas).

  **Bloque 3 — UX y pulido:**
  - **U1**: `BottleMessagePage` — los 3 botones de recepción añaden estado `receiving` (disabled + texto "Cargando…" mientras la petición está en vuelo).
  - **U2**: `BannedWordsSection` — el botón "Eliminar" ahora muestra una confirmación inline ("¿Eliminar? [Confirmar] [Cancelar]") en lugar de borrar directamente. Sin `window.confirm()`.
  - **U3**: `DashboardPage` — widget "Mensajes recientes" muestra `<p>` vacío con `t('common.noResults')` si no hay mensajes. `const cat = catFor('/dashboard')` elevado a nivel de módulo como `dashCat` (llamada pura con argumento constante).
  - **U4**: `PrivateChatPage` — muestra `<p>` con `t('privateChat.noMessages')` cuando el historial está vacío.
  - **U5**: `CommunityListPage` — `FILTERS` y `filtered` envueltos en `useMemo` (evita recalcular en cada render).
  - **U6**: `CommunityChatPage` — `backAriaLabel` añadido a ambos `<ChatHeader>` (estado "no encontrado" y estado normal).

  **i18n añadido:** `common.errSend`, `moderation.deleteConfirm`, `privateChat.noMessages` (× 3 idiomas).

- **2026-05-26** — **Auditoría frontend completa (bloques A, B, C). 17 commits, 38 tests verdes.** Tras una auditoría exhaustiva detectando ~50 hallazgos (críticos / altos / medios / bajos), se ejecutaron 3 bloques de trabajo. El usuario decidió mantener `useApi` propio (no migrar a TanStack Query) y conservar `localStorage` para JWT por scope PBL.

  **Bloque A — Crítico:**
  - **A1**: activado `strict: true` + `noUncheckedIndexedAccess` en `tsconfig.app.json` (`exactOptionalPropertyTypes` fuera a propósito — produce ruido en React sin valor real). 9 bugs latentes arreglados en `BannedWordsSection`, `catPalette`, `Select`, `CommunityChatPage`, `MapPage.escapeHtml`, `OnboardingPage`.
  - **A2**: `useApi` cambia firma a `useApi(fetcher, initialData, mockFallback?, deps?)`. Todos los 12 hooks `useX` migrados a `() => import('../mocks/data').then(m => m.MOCK_X)`. **Resultado: con `VITE_USE_MOCK_FALLBACK=false`, `mocks/data.ts` se queda en su propio chunk que NUNCA se descarga** en producción. `MOOD_OPTIONS` movido inline en DashboardPage (no era mock, era config UI).
  - **A3**: borrado el editor de username inline del Navbar y de ProfilePage; la edición vive **solo en `/configuracion > Cuenta`** (fuente única). Esto cierra el bug de la promesa sin manejar en `Navbar.handleUsernameSave`.
  - **A4**: `ModLoginPage` y `ModRegisterPage` pasan a lazy-load. Vite separa `qrcode` (~80KB) + `otpauth` (~10KB) + `lib/totp.ts` del bundle principal.
  - **A5**: `setTimeout` pendientes en `MapPage` y `EventCreatePage` se guardan en un `useRef` y se cancelan en `useEffect` cleanup al desmontar.

  **Bloque B — Arquitectura:**
  - **B1**: nuevos primitivos en `components/ui/`: `Section`, `Card`, `Input`, `FormField`, `Feedback` (error/success), `SaveButton`, `Toggle` (movido de settings/), `ToggleRow`. **8 sub-componentes de `settings/`, 3 de `moderation/`, `EventFormSection` y `TotpPanel` migrados** — ya no importan CSS de su page padre (acoplamiento invertido eliminado). Cada sub-componente con `.module.css` propio. CSS de las pages padre reducido drásticamente (SettingsPage 405 → 137 LOC, ModerationPage 602 → 99 LOC, EventDetailPage 632 → 320 LOC).
  - **B2**: nuevo `components/chat/ChatLayout.tsx` (+ `.module.css`) con sub-componentes exportados: `ChatLayout`, `ChatSidebar`, `ChatSidebarItem`, `ChatSidebarExplore`, `ChatMain`, `ChatHeader`, `ChatMessages` (auto-scroll near-bottom encapsulado), `ChatBubble`, `ChatComposer`, `ChatPanel`. `CommunityChatPage` 234 → 178 LOC, `PrivateChatPage` 247 → 175 LOC. Lógica deduplicada: auto-scroll, back/info, render de burbujas, composer con Enter-sin-Shift.
  - **B3**: nuevo `lib/roles.ts` con `canModerate`, `canAdminister`, `isAnon`, `isLoggedIn`, `MOD_ROLES`. Nuevo `hooks/useRole.ts` con `{ user, isMod, isAdmin, isAnon, isLoggedIn }`. Barridas las 5 duplicaciones de `role === 'MODERATOR' || role === 'ADMIN'` en Navbar, EventListPage, EventDetailPage, SettingsPage.
  - **B4**: nuevo `lib/authBus.ts` con `fireExpired`/`onExpired` y **buffer del último evento** (si el 401 llega antes de que el `AuthProvider` monte, el listener lo recibe en el primer subscribe vía `queueMicrotask`). Sustituye al `window.dispatchEvent(new CustomEvent('auth:expired'))` que era frágil ante race conditions.
  - **B5**: nuevo `services/storage.ts` con sub-objetos tipados: `tokenStorage`, `themeStorage`, `langStorage`, `bannedWordsStorage`, `eventInterestsStorage`, `modAccountStorage`. Errores de quota/private mode silenciados de forma uniforme. **Prohibido `localStorage.*` directo** fuera de este módulo. Migrados 7 archivos; borradas 5 declaraciones duplicadas de `const TOKEN_KEY = 'sys_token'` / `const STORAGE_KEY = 'sys_X'`. `lib/totp.ts` ahora valida shape del JSON guardado (antes `as StoredAccount` sin guard).
  - **B6**: `ModProfileSection` ya no hace dynamic import del MOCK; el seed deriva del `user.username` actual de `useAuth()`. Cada moderador ve **su** username, no "Carlos García" siempre.

  **Bloque C — Calidad:**
  - **C1**: setup de Vitest + jsdom. Scripts `npm test` (run-once) y `npm run test:watch`. 38 tests cubriendo `lib/roles`, `lib/bannedWords` (incluido word-boundary unicode), `lib/optimisticMutation` (con mock de la flag), `lib/totp` (incluido caso de JSON corrupto en storage). `vitest.config.ts` separado del `vite.config.ts`.
  - **C2**: nuevo `lib/silentMutation.ts` que encapsula el patrón "best-effort: network error + flag → demo mode, error de servidor → mensaje". Aplicado en `NotificationsSection`, `PrivacySection` (con rollback visual + Feedback inline), `MapPage.createStory` (con toast de error), `EventListPage` y `EventDetailPage` (markInterest con rollback), `OnboardingPage` (updateUsername + saveOnboarding). **Convención: prohibido `.catch(() => {})` ciego** — usar `silentMutation` o propagar.
  - **C3**: `apiFetch` ahora acepta `ApiFetchOptions` extendido con `timeoutMs?` (default 15s) y `signal?: AbortSignal`. Implementación encadena el `signal` del caller con un `AbortController` interno para el timeout. Reason del timeout es un `ApiError` con `status: 0` (consistente con `isNetworkError`). Cancelaciones explícitas del caller re-lanzan el `AbortError` original. Bonus: solo añade `Content-Type: application/json` si hay body (evita CORS preflight innecesario en GETs).
  - **C4**: `ModRegisterPage`: renombrado `nombre/apellido/empresa/profesion/especializacion` (castellano) → `firstName/lastName/company/profession/specialization` (inglés). Coherente con el resto del codebase.
  - **C5**: nuevos `components/layout/MainLayout.tsx` (Navbar + Outlet + Footer) y `BareLayout.tsx` (Navbar + Outlet). `App.tsx` con rutas anidadas: el Footer aparece solo en pantallas estándar; las pantallas full-viewport (chats, auth) usan BareLayout. Esto soluciona el bug de "el Footer empuja el contenido fuera de viewport en `/comunidades/:id` y `/chat/:id`".
  - **C6**: `MOCK_MESSAGES` y `MOCK_PRIVATE_MESSAGES` sustituidos por funciones `buildMockMessages(communityId)` y `buildMockPrivateMessages(professionalId)` que rotan entre **3 plantillas distintas** por id. Hooks `useCommunityChat` y `usePrivateChat` actualizados.

  **Limpiezas post-C:**
  - `nav.editUsername` borrado del i18n (3 idiomas) — ya no se usa tras A3.
  - `Navbar.module.css`: borradas `.usernameChip`, `.editIcon`, `.usernameInput`.
  - `ProfilePage.module.css`: borradas `.usernameEditRow`, `.usernameInput`, `.usernameSaveBtn`, `.usernameCancelBtn`.

  **Convenciones nuevas tras el audit (todas documentadas arriba):**
  - `strict: true` siempre.
  - Mocks vía dynamic import (no estático).
  - Sub-componentes con CSS propio (no importar del page padre).
  - `useRole()` para checks de rol — no rehacer inline.
  - `authBus` para señalar "sesión expiró" (no `dispatchEvent`).
  - `storage.ts` único punto de `localStorage` (no `localStorage.*` directo).
  - `silentMutation` para mutaciones fire-and-forget (no `.catch(()=>{})`).
  - `ChatLayout` para nuevas pantallas tipo chat.
  - `MainLayout`/`BareLayout` decididos por ruta.
  - `apiFetch` soporta `signal` + `timeoutMs` opcionales.
  - Mocks de chat distintos por id (función `buildMockX(id)`).

  **Decisiones tomadas durante el audit (registradas):**
  - **NO migrar a TanStack Query** ahora — mantener `useApi` propio.
  - **NO bloquear loginMod en modo demo** — útil para enseñar el flujo TOTP completo aunque el back esté caído.
  - **EventCreatePage y EventFormSection se mantienen** — el usuario los conectará al back cuando exista (`POST /api/events`, `POST /api/events/:id/form*`).
  - **Cuando el back tenga 2FA real**: borrar `lib/totp.ts` y los catch del fallback en `services/auth.ts`.
  - **Política ANON/USER**: estilo Pokemon Showdown — anónimo es plenamente funcional; registrarse mantiene el nick + persiste configuración/datos en el back.
  - **`exactOptionalPropertyTypes` fuera** — explícitamente documentado en `tsconfig.app.json`: en React es idiomático pasar `className={maybe}` y activarlo obligaba a ensuciar cada call site sin aportar seguridad real.

  **Pendientes detectados (no resueltos en este audit):**
  - Acceso directo a tokens en `localStorage` sigue siendo el modelo (cookie `HttpOnly` requiere coordinación con el back).
  - Google Fonts CDN (render-blocking + privacy) pospuesto.
  - Símbolos tipográficos Unicode (`✓ ✕ ✎ ➤ ☰ ★`) no migrados a SVG.
  - No hay alias `@/*` en Vite/tsconfig (los imports siguen siendo `../../`).
  - No hay `manualChunks` en `vite.config.ts`.
  - Test coverage solo cubre funciones puras; hooks React no testeados todavía.

- **2026-05-25** — **Armonización backend ↔ frontend del flujo 2FA mod.** Tras el merge `main-backend + main-frontend → main`, el contrato HTTP del back no casaba con el del front Sprint 3. Cambios mínimos en el back para que el flujo de registro + login de moderadores funcione end-to-end contra el back real (sin caer al mock):
  - **6 DTOs nuevos** (records en `src/main/java/shareyourstory/auth/dto/`): `RegisterModEnrollment`, `VerifyTotpRequest`, `LoginModChallengeResponse`, `VerifyLoginRequest`, `AuthResponse`, `UserPublic`.
  - **`RegisterModRequest`** ahora acepta `name, lastName, role (PROFESSIONAL|ADMINISTRATOR con @Pattern), profession?, specialization?`. Los dos últimos se aceptan pero **no se persisten** (el User no tiene los campos — implementarlos sería "implementar algo nuevo", queda como TODO).
  - **`AuthService`**: `registerMod` devuelve `RegisterModEnrollment { secret, otpauthUri, email }` en vez de `int`. Nuevo `verifyModRegistration(VerifyTotpRequest)` valida el primer código TOTP (sin marcar activación todavía). `loginMod` devuelve `LoginModChallengeResponse { challengeId, requires2fa: true }` en vez de `int`; genera UUID y lo persiste en `ConcurrentHashMap<challengeId, ChallengeData>` con TTL 5 min. Nuevo `verifyModLogin(VerifyLoginRequest)` consume el challenge, valida el TOTP, devuelve `AuthResponse { token, user: UserPublic }`. Métodos muertos `register`/`login` borrados.
  - **`AuthController`**: dos endpoints nuevos `POST /api/auth/register/mod/verify` y `POST /api/auth/login/mod/verify`. Los antiguos `POST /2fa/qr` y `POST /2fa/code` (más el `GET /2fa/qr`, `/testJWT`, `/mailTest`) se mantienen vivos por si algún cliente externo los usa (decisión del usuario). `@ExceptionHandler` locales: `BadCredentialsException → 401`, `DataIntegrityViolationException → 409`.
  - **Bug fix colateral**: `TimeMachine.java` no compilaba (usaba `@Getter/@Setter` de Lombok pero Lombok está comentado en `pom.xml`). Sustituido por getters/setters a mano según convención. El bug lógico de `TimeMachineService.createTimeMachine` (asigna `deliveryDate` al `email`) sigue sin corregir — no bloquea porque el front no llama a ese endpoint.
  - **Decisiones tomadas durante la armonización (documentadas como deuda en TODOs):**
    - **`challengeId = UUID + Map en memoria con TTL 5 min**, no `email`. Más seguro que el atajo "email-como-challengeId". Cuando se vaya a producción, mover a Redis o tabla.
    - **`code` viaja como `String`** en los DTOs nuevos (no `int`) — robusto frente a códigos `"000123"` y consistente con lo que envía el front. Se parsea a `int` en `AuthService.parseCode`.
    - **No se añade `@ControllerAdvice` global**, solo `@ExceptionHandler` dentro del `AuthController` (alcance mínimo).
    - **No se borra la clase vieja `RegisterRequest`** (no record, distinta de `RegisterModRequest`) — queda como código muerto post-merge, pero borrarla excede lo necesario.
  - **Estado tras la armonización**: el flujo mod (registro + login con 2FA) funciona contra el back real. El resto de endpoints que el front llama (`/api/auth/anonymous`, `/api/auth/login`, `/api/users/me/*`, `/api/communities/*`, etc.) NO existen en el back — el front sigue cayendo al mock para ellos. Para probar de verdad el flujo mod: `VITE_USE_MOCK_FALLBACK=false` en `frontend/.env` (que NO caiga al mock), arrancar back con devcontainer, ir a `/modregister` → crear cuenta → escanear QR con Google Authenticator → introducir código → ir a `/loginmod`.
- **2026-05-25** — **Gatos durmientes (SleepingCat) en todas las pantallas.** Componente reutilizable `components/ui/SleepingCat.tsx` (+ `.module.css`) con SVG dibujado a mano estilo infantil (trazo grueso 2.6px, `stroke-linecap=round`, fill suave con opacity 0.14, filtro SVG `feTurbulence + feDisplacementMap` para wobble por seed). API: `<SleepingCat color size={120} seed={n} interactive />`. Animaciones CSS: respiración del cuerpo (scaleY 1.045, 4.2s loop), wag de cola (3 oscilaciones cada 8s con `animation-delay` por seed para desincronizar entre gatos), y al hacer click `awake` durante 1.8s (ojos abren un poco con dos ellipses + cabeza se ladea -4°). Respeta `prefers-reduced-motion`. Helper `components/ui/catPalette.ts` con 16 colores pastel "crayola" y `catFor(routeKey)` que mapea cada pantalla a `{color, seed}` determinista. Convenciones:
  - **Cada pantalla tiene UN gato** apoyado en un divisor/borde real del layout (border-bottom de un header, top de una sección, borde superior de una card). Patrón CSS: el padre tiene `position: relative`; el gato se posiciona absoluto (`bottom: 0` para apoyarse en un border-bottom, `bottom: 100%` para apoyarse en el top de la card desde fuera).
  - **Tamaños**: landing = grande (300px); headers de páginas internas = 88-110px; sidebars de chats = ~72px.
  - **Modo oscuro**: el SVG aplica `filter: brightness(1.05) saturate(0.88)` automáticamente vía `:global([data-theme='dark'])` para que los pasteles funcionen sobre fondos oscuros sin perder identidad. No hace falta tocar nada por pantalla.
  - **Si añades una pantalla nueva**: añade su ruta al map `ROUTE_CATS` en `catPalette.ts` con un color libre y un seed entero único, y coloca el `<SleepingCat>` apoyado en algún divisor real.
- **2026-05-21** — Creación inicial del fichero tras análisis completo del repo.
- **2026-05-21** — Arreglados bugs del backend en `/api/auth/register/mod`: typo `passowrd → password`, asignación de `role` (validado por `@Pattern`), respuesta 204 No Content. Frontend `ModRegisterPage` ahora tiene dos pestañas (Moderador / Administrador); admin no pide `company`. `RegisterModPayload` añade `role: 'PROFESSIONAL' | 'ADMINISTRATOR'`. Añadida regla de workflow: explicar cambios + dar comandos de commit al terminar.
- **2026-05-21** — Devcontainer: HMR activado con `server.watch.usePolling` en `vite.config.ts`. `.gitattributes` reescrito para forzar LF en todo el repo (`* text=auto eol=lf`) y evitar el problema de falsos "modificados" al usar el bind mount Windows→Linux. Toca renormalizar el working tree con `git add --renormalize .`.
- **2026-05-22** — `EventDetailPage`: los moderadores (`MODERATOR`/`ADMIN`) pueden crear un formulario por evento debajo de la descripción. Dos tipos: opción múltiple (radio + resultados con %) o texto libre (textarea + lista de respuestas). Único por evento, estado totalmente local en el componente (sin localStorage ni API), TODOs marcados para los futuros endpoints `POST/DELETE /api/events/:id/form`, `POST .../vote`, `POST .../response`.
- **2026-05-22** — `ModRegisterPage`: la pestaña Moderador añade dos selects opcionales **Profesión** (Psicólogo/Terapeuta/Psiquiatra) y **Especialización** (Ansiedad/Depresión/Estrés/Duelo/Autoestima/Relaciones). Listas hardcodeadas en el componente; tipos `Profession`/`Specialization` y campos opcionales en `RegisterModPayload` (`frontend/src/types/api.ts`). Solo se envían si el usuario los elige. **El backend los ignora** silenciosamente (no están en `RegisterRequest`). La pestaña Administrador no los muestra.
- **2026-05-22** — Nuevo componente reutilizable `components/ui/Select.tsx` (+ `.module.css`). Dropdown custom genérico `Select<T extends string>` con panel flotante redondeado, hover lavanda, navegación con teclado (Arriba/Abajo/Enter/Escape), cierre al clicar fuera. Reemplaza los `<select>` nativos en `ModRegisterPage`. Usar este componente cuando se necesite un dropdown estilizado en lugar del nativo.
- **2026-05-22** — `ModerationPage` sección "Filtro automático": las 4 stat cards anteriores se sustituyen por un CRUD de palabras prohibidas con vista previa de la censura (`puta` → `p***`). Añadir/editar/borrar es 100% estado local en el componente (`INITIAL_BANNED_WORDS = ['puta','idiota','imbécil','tonto']`); sin persistencia ni backend todavía. TODOs con los endpoints futuros añadidos en este fichero y comentarios `TODO:` en `ModerationPage.tsx`.
- **2026-05-22** — **Auditoría frontend completa**. Tres tareas grandes aplicadas tras discutir decisiones con el usuario:
  - **Tarea 1 (refactor mocks unificados):** `mocks/data.ts` es ahora única fuente de verdad. Borrados los mocks inline de `DashboardPage`, `CommunityChatPage`, `ProfilePage`, `ModerationPage` (tabla miembros), `BottleMessagePage`. Añadidos: `MOCK_PINNED_NOTES`, `MOCK_JOINED_COMMUNITY_IDS`, `MOCK_UNREAD_COUNTS`, `MOCK_DASHBOARD_MESSAGES`, `MOCK_DASHBOARD_EVENT`, `MOCK_TIP`, `MOOD_OPTIONS`, `MOCK_CHAT_MEMBERS`, `MOCK_BOTTLE_STORIES`, `MOCK_MOD_MEMBERS`. `MOCK_COMMUNITIES` ampliado a 7 ítems (incluye id 7 = "Noches difíciles"). `ApiProfile.stats` añade `messages: number`. `ProfilePage` ahora conecta con `useProfile()` (antes lo ignoraba). `CommunityChatPage` muestra "Comunidad no encontrada" si el id no existe (antes hacía fallback silencioso a la id 1). Auto-scroll del chat solo se dispara si el usuario está cerca del fondo (deja de secuestrar la lectura del historial). `useCommunityChat` atribuye los mensajes "propios" del mock al usuario actual.
  - **Tarea 2 (servicios reales + traducción de roles):** `services/api.ts` distingue network error (status 0, helper `isNetworkError`) de error de servidor. El 401 fuera de `/api/auth/*` dispara un `CustomEvent('auth:expired')` en lugar de `window.location.href = '/'`. `services/auth.ts` añade capa de traducción `BackendRole ↔ UserRole` interna (PROFESSIONAL→MODERATOR, ADMINISTRATOR→ADMIN); los tipos del back no salen de esta capa. `AuthContext` llama al backend real con fallback al mock solo en network errors; los errores de servidor propagan a la UI. **Borrada** la lógica `username.startsWith('admin') → ADMIN` (privilege escalation). Nuevo helper genérico `hooks/useApi.ts` con state-en-objeto (compatible con la regla `react-hooks/set-state-in-effect` de ESLint v10). Los 6 hooks `useX` pasan a 4 LOC cada uno. `useCommunityChat` con GET real, fallback y optimistic update con rollback solo en errores de servidor. `EventDetailPage` pasa a usar `useEvents()` + `.find(id)` derivado en vez de setState en useEffect. `SettingsPage`: useEffect → useState lazy init. Bug fix: `modSaved` ya no se activa cuando `updateModProfile` falla.
  - **Tarea 3 (emojis pictográficos → SVG):** `components/ui/Icons.tsx` ampliado con 11 iconos nuevos (`IconShield`, `IconHand`, `IconLock`, `IconQuestion`, `IconCalendar`, `IconClock`, `IconUser`, `IconUsers`, `IconChat`, `IconMap`, `IconBottle`, `IconHeart` con prop `filled`, `IconDot` con prop `color`). Sustituidos en `Footer` (🔒), `EventDetailPage` (🛡️ ✋ 🔒 ❓ 📅 ⏱️ 👤 ❤️ 🤍), `EventListPage` (❤️ 🤍), `ProfessionalsPage` (🟢 🟠), `ProfilePage` timeline (mapping semántico). El color del corazón pasa de `#e74c3c` (rojo crudo) a `var(--peach)` para encajar con la paleta. Símbolos tipográficos monocromos (`✓ ✕ ✎ ➤ ☰ ★ ½`) se mantienen como texto (no son emojis pictográficos). Eliminado el re-export muerto `Event` de `EventListPage`.
  - **Decisiones de la auditoría que quedan documentadas como convenciones:** servicios reales con fallback al mock solo en network errors; traducción de roles vive en `services/auth.ts`; mocks centralizados en `mocks/data.ts`; emojis pictográficos prohibidos (SVG dedicado); iconos a mano en `Icons.tsx` (no `lucide-react`); `useApi` como helper canónico de data fetching.
  - **Queda pendiente del Sprint 1 de la auditoría:** route guards (`<RequireRole>`), `<NotFound>`, `.env.example`, eliminar features que mienten (Idioma, Modo oscuro próximamente, Mood selector sin persistencia, Modo compacto), decidir política de token storage, implementar `PrivateChatPage` o deshabilitar entrada, romper god components, `@fontsource/inter`, lazy loading por ruta, quitar `react-bootstrap`.
- **2026-05-22** — `DashboardPage`: borrado el widget "Consejo del día" (y el mock `MOCK_TIP` + interface `ProfessionalTip` en `mocks/data.ts` + clases `.tip*` en `DashboardPage.module.css`). El selector de mood pasa de emojis solo-texto a SVG line-art en `components/ui/Icons.tsx` (`IconMoodVeryBad/Bad/Neutral/Good/VeryGood`); la fila se centra (`.moodRow` con `justify-content: center` + `max-width: 560px`) y `.moodSection` apila columna centrada en todos los breakpoints (antes pasaba a fila con la confirmación al lado en ≥576px).
- **2026-05-22** — **Alcance de chat aclarado:** el chat 1 a 1 (`PrivateChatPage`, `/chat/:professionalId`) es **solo entre un usuario y un profesional**. **No hay chats privados entre usuarios anónimos**: comunidad = grupal moderado; botella = anónimo one-shot. Ruta renombrada de `:userId` a `:professionalId`. `PrivateChatPage` placeholder, subtítulo de `ProfessionalsPage` y entradas correspondientes de `readme-frontend.md` actualizadas. El usuario confirmó que cualquier rol (incluso ANON) puede iniciar el contacto — no se necesita guard de rol específico para esta ruta.
- **2026-05-23** — **Navbar: comportamiento del username según sesión.** Se calcula `isLoggedIn = !!user && user.role !== 'ANON'` en `components/layout/Navbar.tsx`. Si **ANON**: chip editable con lápiz (comportamiento previo). Si **USER/MODERATOR/ADMIN** (cualquiera de los tres): aparece un botón circular con `IconUser` (34×34, clase `.dashboardBtn`) que navega a **`/configuracion`**, seguido del nombre como botón con texto estático (clase `.usernameStatic`, sin lápiz) que navega a **`/dashboard`**. Los dos cierran el menú móvil si estaba abierto. Aplicado tanto en `.right` (desktop) como en `.mobileBottom` (móvil). El cambio de username de un usuario logueado tendrá que hacerse desde `/configuracion` o `/perfil` (todavía no implementado). **No se cambian los `NAV_LINKS` aún** — todos los roles ven los seis enlaces actuales; los enlaces dependientes del rol (Moderación, ocultar enlaces de ANON para MOD/ADMIN) y la ocultación del botón "Entrar" cuando hay sesión siguen pendientes.
- **2026-05-23** — **Modo oscuro** activable desde `/configuracion → Apariencia`. Nuevo módulo `frontend/src/lib/theme.ts` con `getInitialTheme/applyTheme/setTheme` (clave en `localStorage`: `sys_theme`). `main.tsx` aplica el tema antes del primer render (`applyTheme(getInitialTheme())`) para evitar parpadeo. La primera vez respeta `prefers-color-scheme` del SO; después prevalece la elección del usuario. `variables.css` añade un bloque `[data-theme="dark"]` que sobreescribe todas las CSS variables manteniendo los mismos nombres — el resto del CSS no cambia (paleta lavanda preservada, fondos `--bg #13111E` / `--white #1D1A2E`, texto `--dark #EDEAF6`). `Footer.module.css` añade overrides con `:global([data-theme="dark"])` para que el footer no se invierta (en oscuro: bg `#100E1A` y texto `var(--dark)`). Fix puntual: `BottleMessagePage` popup pasa de `background: #fff` hardcodeado a `var(--white)`. Toggle "Modo oscuro" añadido en la sección Apariencia de `SettingsPage`; se elimina el texto "Modo oscuro próximamente". **Convención nueva:** al añadir CSS, usar siempre `var(--...)`; si un componente necesita comportamiento "invertido" en oscuro (como el Footer), usar `:global([data-theme="dark"])` en su `.module.css`.
- **2026-05-25** — **Sprint 3 aplicado: PrivateChat funcional + Navbar role-dependent + company para ADMIN + i18n completo.**
  - **PrivateChatPage funcional con mock:** chat 1 a 1 entre usuario y profesional. Hook `usePrivateChat(professionalId)` (patrón `useApi` + `optimisticMutation`). Service `services/chats.ts` con `getPrivateChat` / `sendPrivateMessage`. Mock `MOCK_PRIVATE_MESSAGES` genérico (4 mensajes seed) en `mocks/data.ts`. Tipo `ApiPrivateMessage` con `from: 'user' | 'professional'` en `types/api.ts`. CSS limpio en `PrivateChatPage.module.css` (burbujas alineadas izda/dcha, auto-scroll solo si está cerca del fondo, censura aplicada con `maskBannedWords`, header con avatar + nombre + especialidad, not-found state). Botón "Contactar" de `ProfessionalsPage` reactivado.
  - **Navbar role-dependent:** MOD/ADMIN ven solo Moderación + Comunidades + Eventos + Profesionales (no Mapa/Botella/Máquina del tiempo). ANON/USER mantienen los 6 enlaces actuales. Botón "Entrar" oculto cuando `isLoggedIn`. Nueva key `nav.moderacion` en los 3 idiomas.
  - **Ocultar `company` para ADMIN en ModProfileSection:** `ApiModProfile.company` ahora opcional. `FIELDS` se construye como `BASE_FIELDS + (isAdmin ? [] : [COMPANY_FIELD])`. Mismo patrón que `ModRegisterPage` desde Sprint 2.
  - **i18n cobertura completa:** todas las pantallas internas traducidas. Namespaces: `common`, `nav`, `footer`, `landing`, `dashboard`, `onboarding`, `login`, `communities`, `events`, `professionals`, `privateChat`, `map`, `bottle`, `time`, `profile`, `moderation`, `modLogin`, `modRegister`, `notFound`, `settings`. ~280 keys por idioma. Patrón establecido: definiciones tipo `STEPS = [...]` o `FILTERS = [...]` que antes vivían en module scope ahora dentro del componente para acceder a `t()`. Interpolación con `{{var}}` en placeholders (TimeMachine, PrivateChat).
  - **Convenciones nuevas:**
    - **i18n al añadir pantalla nueva:** crear un namespace en `lib/i18n.ts` con las 3 traducciones. No dejar strings hardcoded en JSX.
    - **Arrays que dependen de `t()` van dentro del componente**, no en module scope. Si son grandes, considerar `useMemo`.
    - **`SPECIALTY_LABELS` y mapeos similares** que asocian un valor del back a una traducción → dentro del componente para acceder a `t()`. Reutilizado en `ProfessionalsPage` y `PrivateChatPage`.
- **2026-05-24** — **Auditoría completa + Sprint 1 + Sprint 2 aplicados.**
  - **Audit:** se hizo una auditoría profunda (arquitectura, código, React, UX, seguridad, CSS, performance, coherencia). Diagnóstico: la app le miente al usuario sistemáticamente (fallback silencioso al mock, errores silenciados en envíos, features que simulan funcionar). Decisiones del usuario: back conectado en 1-2 semanas; privacidad = marketing; mood "conectar a back ahora"; idioma "i18n mínimo Español/English/Euskera"; modo compacto "borrar"; like de eventos "persistir + contador".
  - **Sprint 1 (10 tareas):**
    - **Bugs:** corregido `joinedSet` de CommunityListPage (el leave sobre `joined:true` no se veía); sanitizado `emoji` en `divIcon` de Leaflet (XSS latente); bundleados iconos de Leaflet locales (antes unpkg).
    - **Seguridad/UX:** `<RequireRole>` en `/moderacion`, `/modregister` (redirect a `/loginmod`), `/eventos/nuevo`; `<NotFoundPage>` con catch-all `*`; botón "Contactar" en `ProfessionalsPage` deshabilitado con label "Próximamente".
    - **Honestidad:** flag `VITE_USE_MOCK_FALLBACK` (`lib/env.ts`) — solo cae al mock si está activo; banner global "Modo demostración" (`components/layout/DemoModeBanner.tsx` con store en `lib/demoMode.ts` + hook `useDemoMode`); errores propagados en `sendBottle`, `sendLetter`, `updateUsername` (antes silenciados).
    - **Filtro de palabras:** `lib/bannedWords.ts` con CRUD + persistencia local + `maskBannedWords(text)` regex unicode-aware; hook `useBannedWords` con `useSyncExternalStore`; aplicado al renderizar en CommunityChatPage, DashboardPage, BottleMessagePage popups y MapPage popups.
    - **Bundle:** quitados `react-bootstrap`, `bootstrap`, `sass`. `PageState` reescrito con spinner CSS propio (~80KB menos en el bundle).
  - **Sprint 2 (12 tareas):**
    - **Mecánicos:** lazy load `/mapa` y `/moderacion` con `React.lazy + Suspense`; `_setUserFromToken` removido del context y sustituido por `loginAsMod`; `useCommunityChat` reescrito con `useApi + optimisticMutation` (de 86 LOC a 43); `MOCK_*` importados directamente en componentes sustituidos por hooks (`useCommunityMembers`, `useDashboardMessages`, `useFloatingBottles`, `useModerationMembers`). Campos `unread` y `pinnedNote` movidos a `ApiCommunity`; tipos `ChatMember`, `DashboardMessage`, `ModMember`, `BottleStory` renombrados a `ApiChatMember`/etc. y movidos a `types/api.ts`. Borrados `MOCK_JOINED_COMMUNITY_IDS`, `MOCK_UNREAD_COUNTS`, `MOCK_PINNED_NOTES`, `MOCK_DASHBOARD_EVENT` (este último: DashboardPage ahora usa `useEvents().data[0]`).
    - **Features que mienten (decisiones caso a caso):** **mood selector** ahora llama a `POST /api/users/me/mood` (`submitMood` en `services/profile.ts`) con propagación de errores y demo mode; **selector de idioma** sustituido por i18n real con `i18next + react-i18next` (Español/English/Euskera, persistido en `sys_lang`, init antes del primer render); **modo compacto** borrado (toggle eliminado); **like de eventos** ahora persiste en `localStorage` (`lib/eventInterests.ts` con `toggle/isInterested`) y muestra contador `interestedCount + (interested ? 1 : 0)` junto al corazón en `EventListPage` y `EventDetailPage`. `MOCK_EVENTS` extendido con `interestedCount` por evento.
    - **God components rotos:**
      - `SettingsPage`: 436 LOC → 90 LOC. 8 sub-componentes en `components/settings/` (`AccountSection`, `ModProfileSection`, `PrivacySection`, `NotificationsSection`, `AppearanceSection`, `LanguageSection`, `SecuritySection`, `HelpSection`) + `Toggle` movido aquí. Hook `useSavedFlash` extraído para el patrón "✓ Guardado" temporal.
      - `ModerationPage`: 349 LOC → 47 LOC. 3 sub-componentes en `components/moderation/` (`ReportsSection`, `MembersSection`, `BannedWordsSection`).
      - `EventDetailPage`: 435 LOC → 148 LOC. Formulario embebido extraído a `components/events/EventFormSection.tsx` (encapsula editor + view + voting + text responses).
    - **Inline styles → CSS Modules** en `BottleMessagePage` (img bottle), `CommunityChatPage` (not-found state), `MapPage` (cursor crosshair vía className), `ModRegisterPage` (success block), `ProfilePage` (prefLabel capitalize), `SettingsPage` (campo error/success, password fields). Solo quedan `width: ${pct}%` (dinámico) en EventFormSection y `padding: '2rem'` en el placeholder de PrivateChatPage.
    - **i18n:** infraestructura completa + traducción de Navbar, Footer, LandingPage hero, DashboardPage banner, LoginPage, SettingsPage (sidebar + Idioma). El resto de pantallas internas queda en español hardcoded hasta Sprint 3.
  - **Convenciones nuevas (todas documentadas arriba):** flag `VITE_USE_MOCK_FALLBACK`, `markDemoMode`, stores singleton vía `useSyncExternalStore`, `optimisticMutation`, errores de escritura siempre propagados, `<RequireRole>` para rutas restringidas, `<NotFoundPage>` + catch-all, lazy-load por `React.lazy`, `maskBannedWords` en cualquier surface con texto de usuario, i18n con `t()`, persistencia local con keys `sys_*`, sub-componentes en `components/<area>/`, `useSavedFlash`, contador `interestedCount + propio`.
- **2026-05-23** — **Modo oscuro: ajustes en islas temáticas y pills semánticos.** Cuatro pasadas posteriores sobre el rollout del dark mode:
  - **`/botella` ("océano de noche")** — `BottleMessagePage.module.css`: bg de la página, olas (SVGs inline con fills `#1b3a5a`/`#244a6b`), header, textarea, botones enviar/recibir, popup overlay y sombras de las botellas flotantes pasan a una paleta azul profundo. El botón "Lanzar al mar" deshabilitado se sobreescribe específicamente a `bg #1F2A3A` + texto `#6F8AA8` para evitar el contraste pobre de `var(--border)`/`var(--lite)` sobre el bg azul oscuro.
  - **`/maquina-del-tiempo` ("pergamino de noche")** — `TimeMachinePage.module.css`: el papel cream `#fffdf7` (`.paperWrapper`, `.confirmBox`) pasa a `#26211B` (marrón oscuro cálido, distinguible del card lavanda); las líneas del papel pasan a un tinte melocotón faint (`rgba(245,168,130,0.10)`) en lugar de lavanda.
  - **Pills semánticos** — `ProfessionalsPage`, `CommunityListPage`, `ModerationPage`. Patrón establecido: en oscuro los pills/botones con color semántico se sobreescriben a "bg profundo + texto pastel claro":
    - **Verde** (en línea, disponible ahora, resuelto): `bg #163524` + texto `#7ED9A1`
    - **Ámbar** (hoy/16:00, pendiente, reportes, Avisar): `bg #3A2917` + texto `#F0B86B`
    - **Rojo** (Banear): `bg #3B1A1A` + texto `#F08A86`
    - Clases afectadas: `.pillNow`, `.pillToday`, `.onlinePill`, `.pill_pending`, `.pill_resolved`, `.actionBtnResolve`, `.actionBtnWarn`, `.memberReports`, `.warnBtn`, `.banBtn`. Para `.pill_resolved` y `.actionBtnResolve` solo se cambia el `color:` porque el bg ya viene de `var(--green-lt)` (que `variables.css` redefine para oscuro a `#1F2F22`).
  - **Pendiente similar (no tocado todavía)**: `.actionBtnDismiss` (gris) y la sección filtro de moderación con `#fff4e5`/`#fff0ee` (statBox warn, filterActionBtn). Si se tocan, aplicar el mismo patrón ámbar.
  - **Convención nueva (paleta de pills semánticos en oscuro):** los tres tríos (verde/ámbar/rojo) de arriba quedan como referencia para futuros pills con tinte de color. No usar el verde `#2d7d46` o el ámbar `#b45309` directamente sobre los fondos `--green-lt`/`#fff4e5` del modo claro sin pensar en su versión oscura.
- **2026-05-25** — **2FA TOTP (Google Authenticator) en el flujo de moderadores/administradores.** Implementado contra un contrato HTTP definido como si el back ya lo soportara; mientras tanto el front simula el lado servidor con la lib `otpauth`.
  - **Libs nuevas:** `otpauth` (~10KB, genera/valida TOTP) y `qrcode` + `@types/qrcode` (renderiza QR a data URL).
  - **Contrato HTTP nuevo** (en `types/api.ts`): `RegisterModEnrollment { secret, otpauthUri, email }`, `LoginModChallenge { requires2fa, challengeId }`, `VerifyTotpPayload { email, code }`, `VerifyLoginPayload { challengeId, code }`. Endpoints: `POST /api/auth/register/mod` ahora devuelve `RegisterModEnrollment` (antes 204), `POST /api/auth/register/mod/verify` (nuevo), `POST /api/auth/login/mod` ahora devuelve `LoginModChallenge` (no token), `POST /api/auth/login/mod/verify` (nuevo, devuelve `AuthResponse`).
  - **Mock TOTP server-side** en `frontend/src/lib/totp.ts`: `generateMockEnrollment(email, username, role)` crea un secreto Base32 con `OTPAuth.Secret`, construye el `otpauth://` URI (issuer `ShareYourStory`, label = email, SHA1/6/30), guarda `{ id, username, role, secret }` en `localStorage` con clave `sys_mod_account_<email>`. `verifyMockCode(email, code)` valida con `totp.validate({ window: 1 })`. El challenge del login se guarda en una `Map<challengeId, {email}>` en memoria de `services/auth.ts` (si recargas entre paso 1 y 2, se pierde — comportamiento esperado en 2FA).
  - **AuthContext:** `loginAsMod(email, password)` ya no loguea — devuelve `LoginModChallenge`. Nuevo método `verifyLoginAsMod(challengeId, code)` que valida el TOTP y sí setea la sesión. Patrón "dos pasos" delegado a la página, que controla la fase con un `useState<'credentials'|'totp'>`.
  - **Componente reutilizable:** `components/auth/TotpPanel.tsx` (+ `.module.css`). Acepta prop opcional `enroll: {secret, otpauthUri}` — si está, renderiza QR (vía `QRCode.toDataURL`, 220×220) + botón "¿No puedes escanear?" que despliega el secreto Base32. Si no, solo el input de 6 dígitos. Input con `inputMode="numeric"`, `autoComplete="one-time-code"`, regex que filtra a dígitos y trunca a 6. Submit deshabilitado hasta tener 6 dígitos. Errores se renderizan inline; el input se vacía y refoquea tras error.
  - **ModRegisterPage:** ahora con state machine `phase: 'form'|'enroll'|'success'`. Form → submit → registerMod devuelve enrollment → fase enroll con TotpPanel → verifyModRegistration → fase success (igual que antes). Botón "Volver al formulario" cancela el enrolamiento en cualquier momento.
  - **ModLoginPage:** state machine `phase: 'credentials'|'totp'`. Credentials → loginAsMod devuelve challengeId → fase TOTP con TotpPanel sin `enroll` → verifyLoginAsMod → navega a `/moderacion`. Botón "Volver" reinicia el flujo.
  - **i18n:** namespace nuevo `totp` con ~14 keys × 3 idiomas.
  - **Convenciones nuevas:**
    - **Flujos de auth con 2FA = state machine en la página, no en el contexto.** El AuthContext expone primitivas `loginAsMod` y `verifyLoginAsMod`; la página orquesta los pasos con un `useState<Phase>`. Patrón replicable si se añade 2FA al login de usuarios normales más adelante.
    - **Cuando el back asuma el 2FA:** los `catch (e) { if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e; ... }` de `services/auth.ts` siguen funcionando sin tocar. `lib/totp.ts` queda como código muerto y se puede borrar.

---

## gstack (equipo de IA por slash commands)

Este repo usa **gstack** cuando se abre Claude Code **desde WSL** (las skills viven en `~/.claude/skills/gstack` del Ubuntu, no en el home de Windows; en una sesión de Windows nativo NO están disponibles).

- **Navegación web:** usa `/browse` de gstack. **No** uses las herramientas `mcp__claude-in-chrome__*`.
- **Skills disponibles:** `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/cso`, `/investigate`, `/autoplan`, `/learn`, `/gstack-upgrade`.
- **Testeo en navegador real:** `/qa http://localhost:5173` (frontend Vite). Backend en `:8080`, MySQL en `:3306` (devcontainer). Para solo reportar sin tocar código: `/qa-only`.
- **gstack NO anula las reglas de este fichero.** Castellano, sin emojis en la UI, diseños simples, preguntar ante ambigüedad, y al terminar dar los comandos de commit (sin commitear automáticamente) — todo sigue vigente dentro de cualquier skill.
