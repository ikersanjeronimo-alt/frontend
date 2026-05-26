import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

/**
 * Layout sin Footer. Lo usan las pantallas que ocupan altura completa del
 * viewport: chats (Community/Private) y auth (Login/ModLogin/ModRegister).
 * Si añadiéramos el Footer, empujaría el contenido fuera de la pantalla.
 */
export function BareLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
