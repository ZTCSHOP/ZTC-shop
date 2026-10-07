import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Support from './pages/Support'
import About from './pages/About'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import Recrutement from './pages/Recrutement'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import AnimatedBackground from './components/AnimatedBackground'
import VideoBackground from './components/VideoBackground'
import ChatWidget from './components/ChatWidget'
import InstallPWA from './components/InstallPWA'
import MusicPlayer from './components/MusicPlayer'
import Sidebar from './components/Sidebar'

const basename = (()=>{ const b = import.meta.env.BASE_URL || '/'; return b === '/' ? '/' : b.replace(/\/$/, '') })()

export default function App(){
  const [sideOpen, setSideOpen] = useState(false)
  return (
    <LanguageProvider>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter basename={basename}>
          <VideoBackground/>
          <AnimatedBackground/>
          <div className="relative z-[1] min-h-screen">
            <Navbar onBurger={()=>setSideOpen(true)}/>
            <div className="max-w-[1800px] mx-auto lg:flex lg:gap-6 lg:px-4">
              <Sidebar mobileOpen={sideOpen} onClose={()=>setSideOpen(false)}/>
              <div className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/catalog" element={<Catalog/>}/>
              <Route path="/product/:id" element={<ProductDetail/>}/>
              <Route path="/cart" element={<Cart/>}/>
              <Route path="/checkout" element={<Checkout/>}/>
              <Route path="/orders" element={<Orders/>}/>
              <Route path="/orders/:id" element={<OrderDetail/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/admin" element={<Admin/>}/>
              <Route path="/support" element={<Support/>}/>
              <Route path="/about" element={<About/>}/>
              <Route path="/tournaments" element={<Tournaments/>}/>
              <Route path="/tournaments/:id" element={<TournamentDetail/>}/>
              <Route path="/recrutement" element={<Recrutement/>}/>
              <Route path="/teams" element={<Teams/>}/>
              <Route path="/teams/:teamName" element={<TeamDetail/>}/>
            </Routes>
            <footer className="border-t border-white/10 mt-8 py-6 text-center text-xs text-white/40">
              <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="ZTC Shop" className="w-12 h-12 mx-auto mb-2 rounded-2xl object-cover bg-white p-1"/>
              <div className="flex items-center justify-center gap-5 mb-2 text-sm">
                <Link to="/catalog" className="text-white/60 hover:text-lime-400 font-semibold">Catalogue</Link>
                <Link to="/about" className="text-white/60 hover:text-lime-400 font-semibold">À propos</Link>
                <Link to="/support" className="text-white/60 hover:text-lime-400 font-semibold">Support</Link>
              </div>
              © 2026 ZTC SHOP • FR / EN / AR • TND
            </footer>
              </div>
            </div>
          </div>
          <ChatWidget/>
          <InstallPWA/>
          <MusicPlayer/>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  )
}
