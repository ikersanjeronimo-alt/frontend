import type {
  ApiCommunity,
  ApiEvent,
  ApiStory,
  ApiProfessional,
  ApiReport,
  ApiProfile,
  ApiMessage,
  ApiModProfile,
  ApiChatMember,
  ApiDashboardMessage,
  ApiBottleStory,
  ApiModerationMember,
  ApiPrivateMessage,
} from '../types/api'

// ── Comunidades ─────────────────────────────────────────────
// Única fuente de verdad. IDs 1-7 consistentes entre /comunidades, /dashboard y /comunidades/:id
// joined/unread/pinnedNote vienen embebidos: simulan lo que el back devolverá
// para el usuario actual.
export const MOCK_COMMUNITIES: ApiCommunity[] = [
  { id: '1', emoji: '', name: 'Ansiedad sin filtros',  mod: 'Dra. García',   desc: 'Un espacio para hablar sin miedo de lo que nos bloquea día a día.',         members: 234, online: 14, category: 'ansiedad',    joined: true,  unread: 3, pinnedNote: 'Recuerda: este es un espacio seguro. Respeta a los demás y no des consejos médicos sin ser profesional.' },
  { id: '2', emoji: '', name: 'Creciendo juntos',      mod: 'Psic. Martín',  desc: 'Autoestima, límites y aprender a quererse a uno mismo.',                    members: 189, online: 8,  category: 'autoestima',  joined: true,             pinnedNote: 'Esta semana el reto es: di algo positivo sobre ti mismo/a. ¡Empieza tú!' },
  { id: '3', emoji: '', name: 'Mar en calma',          mod: 'Dr. López',     desc: 'Mindfulness y técnicas de relajación para el estrés cotidiano.',            members: 312, online: 21, category: 'mindfulness', joined: false,            pinnedNote: 'Comparte tu técnica de relajación favorita: una respiración, una visualización, un sonido que te ancle.' },
  { id: '4', emoji: '', name: 'Duelo y pérdida',       mod: 'Psic. Ruiz',    desc: 'Acompañamiento en el proceso de duelo y la aceptación.',                    members: 97,  online: 4,  category: 'duelo',       joined: false,            pinnedNote: 'Si estás en crisis, por favor contacta al teléfono de la esperanza: 717 003 717. Siempre hay alguien.' },
  { id: '5', emoji: '', name: 'Relaciones sanas',      mod: 'Dr. Moreno',    desc: 'Comunicación, apego y relaciones que nos nutren.',                          members: 421, online: 35, category: 'relaciones',  joined: false,            pinnedNote: 'Antes de responder, pregúntate: ¿esto le servirá a quien lo escribe?' },
  { id: '6', emoji: '', name: 'Quema el estrés',       mod: 'Psic. Torres',  desc: 'Estrategias prácticas para gestionar el estrés laboral y personal.',        members: 156, online: 9,  category: 'estres',      joined: false,            pinnedNote: 'Si vienes de un día duro de trabajo: respira tres veces antes de escribir. Aquí no hay urgencias.' },
  { id: '7', emoji: '', name: 'Noches difíciles',      mod: 'Dra. Torres',   desc: 'Activa de noche. Porque a veces los pensamientos más pesados llegan cuando oscurece.', members: 167, online: 31, category: 'ansiedad', joined: true,  unread: 7, pinnedNote: 'Aquí siempre hay alguien despierto/a. No estás solo/a esta noche.' },
]

