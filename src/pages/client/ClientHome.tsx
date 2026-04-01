import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { Search, MapPin, ShoppingCart, User, Plus, X, Minus } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

// Import the moved components
import CartDrawer from '../../components/client/CartDrawer';
import ProfileModal from '../../components/client/ProfileModal';

export default function ClientHome() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(2000);
  
  // UI States
  // PERSISTENCE: Initialize cart from localStorage if it exists
  const [cart, setCart] = useState<any[]>(() => {
    const savedCart = localStorage.getItem('pasabuy_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');

  // Selection States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQty, setOrderQty] = useState(1);

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categories = ['All', 'Food', 'Drinks', 'Grocery'];

  // PERSISTENCE: Save to localStorage every time the cart changes
  useEffect(() => {
    localStorage.setItem('pasabuy_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const results = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All' || p.category === category) &&
      p.price <= maxPrice
    );
    setFilteredProducts(results);
  }, [search, category, maxPrice, products]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, stores(store_name)')
      .order('created_at', { ascending: false });
    if (data) {
      setProducts(data);
      setFilteredProducts(data);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === selectedProduct.id);
      if (existing) {
        return prev.map(item => item.id === selectedProduct.id 
          ? { ...item, qty: item.qty + orderQty } 
          : item
        );
      }
      return [...prev, { ...selectedProduct, qty: orderQty }];
    });

    setSelectedProduct(null);
    setOrderQty(1);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-32 font-sans no-scrollbar">
      {/* --- TOP NAVIGATION --- */}
      <nav className="bg-white/80 backdrop-blur-md px-6 py-5 flex justify-between items-center sticky top-0 z-50 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#57b894]/10 p-2 rounded-xl">
            <MapPin size={18} className="text-[#57b894]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Deliver to</p>
            <span className="text-xs font-black uppercase italic text-slate-800">Borongan City, ESSU</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCartOpen(true)}
            title="Open Basket"
            aria-label="Open Basket"
            className="relative p-2.5 bg-slate-100 rounded-2xl text-slate-600 hover:bg-[#57b894] hover:text-white transition-all"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {cart.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            title="User Profile"
            aria-label="User Profile"
            className="p-2.5 bg-slate-100 rounded-2xl text-slate-400 hover:text-[#57b894] transition-all"
          >
             <User size={20} />
          </button>
        </div>
      </nav>

      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Freshly <br /> <span className="text-[#57b894]">Picked, Bes!</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] italic">The best of Borongan, delivered fast.</p>
        </header>

        {/* --- SEARCH & FILTERS --- */}
        <div className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#57b894] transition-colors" size={20} aria-hidden="true" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={search}
              title="Search food, drinks, grocery"
              placeholder="Search food, drinks, grocery..." 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#57b894]/10 font-bold text-sm transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    category === cat ? 'bg-[#57b894] text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 min-w-[200px]">
              <span className="text-[10px] font-black text-slate-400 uppercase italic whitespace-nowrap">Max: ₱{maxPrice}</span>
              <input 
                type="range" min="50" max="2000" step="50"
                value={maxPrice}
                title="Filter by Maximum Price"
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#57b894]"
              />
            </div>
          </div>
        </div>

        {/* --- PRODUCT GRID --- */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {filteredProducts.map((p) => (
            <div 
              key={p.id} 
              onClick={() => { setSelectedProduct(p); setOrderQty(1); }}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50 group hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
            >
              <div className="h-40 md:h-56 bg-slate-100 relative overflow-hidden">
                 <img 
                    src={p.image_url ? supabase.storage.from('products').getPublicUrl(p.image_url).data.publicUrl : '/placeholder.png'} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={p.name} 
                  />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase text-[#57b894] shadow-sm">
                  ₱{p.price}
                </div>
              </div>
              <div className="p-5 md:p-8 flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-[8px] font-black text-[#57b894] uppercase tracking-widest mb-1 italic">{p.stores?.store_name}</p>
                  <h3 className="text-lg font-black text-slate-800 uppercase italic leading-tight line-clamp-1">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 italic font-medium">
                    {p.description || "Fresh and ready, Bes! ✨"}
                  </p>
                </div>
                
                <div className="mt-6 w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 group-hover:bg-[#57b894] group-hover:text-white transition-all">
                  <Plus size={14} /> View Item
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* --- PRODUCT DETAILS MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 no-scrollbar">
            <div className="h-64 relative">
              <img 
                src={selectedProduct.image_url ? supabase.storage.from('products').getPublicUrl(selectedProduct.image_url).data.publicUrl : '/placeholder.png'} 
                className="w-full h-full object-cover" 
                alt={selectedProduct.name} 
              />
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-slate-900 transition-all"
                title="Close"
              >
                <X />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <span className="text-[10px] font-black text-[#57b894] uppercase tracking-widest italic">{selectedProduct.category} • {selectedProduct.stores?.store_name}</span>
                <h2 className="text-3xl font-black text-slate-900 uppercase italic mt-1 leading-none">{selectedProduct.name}</h2>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed italic">
                  {selectedProduct.description || "No description provided, Bes! But we promise it's a great choice. ✨"}
                </p>
              </div>

              <div className="flex items-center justify-between py-6 border-y border-slate-50">
                <span className="text-2xl font-black text-slate-900 italic">₱{selectedProduct.price}</span>
                <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))} 
                    className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-rose-500 transition-all"
                    title="Decrease Quantity"
                    aria-label="Decrease Quantity"
                  >
                    <Minus size={16}/>
                  </button>
                  <span className="font-black text-slate-800 text-lg">{orderQty}</span>
                  <button 
                    onClick={() => setOrderQty(orderQty + 1)} 
                    className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#57b894] transition-all"
                    title="Increase Quantity"
                    aria-label="Increase Quantity"
                  >
                    <Plus size={16}/>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart} 
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-[#57b894] transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Add to Basket • ₱{selectedProduct.price * orderQty}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UI COMPONENTS --- */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} setCart={setCart} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* --- BOTTOM NAV --- */}
      <div className="fixed bottom-6 inset-x-6 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] px-10 py-5 flex justify-between items-center z-50 shadow-2xl">
        {['Home', 'Search', 'Orders', 'Me'].map((item) => (
          <button 
            key={item} 
            onClick={() => {
              setActiveTab(item);
              if (item === 'Search') searchInputRef.current?.focus();
              if (item === 'Me') setIsProfileOpen(true);
              if (item === 'Orders') navigate('/client/orders'); 
            }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item ? 'text-[#57b894]' : 'text-slate-500 hover:text-white'}`}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}