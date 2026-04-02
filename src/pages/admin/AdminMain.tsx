import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import { Users, Store, Truck, Clock, TrendingUp, Wallet, Receipt } from 'lucide-react';

export default function AdminMain() {
  const [stats, setStats] = useState({ clients: 0, stores: 0, runners: 0, pending: 0, revenue: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Counts (Head: true means we only want the count, not the data)
      const { count: clients } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client');
      const { count: stores } = await supabase.from('stores').select('*', { count: 'exact', head: true });
      const { count: runners } = await supabase.from('runners').select('*', { count: 'exact', head: true }).eq('status', 'verified');
      const { count: pending } = await supabase.from('runners').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      // 2. Fetch Delivered Orders for Revenue Logic (₱5 for every ₱50)
      const { data: deliveredOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');

      const totalGross = deliveredOrders?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
      const platformCommission = Math.floor(totalGross / 50) * 5;

      // 3. Fetch Recent Transactions with Store details
      const { data: transactions } = await supabase
        .from('orders')
        .select('*, stores(store_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        clients: clients || 0,
        stores: stores || 0,
        runners: runners || 0,
        pending: pending || 0,
        revenue: platformCommission
      });

      if (transactions) setRecentTransactions(transactions);

    } catch (error) {
      console.error("Admin Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMins < 1) return 'JUST NOW';
    if (diffInMins < 60) return `${diffInMins} MINS AGO`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} HOURS AGO`;
    return past.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              System <span className="text-[#57b894]">Pulse</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4 italic">Live Infrastructure & Commission Audit</p>
          </div>
          <button 
            onClick={fetchGlobalStats}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-[#57b894] transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <TrendingUp size={18} />
          </button>
        </header>

        {/* --- ANALYTICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {[
            { label: 'Total Clients', val: stats.clients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Store Partners', val: stats.stores, icon: Store, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Platform Revenue', val: `₱${stats.revenue.toLocaleString()}`, icon: Wallet, color: 'text-[#57b894]', bg: 'bg-emerald-50' },
            { label: 'Active Fleet', val: stats.runners, icon: Truck, color: 'text-[#f28e1c]', bg: 'bg-orange-50' },
            { label: 'Pending Reviews', val: stats.pending, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-44 group hover:shadow-xl transition-all">
              <div className={`${s.bg} ${s.color} p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</p>
                <h3 className="text-2xl font-black text-slate-800 italic leading-none">
                  {loading ? '...' : s.val}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* --- LIVE TRANSACTION LOGS --- */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
           <h2 className="text-xl font-black text-slate-800 uppercase italic mb-8 flex items-center gap-3">
             <Receipt className="text-[#57b894]" size={20} />
             Recent <span className="text-[#57b894]">Audit</span> Logs
           </h2>
           <div className="space-y-4">
             {recentTransactions.length > 0 ? recentTransactions.map((order) => (
                <div key={order.id} className={`p-5 border-l-4 rounded-r-2xl flex justify-between items-center transition-all hover:bg-slate-50 ${
                  order.status === 'delivered' ? 'border-[#57b894] bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'
                }`}>
                   <div>
                      <p className="text-sm font-bold text-slate-600">
                        Order <span className="text-slate-900">#{order.id.slice(0, 8)}</span> at 
                        <span className="text-[#57b894] ml-1">{(order.stores as any)?.store_name}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-white rounded-full border border-slate-100">
                          {order.status}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          Total: ₱{order.total_amount}
                        </span>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400">
                     {getTimeAgo(order.created_at)}
                   </span>
                </div>
             )) : (
               <div className="py-10 text-center text-slate-300 italic font-bold text-xs uppercase tracking-widest">
                 No transactions recorded yet, Bes.
               </div>
             )}
           </div>
        </div>
      </main>
    </div>
  );
}