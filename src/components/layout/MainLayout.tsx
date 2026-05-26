import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

/**
 * Layout principal: Navbar arriba + página + Footer abajo.
 * Lo usan las pantallas "estándar" con scroll vertical normal.
 */
export function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}
