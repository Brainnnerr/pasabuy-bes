import { useState } from 'react';
import { supabase } from '../../api/supabase';
import { Plus, Package, Trash2, Edit3, Search } from 'lucide-react';

interface StoreProductsProps {
  products: any[];
  onAdd: () => void;
  onEdit: (product: any) => void;
  onRefresh: () => void;
}

export default function StoreProducts({ products, onAdd, onEdit, onRefresh }: StoreProductsProps) {
  const [productSearch, setProductSearch] = useState('');

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product permanently, Bes?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else onRefresh();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    /* Added no-scrollbar utility class here */
    <div className="space-y-8 animate-in fade-in duration-500 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-2xl font-black uppercase italic text-slate-800">
          Product <span className="text-[#57b894]">Catalog</span>
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#57b894]" size={16} />
            <input 
              type="text" 
              placeholder="Find item..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#57b894]/10"
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={onAdd}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50 group hover:shadow-xl transition-all duration-500 flex flex-col">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              {p.image_url ? (
                <img 
                  src={supabase.storage.from('products').getPublicUrl(p.image_url).data.publicUrl} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  alt={p.name} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Package size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#57b894]">
                ₱{p.price}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-black text-slate-800 uppercase italic leading-none">{p.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{p.category}</p>
              
              {/* NEW: Product Description with placeholder and line clamping */}
              <p className="text-[11px] leading-relaxed text-slate-500 mt-4 line-clamp-2 italic">
                {p.description || "No description provided, Bes! Click edit to add details. ✨"}
              </p>

              <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-50">
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${p.stock_level > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {p.stock_level} In Stock
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(p)}
                    title="Edit Product" aria-label="Edit" 
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#57b894] transition-all"
                  >
                    <Edit3 size={14}/>
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    title="Delete Product" aria-label="Delete" 
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}