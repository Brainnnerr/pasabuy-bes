import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut, Store, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function StoreSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menu = [
    { name: 'Overview', icon: LayoutDashboard, path: '/store/dashboard' },
    { name: 'Products', icon: Package, path: '/store/products' },
    { name: 'Orders', icon: ShoppingBag, path: '/store/orders' },
    { name: 'Settings', icon: Settings, path: '/store/settings' },
  ];

  const NavContent = () => (
    <>
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="bg-[#57b894] p-2 rounded-xl text-white shadow-lg shadow-[#57b894]/20">
          <Store size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl uppercase italic leading-none text-slate-900">Partner<span className="text-[#57b894]">Bes</span></h2>
          <p className="text-[8px] font-black text-slate-400 tracking-[0.3em] mt-1">STORE PORTAL</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {menu.map((item) => (
          <button
            key={item.name}
            onClick={() => { navigate(item.path); setIsOpen(false); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${
              location.pathname === item.path 
              ? 'bg-[#57b894] text-white shadow-xl shadow-[#57b894]/20' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-6 py-4 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">
        <LogOut size={18} /> Sign Out
      </button>
    </>
  );

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-[#57b894]" />
          <span className="font-black text-sm uppercase italic tracking-tighter">Partner<span className="text-[#57b894]">Bes</span></span>
        </div>
        {/* FIXED: Added title and aria-label */}
        <button 
          onClick={() => setIsOpen(true)} 
          title="Open Menu"
          aria-label="Open Menu"
          className="p-2 text-slate-600 hover:text-[#57b894] transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsOpen(false)}>
          <div className="w-72 bg-white h-full p-8 flex flex-col animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            {/* FIXED: Added title and aria-label */}
            <button 
              onClick={() => setIsOpen(false)} 
              title="Close Menu"
              aria-label="Close Menu"
              className="absolute top-8 right-8 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={24} />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex w-72 bg-white min-h-screen p-8 flex-col border-r border-slate-100 shadow-sm sticky top-0">
        <NavContent />
      </div>
    </>
  );
}