import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
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
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import Support from './pages/Support'
import About from './pages/About'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import Recrutement from './pages/Recrutement'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import PlayerProfile from './pages/PlayerProfile'
import MemberDashboard from './pages/MemberDashboard'
import MemberSection from './pages/MemberSection'
import Leaderboard from './pages/Leaderboard'
import LFG from './pages/LFG'
import CircuitBackground from './components/CircuitBackground'
import ChatWidget from './components/ChatWidget'
import InstallPWA from './components/InstallPWA'
import MusicPlayer from './components/MusicPlayer'
import Sidebar from './components/Sidebar'
import SocialIcons from './components/SocialIcons'
import CursorGlow from './components/CursorGlow'

const basename = (()=>{ const b = import.meta.env.BASE_URL || '/'; return b === '/' ? '/' : b.replace(/\/$/, '') })()

function AppLayout({ sideOpen, setSideOpen }){
  const { pathname } = useLocation()
  const dashboard = pathname === '/'
  const closeSidebar = ()=>setSideOpen(false)
  return (
    <>
      {!dashboard && <CircuitBackground/>}
      <div className={dashboard ? 'relative z-[1] min-h-screen bg-[#f5f6f8] text-[#17191d]' : 'relative z-[1] min-h-screen'}>
        {!dashboard && <CursorGlow/>}
        <Navbar onBurger={()=>setSideOpen(true)}/>
        <div className={dashboard ? 'mx-auto lg:flex lg:max-w-[1900px]' : 'mx-auto max-w-[1800px] lg:flex lg:gap-6 lg:px-4'}>
          <Sidebar mobileOpen={sideOpen} onClose={closeSidebar}/>
          <div className="min-w-0 flex-1">
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/catalog" element={<Catalog/>}/>
              <Route path="/product/:id" element={<ProductDetail/>}/>
              <Route path="/cart" element={<Cart/>}/>
              <Route path="/checkout" element={<Checkout/>}/>
              <Route path="/profile" element={<MemberDashboard/>}/>
              <Route path="/profile/:section" element={<MemberSection/>}/>
              <Route path="/orders" element={<Orders/>}/>
              <Route path="/orders/:id" element={<OrderDetail/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/reset-password" element={<ResetPassword/>}/>
              <Route path="/admin" element={<Admin/>}/>
              <Route path="/support" element={<Support/>}/>
              <Route path="/about" element={<About/>}/>
              <Route path="/tournaments" element={<Tournaments/>}/>
              <Route path="/tournaments/:id" element={<TournamentDetail/>}/>
              <Route path="/recrutement" element={<Recrutement/>}/>
              <Route path="/teams" element={<Teams/>}/>
              <Route path="/teams/:teamName" element={<TeamDetail/>}/>
              <Route path="/player/:id" element={<PlayerProfile/>}/>
              <Route path="/leaderboard" element={<Leaderboard/>}/>
              <Route path="/lfg" element={<LFG/>}/>
            </Routes>
            <footer className={`mt-8 border-t py-6 text-center text-xs ${dashboard ? 'border-[#e7e9ed] bg-white text-[#737983]' : 'border-white/10 text-white/40'}`}>
              <img src={`${import.meta.env.BASE_URL}ztc-gaming-logo.jpg`} alt="ZTC-GAMING" className="mx-auto mb-2 h-12 w-12 rounded-2xl object-cover"/>
              <div className="mb-3 flex items-center justify-center gap-5 text-sm">
                <Link to="/catalog" className={dashboard ? 'font-semibold text-[#555b64] hover:text-[#bd882b]' : 'font-semibold text-white/60 hover:text-lime-400'}>Catalogue</Link>
                <Link to="/about" className={dashboard ? 'font-semibold text-[#555b64] hover:text-[#bd882b]' : 'font-semibold text-white/60 hover:text-lime-400'}>À propos</Link>
                <Link to="/support" className={dashboard ? 'font-semibold text-[#555b64] hover:text-[#bd882b]' : 'font-semibold text-white/60 hover:text-lime-400'}>Support</Link>
              </div>
              <SocialIcons className="mb-3" />
              © 2026 ZTC-GAMING • FR / EN / AR • TND
            </footer>
          </div>
        </div>
      </div>
      <ChatWidget/>
      <InstallPWA/>
      <MusicPlayer/>
    </>
  )
}

export default function App(){
  const [sideOpen, setSideOpen] = useState(false)
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter basename={basename}>
            <AppLayout sideOpen={sideOpen} setSideOpen={setSideOpen}/>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
