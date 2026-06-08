import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import styles from './MainLayout.module.css'

/**
 * Layout principal: Navbar arriba + página + Footer abajo.
 * Lo usan las pantallas "estándar" con scroll vertical normal.
 *
 * Shell flex en columna (min-height 100dvh) con el contenido en `flex: 1` para
 * que el Footer quede pegado al fondo del viewport en páginas cortas y baje con
 * el scroll en páginas largas.
 */
export function MainLayout() {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.content}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
