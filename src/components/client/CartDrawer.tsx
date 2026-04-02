import { X, Loader2, Truck, Store, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose, cart, setCart }: any) {
  const navigate = useNavigate();
  const [isOrdering, setIsOrdering] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(cart.map((i: any) => i.id));
  }, [cart.length]);

  const toggleSelection = (itemId: string) => {
    setSelectedIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const removeItem = (itemId: string) => {
    setCart((prev: any) => prev.filter((item: any) => item.id !== itemId));
    setSelectedIds(prev => prev.filter(id => id !== itemId));
  };

  const selectedItems = cart.filter((item: any) => selectedIds.includes(item.id));

  const calculateShippingFee = (address: string) => {
  if (deliveryType === 'pickup' || selectedItems.length === 0) return 0;

  // Expanded list to include all ESSU colleges and campus landmarks
  const campusKeywords = [
    // Original keywords
    'law', 'canuctan', 'essu', 'engineering', 'ict', 'registrar', 'canteen',
    // New College & Academic keywords
    'computer studies', 'ccs', 'business administration', 'cbma', 'education', 'coe', 
    'arts and sciences', 'cas', 'nursing', 'cnahs', 'medicine', 'med', 
    'biology', 'agriculture', 'agri', 'cot', 'technology',
    // Campus Landmarks & Facilities
    'jipapad', 'village', 'motorpool', 'business center', 'pag asa', 'pagasa', 
    'pavilion', 'student pavilion', 'grandstand', 'gym'
  ];

  // Check if the typed address contains any of our campus keywords
  const isCampus = campusKeywords.some(key => address.toLowerCase().includes(key));

  // ₱10 for campus, ₱20 for outside (Borongan Town)
  return isCampus ? 10 : 20;
};

  const shippingFee = calculateShippingFee(deliveryAddress);
  const cartSubtotal = selectedItems.reduce((s: any, i: any) => s + (i.price * i.qty), 0);
  const grandTotal = cartSubtotal + shippingFee;

  const handlePlaceOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login first, Bes!");
    if (!customerName.trim()) return alert("Enter your name, Bes!");
    if (selectedItems.length === 0) return alert("Select at least one item to checkout, Bes!");
    
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      return alert("Enter delivery address, Bes!");
    }

    setIsOrdering(true);
    try {
      const storeIds = Array.from(new Set(selectedItems.map((item: any) => item.store_id)));
      
      for (const sId of storeIds) {
        const storeItems = selectedItems.filter((item: any) => item.store_id === sId);
        const subtotal = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

        const { error } = await supabase.from('orders').insert([{
          client_id: user.id,
          store_id: sId,
          items: storeItems,
          total_amount: subtotal + shippingFee, 
          delivery_fee: shippingFee,
          status: 'pending',
          customer_name: customerName,
          delivery_address: deliveryType === 'pickup' ? 'Store Pickup' : deliveryAddress,
          delivery_type: deliveryType,
          pickup_time: deliveryType === 'pickup' ? pickupTime : null 
        }]);

        if (error) throw error;
      }
      
      setCart((prev: any) => prev.filter((item: any) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      onClose();
      navigate('/client/orders');
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsOrdering(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase italic text-slate-900">Your <span className="text-[#57b894]">Basket</span></h2>
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
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 font-bold italic mt-10 uppercase text-xs">Empty basket, Bes!</p>
          ) : (
            cart.map((item: any) => (
              <div key={item.id} className={`flex gap-3 items-center p-4 rounded-3xl border transition-all ${selectedIds.includes(item.id) ? 'bg-white border-[#57b894] shadow-md' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                
                <button 
                  onClick={() => toggleSelection(item.id)}
                  title={selectedIds.includes(item.id) ? "Deselect item" : "Select item"}
                  aria-label={selectedIds.includes(item.id) ? "Deselect item" : "Select item"}
                  className={`transition-colors ${selectedIds.includes(item.id) ? 'text-[#57b894]' : 'text-slate-300'}`}
                >
                  {selectedIds.includes(item.id) ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>

                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 uppercase italic leading-none mb-1">{item.name}</p>
                  <p className="text-[10px] font-black text-slate-400">Qty: {item.qty} • ₱{item.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-black text-slate-900 text-sm">₱{item.price * item.qty}</div>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    title="Remove from basket"
                    aria-label="Remove from basket"
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          {deliveryType === 'delivery' && selectedItems.length > 0 && (
            <div className="px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in zoom-in-95">
              <span className="text-[10px] font-black text-emerald-700 uppercase italic">Shipping Fee:</span>
              <span className="text-sm font-black text-emerald-700 italic">₱{shippingFee}</span>
            </div>
          )}

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button onClick={() => setDeliveryType('delivery')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${deliveryType === 'delivery' ? 'bg-white text-[#57b894] shadow-sm' : 'text-slate-400'}`}>
              <Truck size={14} /> Delivery
            </button>
            <button onClick={() => setDeliveryType('pickup')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${deliveryType === 'pickup' ? 'bg-white text-[#57b894] shadow-sm' : 'text-slate-400'}`}>
              <Store size={14} /> Pickup
            </button>
          </div>

          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Full Name, Bes!" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-[#57b894]/20"
            />

            {deliveryType === 'delivery' ? (
              <textarea 
                placeholder="Where to, Bes? (College of Law, Canuctan...)" 
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 h-20 resize-none focus:ring-2 focus:ring-[#57b894]/20"
              />
            ) : (
              <input 
                type="time" 
                title="Select Pickup Time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100"
              />
            )}
          </div>

          <button 
            onClick={handlePlaceOrder} 
            disabled={isOrdering || selectedItems.length === 0} 
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-[#57b894] transition-all active:scale-95 disabled:opacity-50 shadow-xl"
          >
            {isOrdering ? <Loader2 className="animate-spin mx-auto" /> : `Checkout Selected • ₱${grandTotal}`}
          </button>
        </div>
      </div>
    </div>
  );
}