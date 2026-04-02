import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  Store, CheckCircle, XCircle, Eye, 
  ExternalLink, Calendar, RefreshCw
} from 'lucide-react';

// Added 'suspended' to the valid tab types
type StoreStatus = 'pending' | 'active' | 'suspended';

export default function AdminStores() {
  const [stores, setStores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<StoreStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, [activeTab]);

  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('status', activeTab)
      .order('created_at', { ascending: false });

    if (!error) setStores(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: StoreStatus) => {
    const { error } = await supabase
      .from('stores')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Action failed: " + error.message);
    } else {
      // Refresh the list so the store moves to the correct tab
      fetchStores();
    }
  };

  const getPermitUrl = (path: string) => {
    const { data } = supabase.storage.from('store-permits').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      
      <main className="flex-1 p-10 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic text-slate-900 leading-none tracking-tighter">
              Store <span className="text-[#57b894]">Partners</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 italic">
              Verify and manage store applications
            </p>
          </div>

          {/* UPDATED TABS: Added Suspended Tab */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending ({activeTab === 'pending' ? stores.length : '...'})
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'active' ? 'bg-[#57b894] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setActiveTab('suspended')}
              className={`px-6 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'suspended' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Suspended
            </button>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50 italic">
                  <th className="px-10 py-8">Store Info</th>
                  <th className="px-10 py-8">Owner Details</th>
                  <th className="px-10 py-8">Business Permit</th>
                  <th className="px-10 py-8">Date Applied</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black text-slate-200 uppercase tracking-widest italic">Scanning Database...</td></tr>
                ) : stores.length > 0 ? stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#57b894] shadow-inner shrink-0">
                          <Store size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm italic leading-none">{store.store_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 lowercase">{store.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-10 py-6">
                      <p className="text-xs font-black text-slate-700 uppercase">{store.owner_full_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Authorized Partner</p>
                    </td>

                    <td className="px-10 py-6">
                      <button 
                        onClick={() => setSelectedPermit(getPermitUrl(store.business_permit_url))}
                        title="View Business Permit"
                        aria-label="View Business Permit"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-[#57b894] hover:text-white transition-all shadow-sm"
                      >
                        <Eye size={14} /> View Permit
                      </button>
                    </td>

                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                        <Calendar size={12} />
                        {new Date(store.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(store.id, 'active')}
                              className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                              title="Approve Store"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(store.id, 'suspended')}
                              className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Reject Application"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}

                        {activeTab === 'active' && (
                          <button 
                            onClick={() => handleUpdateStatus(store.id, 'suspended')}
                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"
                          >
                            Suspend Store
                          </button>
                        )}

                        {activeTab === 'suspended' && (
                          <button 
                            onClick={() => handleUpdateStatus(store.id, 'active')}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                          >
                            <RefreshCw size={12} /> Re-activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <Store className="mx-auto text-slate-100 mb-4" size={64} />
                       <p className="text-slate-300 italic font-black uppercase tracking-widest text-xs">No stores in {activeTab} list</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- PERMIT PREVIEW MODAL --- */}
      {selectedPermit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setSelectedPermit(null)}
              aria-label="Close Preview"
              title="Close Preview"
              className="absolute top-0 right-0 p-4 text-white hover:text-rose-500 transition-colors"
            >
              <XCircle size={32} />
            </button>
            <img 
              src={selectedPermit} 
              className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white object-contain animate-in zoom-in-95 duration-300" 
              alt="Business Permit" 
            />
            <div className="mt-8 flex gap-4">
               <a 
                 href={selectedPermit} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
               >
                 <ExternalLink size={16} /> Open Original
               </a>
               <button 
                 onClick={() => setSelectedPermit(null)}
                 className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
               >
                 Close Preview
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}