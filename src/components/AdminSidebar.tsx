import { LayoutDashboard, Truck, Store,  LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Runners', icon: Truck, path: '/admin/runners' },
    { name: 'Stores', icon: Store, path: '/admin/stores' },
   
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen p-6 flex flex-col shadow-2xl">
      <div className="mb-10 px-4">
        <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter">
          Admin<span className="text-[#57b894]">Bes</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em]">CONTROL PANEL</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              location.pathname === item.path 
              ? 'bg-[#57b894] text-white shadow-lg shadow-[#57b894]/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </button>
        ))}
      </nav>

      <button onClick={() => navigate('/login')} className="mt-auto flex items-center gap-4 px-4 py-4 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-500/10 rounded-2xl transition-all">
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}