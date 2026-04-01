import { useState } from 'react';
import { 
  Search, Eye, X, Package, MapPin, 
  Loader2, Truck, Check, ShieldCheck, Trash2,
  HandHelping, CheckCircle
} from 'lucide-react';
import { supabase } from '../../api/supabase';

interface StoreOrdersProps {
  orders: any[];
  onRefresh: () => void;
}

export default function StoreOrders({ orders, onRefresh }: StoreOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // States for Runner Selection
  const [availableRunners, setAvailableRunners] = useState<any[]>([]);
  const [isRunnerModalOpen, setIsRunnerModalOpen] = useState(false);
  const [confirmRunner, setConfirmRunner] = useState<{id: string, name: string} | null>(null);

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready_for_pickup', label: 'For Pickup' },
    { id: 'dispatched', label: 'Dispatched' },
    { id: 'delivered', label: 'Done' }
  ];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' ? true : o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Delete this order record, Bes? 🗑️")) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      onRefresh();
      setSelectedOrder(null); 
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsUpdating(false); 
    }
  };

  const handleFindRunner = async () => {
    setIsUpdating(true);
    try {
      const { data: runners } = await supabase.from('runners').select('id, full_name, address').eq('status', 'verified').eq('is_online', true);
      const { data: activeOrders } = await supabase.from('orders').select('runner_id').in('status', ['searching_runner', 'dispatched', 'picked_up', 'out_for_delivery']);
      
      const busyIds = activeOrders?.map(o => o.runner_id) || [];
      const freeRunners = runners?.filter(r => !busyIds.includes(r.id)) || [];
      
      if (freeRunners.length === 0) throw new Error("No free riders available!");
      setAvailableRunners(freeRunners);
      setIsRunnerModalOpen(true);
    } catch (err: any) { alert(err.message); } 
    finally { setIsUpdating(false); }
  };

  const assignRunner = async () => {
    if (!confirmRunner || !selectedOrder) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ status: 'dispatched', runner_id: confirmRunner.id }).eq('id', selectedOrder.id);
      if (error) throw error;
      setConfirmRunner(null);
      setIsRunnerModalOpen(false);
      setSelectedOrder(null);
      onRefresh();
    } catch (err: any) { alert(err.message); } 
    finally { setIsUpdating(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-500 border-orange-100';
      case 'preparing': return 'bg-blue-50 text-blue-500 border-blue-100';
      case 'ready_for_pickup': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'dispatched': return 'bg-indigo-50 text-indigo-500 border-indigo-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-black uppercase italic text-slate-800">Store <span className="text-[#57b894]">Orders</span></h2>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {statuses.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === s.id ? 'bg-[#57b894] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input type="text" placeholder="Search Customer or Order ID..." className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-[#57b894]/20 font-bold text-xs" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 italic">
                <th className="px-8 py-6">Order Info</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Total</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800 text-xs block uppercase italic">{o.customer_name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">ID: #{o.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${getStatusColor(o.status)}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800 text-xs">₱{o.total_amount}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedOrder(o)} 
                        title="View Details"
                        aria-label="View Details"
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-[#57b894] transition-all shadow-lg shadow-slate-100"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(o.id)} 
                        title="Delete Order"
                        aria-label="Delete Order"
                        className="p-3 bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 relative no-scrollbar max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)} 
              title="Close Details"
              aria-label="Close Details"
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all"
            >
              <X />
            </button>
            <div className="mb-8">
              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border mb-4 inline-block ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status.replace(/_/g, ' ')}</span>
              <h2 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Order <span className="text-[#57b894]">Info</span></h2>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex gap-4 items-start">
                <MapPin size={18} className="text-[#57b894] shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</p>
                  <p className="text-xs font-bold text-slate-600 italic leading-snug">{selectedOrder.delivery_address}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-6 space-y-3 border border-slate-100">
                 {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs font-bold italic text-slate-700">
                      <span>{item.qty}x {item.name}</span>
                      <span>₱{item.price * item.qty}</span>
                    </div>
                 ))}
                 <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-black text-slate-900 uppercase text-xs tracking-widest">Total Amount</span>
                    <span className="text-xl font-black text-[#57b894]">₱{selectedOrder.total_amount}</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3">
                {selectedOrder.status === 'ready_for_pickup' ? (
                  <button onClick={() => updateOrderStatus('delivered')} className="w-full py-5 bg-[#57b894] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all">
                    <CheckCircle size={18} /> Order Claimed (Done)
                  </button>
                ) : selectedOrder.status === 'dispatched' ? (
                  <div className="bg-[#57b894]/10 p-5 rounded-[2rem] border border-[#57b894]/20 flex items-center gap-4">
                    <div className="bg-[#57b894] p-3 rounded-2xl text-white shadow-lg shadow-emerald-200"><Truck size={20}/></div>
                    <div>
                       <p className="text-[8px] font-black text-[#57b894] uppercase tracking-widest italic leading-none mb-1">Rider Assigned</p>
                       <p className="text-sm font-black text-slate-800 uppercase italic">{selectedOrder.runners?.full_name || 'Assigned Rider'}</p>
                    </div>
                  </div>
                ) : selectedOrder.status === 'delivered' ? (
                  <div className="bg-emerald-50 p-5 rounded-[2rem] text-center border border-emerald-100">
                    <p className="text-emerald-600 font-black uppercase italic text-xs tracking-widest">Order Completed ✨</p>
                  </div>
                ) : (
                  <>
                    <button 
                      disabled={isUpdating || selectedOrder.status === 'preparing'} 
                      onClick={() => updateOrderStatus('preparing')} 
                      className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all mb-1 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-2"><Package size={14} /> Mark as Preparing</div>}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button disabled={isUpdating || selectedOrder.status === 'pending'} onClick={handleFindRunner} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#57b894] transition-all disabled:opacity-50 shadow-xl shadow-slate-100">
                         <Truck size={14} /> Hire Rider
                      </button>
                      <button disabled={isUpdating || selectedOrder.status === 'pending'} onClick={() => updateOrderStatus('ready_for_pickup')} className="flex items-center justify-center gap-2 py-4 bg-white text-[#57b894] border border-[#57b894] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 transition-all disabled:opacity-50">
                         <HandHelping size={14} /> For Pickup
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isRunnerModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative animate-in zoom-in-95">
            <button 
              onClick={() => setIsRunnerModalOpen(false)} 
              title="Close Runner Selection"
              aria-label="Close Runner Selection"
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"
            >
              <X />
            </button>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Select <span className="text-[#57b894]">Runner</span></h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Only free online riders</p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
              {availableRunners.map((runner) => (
                <button key={runner.id} onClick={() => setConfirmRunner({id: runner.id, name: runner.full_name})} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-3xl transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#57b894] font-black text-xs uppercase shadow-sm">{runner.full_name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase italic leading-none mb-1">{runner.full_name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{runner.address || 'Borongan Area'}</p>
                    </div>
                  </div>
                  <Check size={16} className="text-[#57b894] opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmRunner && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center animate-in zoom-in-95 shadow-2xl">
            <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto mb-6 flex items-center justify-center text-[#57b894] shadow-sm"><Truck size={40}/></div>
            <h3 className="text-xl font-black uppercase italic text-slate-900 mb-2">Assign {confirmRunner.name}?</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 px-4 italic">Confirm dispatching this order to this rider, Bes?</p>
            <div className="flex flex-col gap-3">
              <button disabled={isUpdating} onClick={assignRunner} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#57b894] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-100">
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={16}/>} Yes, Assign Rider
              </button>
              <button onClick={() => setConfirmRunner(null)} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}