// ── Mensajes de chat de comunidad ──────────────────────────
// 3 plantillas de hilo, una por temática general. El communityId se mapea por
// índice para que cada comunidad muestre un hilo distinto en demo — antes
// todas las comunidades veían el MISMO chat, rompiendo la inmersión.
const MESSAGE_THREADS: ApiMessage[][] = [
  [
    { id: '1', username: 'LunaSerena12', text: 'Hola a todos. Hoy ha sido un día difícil pero estoy aquí.',                  time: '18:42', own: false },
    { id: '2', username: 'MarOscuro44',  text: 'Ánimo Luna, ya el hecho de estar aquí cuenta muchísimo.',                    time: '18:44', own: false },
    { id: '3', username: 'anonimo7831',  text: 'Exacto. Yo también llevo unos días complicados.',                            time: '18:45', own: true  },
    { id: '4', username: 'RayoVerde99',  text: '¿Qué os ha ayudado a vosotros cuando todo se acumula?',                      time: '18:47', own: false },
    { id: '5', username: 'LunaSerena12', text: 'A mí salir a caminar aunque solo sean 10 minutos. Despeja mucho la cabeza.', time: '18:49', own: false },
    { id: '6', username: 'MarOscuro44',  text: 'La música. Siempre la música.',                                              time: '18:50', own: false },
    { id: '7', username: 'anonimo7831',  text: 'Gracias chicos, me alegra no estar solo en esto.',                           time: '18:51', own: true  },
  ],
  [
    { id: '1', username: 'CieloAzul23', text: 'Llevo toda la semana intentando dormir antes de las 2 y no lo consigo.',        time: '23:14', own: false },
    { id: '2', username: 'VientoSur77', text: 'Te entiendo. ¿Has probado a dejar el móvil en otra habitación?',                time: '23:16', own: false },
    { id: '3', username: 'anonimo7831', text: 'A mí me ayudó leer en papel un rato antes de apagar la luz.',                   time: '23:18', own: true  },
    { id: '4', username: 'CieloAzul23', text: 'Lo del móvil aún no. Lo intento esta noche.',                                   time: '23:19', own: false },
    { id: '5', username: 'VientoSur77', text: 'Cuéntanos qué tal mañana ✊',                                                    time: '23:20', own: false },
  ],
  [
    { id: '1', username: 'RayoVerde99', text: 'Pregunta para el grupo: ¿cómo gestionáis cuando alguien os pide perdón mal?',    time: '12:05', own: false },
    { id: '2', username: 'LunaSerena12', text: 'Yo pido que reformule. "Siento que te haya dolido" no es lo mismo que "lo siento".', time: '12:08', own: false },
    { id: '3', username: 'anonimo7831', text: 'Justo eso. Cuesta verlo pero hace mucha diferencia.',                            time: '12:10', own: true  },
    { id: '4', username: 'MarOscuro44', text: 'Y darte permiso a no aceptar el perdón si no lo sientes auténtico.',             time: '12:12', own: false },
    { id: '5', username: 'RayoVerde99', text: 'Gracias. Lo necesitaba leer.',                                                   time: '12:13', own: false },
  ],
]

export function buildMockMessages(communityId: string): ApiMessage[] {
  const n = parseInt(communityId, 10)
  const idx = (Number.isFinite(n) ? n : 0) % MESSAGE_THREADS.length
  return MESSAGE_THREADS[idx] ?? MESSAGE_THREADS[0]!
}

// Miembros activos visibles en el panel lateral del chat
export const MOCK_CHAT_MEMBERS: ApiChatMember[] = [
  { username: 'LunaSerena12', initials: 'LS' },
  { username: 'MarOscuro44',  initials: 'MO' },
  { username: 'RayoVerde99',  initials: 'RV' },
  { username: 'CieloAzul23',  initials: 'CA' },
  { username: 'VientoSur77',  initials: 'VS' },
]

// ── Dashboard ──────────────────────────────────────────────
// Mensajes recientes mostrados en el widget del dashboard
export const MOCK_DASHBOARD_MESSAGES: ApiDashboardMessage[] = [
  { id: '1', communityId: '1', community: 'Ansiedad sin filtros', username: 'LunaSerena12', text: 'Hoy fue mejor que ayer, pequeños pasos.',         time: 'hace 5 min'  },
  { id: '2', communityId: '7', community: 'Noches difíciles',     username: 'MarOscuro44',  text: 'Gracias a todos por el apoyo de anoche.',         time: 'hace 18 min' },
  { id: '3', communityId: '2', community: 'Creciendo juntos',     username: 'RayoVerde99',  text: '¿Alguien más tiene dificultades para pedir ayuda?', time: 'hace 1 h'    },
]

// Opciones del selector de mood del dashboard
export interface MoodOption {
  value: number
  label: string
}
export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Muy mal' },
  { value: 2, label: 'Mal' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Bien' },
  { value: 5, label: 'Muy bien' },
]

