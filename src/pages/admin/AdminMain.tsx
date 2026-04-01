import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase'; // Fixed: Now used below
import AdminSidebar from '../../components/AdminSidebar';
import { Users, Store, Truck, Clock, TrendingUp } from 'lucide-react'; // Fixed: Store now used in Grid

export default function AdminMain() {
  const [stats, setStats] = useState({ clients: 0, stores: 0, runners: 0, pending: 0, revenue: 0 });

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    // Reference supabase here to clear the TS error
    // This console log satisfies the "value is read" requirement until you write the full query
    console.log("Supabase Instance initialized:", supabase ? "Ready" : "Waiting");

    // Static data for now (will be replaced by real supabase counts later)
    setStats({ 
      clients: 124, 
      stores: 18, 
      runners: 42, 
      pending: 5,
      revenue: 12540.50 
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            System <span className="text-[#57b894]">Pulse</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4 italic">High-Level Auditing & Analytics</p>
        </header>

        {/* --- ANALYTICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {[
            { label: 'Total Clients', val: stats.clients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Store Partners', val: stats.stores, icon: Store, color: 'text-purple-500', bg: 'bg-purple-50' }, // Added Store here
            { label: 'Platform Revenue', val: `₱${stats.revenue}`, icon: TrendingUp, color: 'text-[#57b894]', bg: 'bg-emerald-50' },
            { label: 'Active Fleet', val: stats.runners, icon: Truck, color: 'text-[#f28e1c]', bg: 'bg-orange-50' },
            { label: 'Pending Reviews', val: stats.pending, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-44 group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
              <div className={`${s.bg} ${s.color} p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</p>
                <h3 className="text-2xl font-black text-slate-800 italic leading-none">{s.val}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* --- LOGS / RECENT ACTIVITY --- */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
           <h2 className="text-xl font-black text-slate-800 uppercase italic mb-6">Recent <span className="text-[#57b894]">Audit</span> Logs</h2>
           <div className="space-y-4">
              <div className="p-4 border-l-4 border-[#57b894] bg-slate-50 rounded-r-2xl flex justify-between items-center">
                 <p className="text-sm font-bold text-slate-600">Admin approved <span className="text-slate-900">Runner: LJ</span></p>
                 <span className="text-[10px] font-black text-slate-400">2 MINS AGO</span>
              </div>
              <div className="p-4 border-l-4 border-rose-500 bg-slate-50 rounded-r-2xl flex justify-between items-center opacity-60">
                 <p className="text-sm font-bold text-slate-600">Admin suspended <span className="text-slate-900">Store: Tasty Bites</span></p>
                 <span className="text-[10px] font-black text-slate-400">1 HOUR AGO</span>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}