import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import StoreSidebar from '../../components/StoreSidebar';
import StoreOrders from './StoreOrders'; 
import StoreProducts from './StoreProducts'; 
import { useLocation } from 'react-router-dom';
import { 
  X, Camera, Check, Loader2,
  TrendingUp, ShoppingBag, Users, ArrowUpRight, 
  ArrowDownRight, Building2, Save, BarChart3, Package
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function StoreDashboard({ user }: { user: any }) {
  const location = useLocation();
  
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [location.pathname, user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Store Details
      const { data: store } = await supabase.from('stores').select('*').eq('id', user.id).single();
      if (store) {
        setStoreData(store);
        setPhone(store.phone || '');
      }

      // 2. Fetch Products
      const { data: prodData } = await supabase.from('products').select('*').eq('store_id', user.id).order('created_at', { ascending: false });
      if (prodData) setProducts(prodData);

      // 3. Fetch Orders WITH Runner Name Join
      // Note: This assumes your orders table has a 'runner_id' column linked to 'runners'
      const { data: ordData, error: ordError } = await supabase
        .from('orders')
        .select(`
          *,
          runners (
            full_name
          )
        `)
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });

      if (ordError) {
        console.error("Error fetching orders:", ordError);
      } else if (ordData) {
        setOrders(ordData);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.from('stores').update({ phone }).eq('id', user.id);
    if (error) alert("Error: " + error.message);
    else alert("Settings saved, Bes! ✨");
    setIsSubmitting(false);
    fetchData();
  };

  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let filePath = editingProduct?.image_url || null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const newPath = `${user.id}/${Date.now()}.${fileExt}`;
        await supabase.storage.from('products').upload(newPath, selectedFile);
        filePath = newPath;
      }

      const payload = {
        name: formData.get('name'),
        description: formData.get('description'), 
        category: formData.get('category'),
        price: parseFloat(formData.get('price') as string),
        stock_level: parseInt(formData.get('stock') as string),
        image_url: filePath,
        store_id: user.id
      };

      let error;
      if (editingProduct) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedFile(null);
      fetchData();
    } catch (err: any) { 
      alert("Error saving product: " + err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const OverviewView = () => {
    const chartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ fill: true, label: 'Revenue', data: [1500, 3200, 2800, 4500, 6100, 8900, 7200], borderColor: '#57b894', backgroundColor: 'rgba(87, 184, 148, 0.05)', tension: 0.4 }]
    };

    // Calculate active orders (those not yet delivered)
    const activeOrdersCount = orders.filter(o => o.status !== 'delivered').length;

    return (
      <div className="space-y-10 animate-in fade-in duration-500 no-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', val: `₱${storeData?.total_revenue || 0}`, icon: TrendingUp, color: 'text-emerald-500', up: true },
            { label: 'Active Orders', val: activeOrdersCount, icon: ShoppingBag, color: 'text-blue-500', up: true },
            { label: 'Total Products', val: products.length, icon: Package, color: 'text-purple-500', up: false },
            { label: 'Growth', val: '12%', icon: Users, color: 'text-orange-500', up: true },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-slate-50 ${kpi.color}`}><kpi.icon size={20} /></div>
                {kpi.up ? <ArrowUpRight className="text-emerald-500" size={16}/> : <ArrowDownRight className="text-rose-500" size={16}/>}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{kpi.label}</p>
              <h3 className="text-3xl font-black text-slate-800 italic leading-none">{kpi.val}</h3>
            </div>
          ))}
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50">
          <div className="flex items-center gap-3 mb-10"><BarChart3 className="text-[#57b894]" size={20} /><h3 className="text-xl font-black text-slate-800 uppercase italic">Weekly Performance</h3></div>
          <div className="h-[320px] w-full"><Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#fcfdfe] w-full">
      <StoreSidebar />
      <main className="flex-1 p-6 md:p-10 lg:p-12 mt-16 lg:mt-0 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#57b894]" size={40} /></div>
        ) : (
          <>
            {location.pathname === '/store/dashboard' && <OverviewView />}
            {location.pathname === '/store/products' && (
              <StoreProducts 
                products={products} 
                onAdd={() => { setEditingProduct(null); setIsModalOpen(true); }}
                onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }}
                onRefresh={fetchData}
              />
            )}
            {/* UPDATED: Passing orders and the refresh function to StoreOrders */}
            {location.pathname === '/store/orders' && (
              <StoreOrders orders={orders} onRefresh={fetchData} />
            )}
            
            {location.pathname === '/store/settings' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
                <h2 className="text-2xl font-black uppercase italic text-slate-800">Store <span className="text-[#57b894]">Settings</span></h2>
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 space-y-8">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                    <div className="w-20 h-20 bg-[#57b894]/10 rounded-[2rem] flex items-center justify-center text-[#57b894]"><Building2 size={32} /></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase italic">{storeData?.store_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Owner: {storeData?.owner_full_name}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label htmlFor="settings-email" className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Email</label>
                      <input id="settings-email" readOnly value={user.email} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-400 outline-none" placeholder="Email Address" title="Email" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="settings-phone" className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Phone</label>
                      <input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#57b894]/20" placeholder="09xxxxxxxxx" title="Phone Number" />
                    </div>
                    <button onClick={handleUpdateSettings} disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#57b894] flex items-center justify-center gap-2 transition-all active:scale-95">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 no-scrollbar">
            <button 
              onClick={() => { setIsModalOpen(false); setEditingProduct(null); setSelectedFile(null); }} 
              className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"
              aria-label="Close Modal"
            >
              <X />
            </button>
            <h2 className="text-3xl font-black text-slate-900 uppercase italic mb-8">
              {editingProduct ? 'Update' : 'New'} <span className="text-[#57b894]">Product</span>
            </h2>
            
            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="p-name" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Product Name</label>
                <input id="p-name" required name="name" defaultValue={editingProduct?.name} placeholder="What are we selling, Bes?" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
              </div>

              <div className="space-y-1">
                <label htmlFor="p-desc" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Description</label>
                <textarea 
                  id="p-desc" 
                  name="description" 
                  defaultValue={editingProduct?.description} 
                  placeholder="Describe your product (e.g. ingredients, size, spice level...)" 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold min-h-[100px] resize-none text-sm text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="p-price" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Price</label>
                  <input id="p-price" required name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="0.00" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="p-stock" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Stock</label>
                  <input id="p-stock" required name="stock" type="number" defaultValue={editingProduct?.stock_level} placeholder="Quantity" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="p-cat" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Category</label>
                <select id="p-cat" name="category" defaultValue={editingProduct?.category || 'Food'} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none" title="Product Category">
                  <option value="Food">Food</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Grocery">Grocery</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Photo</span>
                <label 
                  htmlFor="p-img" 
                  className="w-full h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-all focus-within:ring-2 focus-within:ring-[#57b894]/20"
                >
                  <input id="p-img" type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  {selectedFile ? (
                    <div className="text-[#57b894] font-black text-[10px] flex items-center gap-2">
                      <Check size={14}/> <span>{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="text-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase mt-1">Product Photo</span>
                    </>
                  )}
                </label>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-[#57b894] transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin" /> : editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}