// ── Eventos ────────────────────────────────────────────────
export const MOCK_EVENTS: ApiEvent[] = [
  { id: '1', title: 'Taller de mindfulness',                 host: 'Dr. García',   date: '28 may 2026', time: '18:00', duration: '1h',     spots: 8,  total: 20, tags: ['mindfulness', 'estrés', 'relajación'], desc: 'Aprende técnicas de respiración y meditación guiada para reducir el estrés del día a día.', joined: false, interestedCount: 28 },
  { id: '2', title: 'Sesión: ansiedad social',               host: 'Psic. Martín', date: '30 may 2026', time: '19:30', duration: '90 min', spots: 3,  total: 12, tags: ['ansiedad', 'social'],                  desc: 'Espacio seguro para compartir experiencias con la ansiedad social y aprender estrategias de afrontamiento.', joined: true,  interestedCount: 47 },
  { id: '3', title: 'Charla: autoestima y redes sociales',   host: 'Dr. López',    date: '2 jun 2026',  time: '17:00', duration: '45 min', spots: 25, total: 50, tags: ['autoestima', 'redes sociales'],        desc: 'Cómo las redes sociales afectan a nuestra imagen y cómo construir una autoestima sólida.', joined: false, interestedCount: 64 },
  { id: '4', title: 'Taller de comunicación asertiva',       host: 'Psic. Ruiz',   date: '5 jun 2026',  time: '18:30', duration: '2h',     spots: 0,  total: 15, tags: ['comunicación', 'relaciones'],          desc: 'Aprende a expresar tus necesidades sin agresividad ni sumisión. Aforo completo.', joined: false, interestedCount: 19 },
  { id: '5', title: 'Sesión de duelo y aceptación',          host: 'Dr. Moreno',   date: '7 jun 2026',  time: '20:00', duration: '1h',     spots: 6,  total: 10, tags: ['duelo', 'pérdida', 'aceptación'],      desc: 'Un espacio para procesar el duelo y encontrar el camino hacia la aceptación.', joined: false, interestedCount: 12 },
  { id: '6', title: 'Charla: salud mental en el trabajo',    host: 'Psic. Torres', date: '10 jun 2026', time: '12:00', duration: '1h',     spots: 40, total: 60, tags: ['trabajo', 'burnout', 'estrés'],        desc: 'Reconocer el burnout y herramientas para mantener el bienestar en el entorno laboral.', joined: false, interestedCount: 85 },
]

// ── Historias del mapa ─────────────────────────────────────
export const MOCK_STORIES: ApiStory[] = [
  { id: '1', lat: 40.4168, lng: -3.7038,  username: 'luna_azul',         text: 'En Madrid encontré a mi comunidad. Aquí aprendí que pedir ayuda no es debilidad.', time: 'hace 2 días',    emoji: '' },
  { id: '2', lat: 41.3851, lng: 2.1734,   username: 'alba_nueva',        text: 'Barcelona me enseñó a soltar lo que no puedo controlar. Gracias a todos.',         time: 'hace 1 semana',  emoji: '' },
  { id: '3', lat: 48.8566, lng: 2.3522,   username: 'estrella_quieta',   text: 'Paris. Aquí decidí empezar terapia. El mejor regalo que me he dado.',              time: 'hace 3 días',    emoji: '' },
  { id: '4', lat: 51.5074, lng: -0.1278,  username: 'mar_calma',         text: 'London, where I learned it is okay to not be okay.',                                time: 'hace 5 días',    emoji: '' },
  { id: '5', lat: 40.7128, lng: -74.0060, username: 'sol_interior',      text: 'New York. Rushed city, slow healing. But healing nonetheless.',                     time: 'hace 2 semanas', emoji: '' },
  { id: '6', lat: -33.8688, lng: 151.2093, username: 'viento_libre',     text: 'Sydney. Lejos de casa, más cerca de mí mismo.',                                     time: 'hace 1 mes',     emoji: '' },
  { id: '7', lat: 35.6762, lng: 139.6503, username: 'nube_rosa',         text: 'Tokyo. La soledad puede ser hermosa cuando aprendes a acompañarte.',                time: 'hace 3 semanas', emoji: '' },
  { id: '8', lat: -22.9068, lng: -43.1729, username: 'brisa_suave',      text: 'Rio de Janeiro. La vida es demasiado corta para guardar lo que sientes.',           time: 'hace 4 días',    emoji: '' },
]

