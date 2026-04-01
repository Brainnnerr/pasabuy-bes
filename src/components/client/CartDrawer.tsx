import { X, Loader2, MapPin, User as UserIcon, Truck, Store, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose, cart, setCart }: any) {
  const navigate = useNavigate();
  const [isOrdering, setIsOrdering] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  const handlePlaceOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login first, Bes!");
    if (!customerName.trim()) return alert("Enter your name, Bes!");
    
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      return alert("Enter delivery address, Bes!");
    }
    
    if (deliveryType === 'pickup' && !pickupTime) {
      return alert("Please select a pickup time, Bes!");
    }

    setIsOrdering(true);
    try {
      const storeIds = Array.from(new Set(cart.map((item: any) => item.store_id)));
      for (const sId of storeIds) {
        const storeItems = cart.filter((item: any) => item.store_id === sId);
        const total = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

        const { error } = await supabase.from('orders').insert([{
          client_id: user.id,
          store_id: sId,
          items: storeItems,
          total_amount: total,
          status: 'pending',
          customer_name: customerName,
          delivery_address: deliveryType === 'pickup' ? 'Store Pickup' : deliveryAddress,
          delivery_type: deliveryType,
          pickup_time: deliveryType === 'pickup' ? pickupTime : null 
        }]);

        if (error) throw error;
      }
      
      setCart([]);
      setCustomerName('');
      setDeliveryAddress('');
      setPickupTime('');
      onClose();
      navigate('/client/orders');
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsOrdering(false); 
    }
  };

  if (!isOpen) return null;

  const cartTotal = cart.reduce((s: any, i: any) => s + (i.price * i.qty), 0);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase italic text-slate-900">Your <span className="text-[#57b894]">Basket</span></h2>
          {/* FIX: Added title and aria-label for accessibility */}
          <button 
            onClick={onClose} 
            title="Close Basket"
            aria-label="Close Basket"
            className="p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {cart.map((item: any) => (
            <div key={item.id} className="flex gap-4 items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 uppercase italic leading-none mb-1">{item.name}</p>
                <p className="text-[10px] font-black text-slate-400">Qty: {item.qty}</p>
              </div>
              <div className="font-black text-[#57b894] text-sm">₱{item.price * item.qty}</div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase text-amber-700 tracking-tight">Payment Notice</p>
              <p className="text-[9px] font-bold text-amber-600/80 leading-tight italic">
                Online payment is not yet available, Bes. Please pay via **Cash on Delivery** or **at the Store**.
              </p>
            </div>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Checkout Details</p>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${deliveryType === 'delivery' ? 'bg-white text-[#57b894] shadow-sm' : 'text-slate-400'}`}
            >
              <Truck size={14} /> Delivery
            </button>
            <button 
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${deliveryType === 'pickup' ? 'bg-white text-[#57b894] shadow-sm' : 'text-slate-400'}`}
            >
              <Store size={14} /> Pickup
            </button>
          </div>

          <div className="relative">
            <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Full Name, Bes!" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-[#57b894]/20"
            />
          </div>

          {deliveryType === 'delivery' ? (
            <div className="relative">
              <MapPin size={14} className="absolute left-4 top-4 text-slate-400" />
              <textarea 
                placeholder="Delivery Address (Street, Brgy, Landmark)..." value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full pl-10 pr-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 h-24 resize-none focus:ring-2 focus:ring-[#57b894]/20"
              />
            </div>
          ) : (
            <div className="relative">
              <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="time" 
                title="Select Pickup Time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full pl-10 pr-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-[#57b894]/20"
              />
              <p className="text-[9px] text-slate-400 mt-2 ml-2 italic">* Select pickup time at the store.</p>
            </div>
          )}

          <button 
            onClick={handlePlaceOrder} 
            disabled={isOrdering || cart.length === 0} 
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-[#57b894] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {isOrdering ? <Loader2 className="animate-spin mx-auto" /> : `Checkout • ₱${cartTotal}`}
          </button>
        </div>
      </div>
    </div>
  );
}