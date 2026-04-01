import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Package, Clock, MapPin, Truck, 
  BellRing, Store, CheckCircle2, Trash2 
} from 'lucide-react';

export default function ClientOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready_for_pickup', label: 'Pickup' },
    { id: 'delivered', label: 'Done' }
  ];

  useEffect(() => {
    fetchMyOrders();

    const channel = supabase
      .channel('order_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, 
      () => {
        fetchMyOrders();
        setNewUpdate(true);
        setTimeout(() => setNewUpdate(false), 5000); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMyOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const { data } = await supabase
      .from('orders')
      .select('*, stores(store_name), runners(full_name, phone)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to remove this order from your history, Bes? 🗑️")) return;
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      alert("Error deleting order: " + error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ready_for_pickup': return 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse';
      case 'dispatched': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch { return timeStr; }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20 font-sans">
      <div className="bg-white px-6 pt-6 sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/client/home')} 
              title="Return to Home"
              aria-label="Return to Home"
              className="p-2 hover:bg-slate-50 rounded-full transition-all"
            >
              <ChevronLeft />
            </button>
            <h1 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">My <span className="text-[#57b894]">Orders</span></h1>
          </div>
          {newUpdate && (
            <div className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-full animate-bounce shadow-lg">
              <BellRing size={12} />
              <span className="text-[8px] font-black uppercase">Update!</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase italic tracking-widest text-xs">Syncing with Store...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Package size={48} className="mx-auto text-slate-100" />
            <p className="text-slate-400 font-black uppercase italic tracking-widest text-xs">No {activeTab === 'all' ? '' : activeTab.replace(/_/g, ' ')} orders, Bes!</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-[#57b894] uppercase italic mb-1">{order.stores?.store_name}</p>
                  <p className="text-[9px] font-bold text-slate-400 tracking-tighter">Order #{order.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${getStatusStyle(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {order.status === 'delivered' && (
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Delete Order History"
                      aria-label="Delete Order History"
                      className="p-2 text-rose-500 bg-rose-50 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {order.delivery_type === 'pickup' && order.status === 'ready_for_pickup' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                   <div className="bg-amber-500 p-2 rounded-xl text-white shadow-md"><CheckCircle2 size={18} /></div>
                   <div>
                     <p className="text-[10px] font-black text-amber-700 uppercase leading-none mb-1">Your order is ready!</p>
                     <p className="text-[9px] font-bold text-amber-600/80 italic">Claim it at the store now, Bes! ✨</p>
                   </div>
                </div>
              )}

              {order.delivery_type === 'delivery' && order.runners && order.status !== 'delivered' && (
                <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
                  <div className="bg-indigo-500 p-2 rounded-xl text-white"><Truck size={16} /></div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Assigned Rider</p>
                    <p className="text-xs font-black text-indigo-900 uppercase italic">{order.runners.full_name}</p>
                  </div>
                  <a 
                    href={`tel:${order.runners.phone}`} 
                    title="Call Rider"
                    aria-label="Call Rider"
                    className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <Clock size={14} />
                  </a>
                </div>
              )}

              <div className="bg-slate-50/50 rounded-2xl p-4 space-y-1 border border-slate-100">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[10px] font-bold text-slate-600 italic">
                    <span>{item.qty}x {item.name}</span>
                    <span>₱{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-slate-400 border-t border-slate-50 pt-4">
                {order.delivery_type === 'pickup' ? (
                  <>
                    <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600"><Store size={14} /></div>
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter leading-none">Self Pickup</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase italic leading-none mt-1">Time: {formatTime(order.pickup_time)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin size={14} className="text-[#57b894]" />
                    <p className="text-[10px] font-medium line-clamp-1 italic">{order.delivery_address}</p>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-[9px] font-bold text-slate-300 uppercase italic">Placed {new Date(order.created_at).toLocaleDateString()}</p>
                <p className="font-black text-slate-900 italic">Total: ₱{order.total_amount}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}