// ── Profesionales ──────────────────────────────────────────
export const MOCK_PROFESSIONALS: ApiProfessional[] = [
  { id: '1', name: 'Dr. Carlos García',  specialty: 'psicologo',  tags: ['ansiedad', 'depresión', 'TCC'],           availability: 'now',                       bio: 'Especialista en terapia cognitivo-conductual con 12 años de experiencia.' },
  { id: '2', name: 'Psic. Ana Martín',   specialty: 'terapeuta',  tags: ['autoestima', 'relaciones', 'mindfulness'], availability: 'today',  availableAt: '16:00', bio: 'Terapia humanista centrada en la persona y el crecimiento personal.' },
  { id: '3', name: 'Dr. Pedro López',    specialty: 'psiquiatra', tags: ['sueño', 'estrés', 'burnout'],             availability: 'tomorrow',                  bio: 'Psiquiatra con enfoque integrador. Combino farmacología y psicoterapia.' },
  { id: '4', name: 'Psic. Laura Ruiz',   specialty: 'terapeuta',  tags: ['duelo', 'trauma', 'pérdida'],             availability: 'today',  availableAt: '18:30', bio: 'Experta en acompañamiento en el duelo y procesos de cambio vital.' },
  { id: '5', name: 'Dr. Javier Moreno',  specialty: 'psicologo',  tags: ['adolescentes', 'familia', 'identidad'],  availability: 'now',                       bio: 'Psicólogo especializado en jóvenes y dinámica familiar sistémica.' },
  { id: '6', name: 'Psic. María Torres', specialty: 'terapeuta',  tags: ['trabajo', 'burnout', 'gestión emocional'], availability: 'now',                     bio: 'Terapia online especializada en salud laboral y equilibrio vida-trabajo.' },
]

// ── Reportes (moderación) ──────────────────────────────────
export const MOCK_REPORTS: ApiReport[] = [
  { id: '1', type: 'message', reporter: 'luna_azul',       reported: 'usuario_x',  content: 'Esto no tiene solución, todos deberían rendirse.',         reason: 'Contenido potencialmente dañino', community: 'Ansiedad sin filtros',  time: 'hace 1 hora',  status: 'pending'   },
  { id: '2', type: 'profile', reporter: 'alba_nueva',      reported: 'perfil_123', content: 'Foto de perfil inapropiada',                                reason: 'Contenido ofensivo',              community: 'Relaciones sanas',      time: 'hace 3 horas', status: 'pending'   },
  { id: '3', type: 'message', reporter: 'estrella_quieta', reported: 'usuario_anon', content: 'Me han dicho que vaya a terapia como si fuera un insulto.', reason: 'Lenguaje hiriente',             community: 'Creciendo juntos',      time: 'hace 5 horas', status: 'resolved'  },
  { id: '4', type: 'message', reporter: 'mar_calma',       reported: 'troll_99',   content: 'Publicidad de servicios no autorizados.',                    reason: 'Spam / publicidad',              community: 'Mar en calma',          time: 'ayer',         status: 'dismissed' },
]

// Miembros listados en la sección Miembros del panel de moderación
export const MOCK_MOD_MEMBERS: ApiModerationMember[] = [
  { username: 'LunaSerena12', community: 'Noches difíciles',     joined: 'hace 3 semanas', reports: 0 },
  { username: 'MarOscuro44',  community: 'Ansiedad sin filtros', joined: 'hace 1 mes',     reports: 1 },
  { username: 'RayoVerde99',  community: 'Creciendo juntos',     joined: 'hace 2 días',    reports: 0 },
  { username: 'TormentaGris', community: 'Ansiedad sin filtros', joined: 'hace 5 días',    reports: 2 },
  { username: 'UsuarioX44',   community: 'Noches difíciles',     joined: 'hace 1 semana',  reports: 1 },
]

// ── Perfil del usuario ─────────────────────────────────────
// joinedAt = ~56 días antes para que "semanas activo" salga ~8
const _eightWeeksAgo = new Date()
_eightWeeksAgo.setDate(_eightWeeksAgo.getDate() - 56)
const _joinedAtStr = _eightWeeksAgo.toISOString().slice(0, 10)

