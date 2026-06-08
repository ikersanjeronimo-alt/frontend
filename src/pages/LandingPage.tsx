import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './LandingPage.module.css'

const FEATURES = [
  {
    title: 'Comunidades',
    desc: 'Únete a comunidades de apoyo moderadas por profesionales de salud mental. Habla con personas que entienden lo que estás viviendo, comparte tu historia y siente que no estás solo/a en esto.',
    route: '/comunidades',
    color: 'lavender',
    featured: true,
  },
  {
    title: 'Eventos',
    desc: 'Talleres, sesiones grupales y charlas organizadas por profesionales. Aprende y comparte en un entorno seguro.',
    route: '/eventos',
    color: 'peach',
  },
  {
    title: 'Mapa de historias',
    desc: 'Descubre historias anónimas de personas de todo el mundo vinculadas a un lugar. Añade la tuya.',
    route: '/mapa',
    color: 'green',
  },
  {
    title: 'Mensaje en una botella',
    desc: 'Envía un mensaje anónimo a alguien al azar. A veces las palabras correctas llegan en el momento justo.',
    route: '/botella',
    color: 'peach',
  },
  {
    title: 'Máquina del tiempo',
    desc: 'Escribe una carta a tu yo del futuro. Tú decides cuándo recibirla.',
    route: '/maquina-del-tiempo',
    color: 'lavender',
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <main>
      <HeroSection onStart={() => navigate('/onboarding')} />
      <FeaturesGrid />
    </main>
  )
}

function HeroSection({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation()
  return (
    <section className={styles.hero}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.heroContent} animate-fadeInUp`}>
        <h1 className={styles.heroTitle}>
          {t('landing.heroTitle1')}<br />
          {t('landing.heroTitle2')}<br />
          <em className={styles.heroEm}>{t('landing.heroTitle3')}</em>
        </h1>

        <p className={styles.heroSub}>
          {t('landing.heroSub')}
        </p>

        <div className={styles.heroBtns}>
          <button className={`${styles.btnPrimary} hover-lift`} onClick={onStart}>
            {t('landing.ctaStart')}
          </button>
          <div className={styles.anonNote}>
            {t('landing.anonNote')}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesGrid() {
  const cat = catFor('/')
  return (
    <section className={styles.featuresSection}>
      <SleepingCat
        color={cat.color}
        seed={cat.seed}
        size={200}
        className={styles.landingCat}
      />
      <div className={styles.featuresHeader}>
        <h2 className={styles.featuresTitle}>¿Qué puedes hacer aquí?</h2>
        <p className={styles.featuresSub}>Explora todo lo que ShareYourStory tiene para ti</p>
      </div>

      <div className={styles.featuresGrid}>
        {FEATURES.map((f, i) => (
          <Link
            key={f.route}
            to={f.route}
            className={[
              styles.featCard,
              f.featured ? styles.featCardFeatured : styles.featCardSmall,
              styles[`featCard_${f.color}`],
              'hover-lift',
              'animate-fadeInUp',
              `delay-${i + 1}`,
            ].join(' ')}
          >
            <h3 className={styles.featTitle}>{f.title}</h3>
            <p className={styles.featDesc}>{f.desc}</p>
            <div className={styles.featArrow}>Explorar →</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
