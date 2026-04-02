import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Power, Package, LogOut, MapPin, CheckCircle, XCircle, Truck, Phone, Navigation, Loader2 
} from 'lucide-react';

// --- Leaflet Icon Fix ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [map]);
  return null;
}

export default function RunnerDashboard({ user }: { user: any }) {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'ongoing' | 'history'>('requests');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const boronganCoords: [number, number] = [11.6094, 125.4411];

  useEffect(() => {
    fetchRunnerStatus();
    fetchRunnerOrders();

    const channel = supabase
      .channel('runner_realtime_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `runner_id=eq.${user.id}`
      }, () => {
        fetchRunnerOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRunnerStatus = async () => {
    const { data } = await supabase.from('runners').select('is_online').eq('id', user.id).single();
    if (data) setIsOnDuty(data.is_online);
  };

  const fetchRunnerOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(store_name, phone)')
      .eq('runner_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
  };

  const toggleDuty = async () => {
    const newStatus = !isOnDuty;
    setIsUpdating(true);
    const { error } = await supabase.from('runners').update({ is_online: newStatus }).eq('id', user.id);
    if (!error) setIsOnDuty(newStatus);
    setIsUpdating(false);
  };

  // --- UPDATED STATUS LOGIC ---
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    
    // Prepare the update payload
    const updateData: any = { status: newStatus };
    
    // NEW: If the runner is completing the delivery, add the timestamp
    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      if (newStatus === 'delivered') alert("Order delivered! Revenue updated for store. ✨");
      fetchRunnerOrders();
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    await supabase.from('runners').update({ is_online: false }).eq('id', user.id);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const requests = orders.filter(o => o.status === 'dispatched');
  const ongoing = orders.filter(o => ['picked_up', 'out_for_delivery'].includes(o.status));
  const history = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans animate-in fade-in duration-500">
      {/* HEADER */}
      <div className={`p-6 text-white transition-all duration-500 shadow-xl ${isOnDuty ? 'bg-[#57b894]' : 'bg-slate-800'}`}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black italic uppercase">
              {user.user_metadata.full_name?.[0] || 'R'}
            </div>
            <div>
              <h1 className="text-lg font-black italic uppercase leading-none">Runner Portal</h1>
              <p className="text-[10px] font-bold opacity-70 mt-1 uppercase">
                {isOnDuty ? '🟢 Online & Active' : '⚪ Currently Offline'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            title="Logout"
            aria-label="Logout"
            className="p-3 bg-white/10 hover:bg-rose-500 rounded-2xl transition-all active:scale-90"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 -mt-4">
        {/* DUTY TOGGLE CARD */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isOnDuty ? 'bg-emerald-100 text-emerald-600 shadow-lg' : 'bg-slate-100 text-slate-400'}`}><Power size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Duty Status</p>
              <p className="text-sm font-black text-slate-800 uppercase italic">{isOnDuty ? 'Receiving Orders' : 'Offline'}</p>
            </div>
          </div>
          <button 
            onClick={toggleDuty} 
            disabled={isUpdating} 
            title="Toggle Duty Status"
            aria-label="Toggle Duty Status"
            className={`w-16 h-8 rounded-full transition-all relative ${isOnDuty ? 'bg-[#57b894]' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isOnDuty ? 'left-9' : 'left-1'}`} />
          </button>
        </div>

        {/* MAP */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-white overflow-hidden h-64 relative">
          <MapContainer center={boronganCoords} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapResizer />
            {isOnDuty && <Marker position={boronganCoords}><Popup>You're here!</Popup></Marker>}
          </MapContainer>
          {!isOnDuty && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-white gap-2 font-black uppercase text-[10px] italic"><MapPin className="text-[#f28e1c] animate-bounce" size={32} />Map Hidden</div>}
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-3xl shadow-inner">
          {[
            { id: 'requests', label: `Requests (${requests.length})` },
            { id: 'ongoing', label: 'Ongoing' },
            { id: 'history', label: 'History' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="space-y-4">
          {activeTab === 'requests' && (
            requests.length > 0 ? requests.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center">
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest border border-indigo-100">New Request</div>
                  <p className="text-[10px] font-bold text-slate-300">₱{order.total_amount}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase italic">From Store</p>
                   <h3 className="text-xl font-black text-slate-800 uppercase italic">{order.stores?.store_name}</h3>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                   <Navigation size={16} className="text-[#57b894] shrink-0" />
                   <p className="text-xs font-bold text-slate-600 italic">{order.delivery_address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button disabled={isUpdating} onClick={() => handleUpdateStatus(order.id, 'picked_up')} className="bg-[#57b894] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95">{isUpdating ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Accept</button>
                   <button disabled={isUpdating} onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="bg-white text-rose-500 border border-rose-100 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-rose-50 transition-all active:scale-95"><XCircle size={14}/> Decline</button>
                </div>
              </div>
            )) : <div className="text-center py-10 text-slate-300 font-black uppercase italic text-[10px] tracking-widest">No pending requests</div>
          )}

          {activeTab === 'ongoing' && (
            ongoing.length > 0 ? ongoing.map(order => (
              <div key={order.id} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-start relative z-10">
                   <div>
                      <p className="text-[8px] font-black text-[#57b894] uppercase tracking-widest italic mb-1">Delivering to</p>
                      <h3 className="text-xl font-black uppercase italic leading-none">{order.customer_name}</h3>
                   </div>
                   <div className="p-3 bg-white/10 rounded-2xl text-[#57b894] shadow-inner"><Truck size={24}/></div>
                </div>
                <div className="space-y-3 relative z-10">
                   <div className="flex items-start gap-3 text-slate-400"><MapPin size={16} className="text-[#57b894] shrink-0" /><p className="text-xs font-bold italic leading-tight">{order.delivery_address}</p></div>
                   <div className="flex items-center gap-3 text-slate-400"><Phone size={16} className="text-[#57b894] shrink-0" /><p className="text-xs font-bold italic">Contact Store: {order.stores?.phone || 'N/A'}</p></div>
                </div>
                <button disabled={isUpdating} onClick={() => handleUpdateStatus(order.id, 'delivered')} className="w-full py-5 bg-[#57b894] hover:bg-emerald-400 text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl relative z-10 flex items-center justify-center gap-2">
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Complete Delivery'}
                </button>
                <div className="absolute -bottom-10 -right-10 text-white opacity-5 rotate-12"><Package size={200}/></div>
              </div>
            )) : <div className="text-center py-10 text-slate-300 font-black uppercase italic text-[10px] tracking-widest">No active deliveries</div>
          )}

          {activeTab === 'history' && (
            history.length > 0 ? history.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase italic leading-none mb-1">{order.customer_name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(order.created_at).toLocaleDateString()} • {order.status}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-800 italic">₱{order.total_amount}</p>
              </div>
            )) : <div className="text-center py-10 text-slate-300 font-black uppercase italic text-[10px] tracking-widest">History is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}