export const MOCK_PROFILE: ApiProfile = {
  username: 'anonimo7831',
  role: 'USER',
  joinedAt: _joinedAtStr,
  stats: { messages: 47, communities: 3, events: 5, stories: 1, bottles: 4 },
  activity: [
    { id: '1', icon: 'message',   text: 'Comentaste en Ansiedad sin filtros',         time: 'hace 2 horas'   },
    { id: '2', icon: 'event',     text: 'Te apuntaste a Sesión de mindfulness grupal', time: 'hace 1 día'    },
    { id: '3', icon: 'community', text: 'Te uniste a Noches difíciles',                time: 'hace 3 días'   },
    { id: '4', icon: 'bottle',    text: 'Enviaste un mensaje en una botella',          time: 'hace 5 días'   },
    { id: '5', icon: 'message',   text: 'Comentaste en Creciendo juntos',              time: 'hace 1 semana' },
  ],
  topics: ['ansiedad', 'mindfulness', 'autoestima'],
}

// ── Botellas decorativas (escena de /botella) ──────────────
export const MOCK_BOTTLE_STORIES: ApiBottleStory[] = [
  { text: 'Hoy me levanté aunque no quería. A veces eso es suficiente.',                              time: 'Hace 2 días'   },
  { text: 'Le conté a mi mejor amiga lo que me pasaba. Por fin me sentí menos sola.',                 time: 'Hace 5 días'   },
  { text: 'No tengo todo resuelto, pero hoy me reí de verdad. Hacía semanas que no lo hacía.',        time: 'Hace 1 semana' },
]

// ── Chat 1 a 1 con profesional ─────────────────────────────
// 3 hilos distintos rotando por professionalId — antes todos los profesionales
// mostraban el mismo hilo genérico, lo que rompía la sensación de "1 a 1".
const PRIVATE_THREADS: ApiPrivateMessage[][] = [
  [
    { id: '1', from: 'professional', text: 'Hola. Soy tu profesional asignado. Aquí puedes contarme lo que sientas; este es un espacio seguro y confidencial.', time: 'hace 2 horas' },
    { id: '2', from: 'user',         text: 'Gracias. Llevo unas semanas con bastante ansiedad y no sé bien por dónde empezar.',                                  time: 'hace 1 hora'  },
    { id: '3', from: 'professional', text: 'Entiendo. ¿Recuerdas cuándo notas que se intensifica más?',                                                            time: 'hace 50 min'  },
    { id: '4', from: 'user',         text: 'Sobre todo por las noches, cuando intento dormir.',                                                                    time: 'hace 45 min'  },
  ],
  [
    { id: '1', from: 'professional', text: 'Hola, gracias por escribirme. Cuéntame qué te ha traído aquí, sin prisa.',                                            time: 'hace 1 día'   },
    { id: '2', from: 'user',         text: 'Tengo problemas para gestionar el enfado con mi familia. Me siento mal después.',                                     time: 'hace 1 día'   },
    { id: '3', from: 'professional', text: 'El enfado no es el problema en sí. Lo importante es qué hacemos con él. ¿Quieres que veamos algunas técnicas?',       time: 'hace 22 horas' },
  ],
  [
    { id: '1', from: 'professional', text: 'Buenas. Antes de empezar, ¿prefieres que hablemos por aquí o agendamos una videollamada?',                            time: 'hace 30 min'  },
    { id: '2', from: 'user',         text: 'Por aquí está bien de momento, me cuesta menos escribir.',                                                            time: 'hace 25 min'  },
    { id: '3', from: 'professional', text: 'Perfecto. Tómate el tiempo que necesites para cada respuesta.',                                                       time: 'hace 24 min'  },
  ],
]

export function buildMockPrivateMessages(professionalId: string): ApiPrivateMessage[] {
  const n = parseInt(professionalId, 10)
  const idx = (Number.isFinite(n) ? n : 0) % PRIVATE_THREADS.length
  return PRIVATE_THREADS[idx] ?? PRIVATE_THREADS[0]!
}

// ── Perfil profesional (moderador) ─────────────────────────
export const MOCK_MOD_PROFILE: ApiModProfile = {
  name: 'Carlos',
  lastName: 'García',
  username: 'dr_garcia',
  email: 'carlos.garcia@clinica.es',
  company: 'Clínica Salud Mental Madrid',
}
