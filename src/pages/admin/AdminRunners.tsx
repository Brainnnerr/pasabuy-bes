import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  Check, X, Eye, MapPin, Wallet, Search, 
  Calendar, Phone, ShieldCheck, Clock, AlertCircle
} from 'lucide-react';

type RunnerTab = 'pending' | 'verified' | 'rejected' | 'on_duty';

export default function AdminRunners() {
  const [runners, setRunners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<RunnerTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRunner, setSelectedRunner] = useState<any | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchRunners();
  }, [activeTab]);

  const fetchRunners = async () => {
    let query = supabase.from('runners').select('*');

    if (activeTab === 'on_duty') {
      query = query.eq('status', 'verified').eq('is_online', true);
    } else {
      query = query.eq('status', activeTab);
    }

    const { data, error } = await query.order('applied_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching:", error.message);
      return;
    }

    if (data) {
      setRunners(data);
      // Sum revenue for the verified fleet
      const { data: allVerified } = await supabase.from('runners').select('admin_commission_owed').eq('status', 'verified');
      const revenue = allVerified?.reduce((acc, curr) => acc + (curr.admin_commission_owed || 0), 0) || 0;
      setTotalRevenue(revenue);
    }
  };

 const handleAction = async (id: string, newStatus: 'verified' | 'rejected') => {
  console.log("Attempting to update runner:", id, "to status:", newStatus);
  
  const { data, error } = await supabase
    .from('runners')
    .update({ status: newStatus })
    .eq('id', id)
    .select(); // Adding .select() helps verify if the row actually changed

  if (error) {
    console.error("Supabase Error:", error);
    alert("Update failed: " + error.message);
  } else if (data && data.length > 0) {
    // SUCCESS
    setSelectedRunner(null);
    setShowRejectModal(false);
    setRejectReason('');
    fetchRunners(); 
    alert(`Runner successfully ${newStatus}!`);
  } else {
    // This happens if the policy blocks the update or ID is wrong
    alert("No changes made. Check if you are logged in as admin@pasabuy.com");
  }
};

  const filteredRunners = runners.filter(r => 
    r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        
        {/* HEADER & REVENUE */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Runner <span className="text-[#f28e1c]">Fleet</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4 italic text-[#57b894]">Fleet Oversight & Auditing</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><Wallet size={24} /></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Revenue</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter italic">₱{totalRevenue.toLocaleString()}</p>
             </div>
          </div>
        </header>

        {/* TABS & SEARCH */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
          <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full md:w-auto">
            {(['pending', 'verified', 'rejected', 'on_duty'] as RunnerTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f28e1c]" size={18} />
            <input 
              type="text" 
              placeholder="Search fleet..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#f28e1c]/20 font-bold text-sm transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* LIST SECTION */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Current Status</th>
                <th className="px-8 py-6">Commission Owed</th>
                <th className="px-8 py-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRunners.length > 0 ? filteredRunners.map((runner) => (
                <tr key={runner.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-[#f28e1c] group-hover:text-white transition-all uppercase">
                        {runner.full_name?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 uppercase text-sm italic">{runner.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{runner.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      runner.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 
                      runner.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {runner.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-700 italic">₱{runner.admin_commission_owed?.toFixed(2) || '0.00'}</td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedRunner(runner)}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <Clock className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-300 font-black uppercase italic tracking-widest text-xs">No entries found for {activeTab}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* REVIEW MODAL */}
        {selectedRunner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in-95 duration-300">
              
              {/* Document Side */}
              <div className="flex-1 bg-slate-50 p-10 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tight">Runner Documentation</h3>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <ShieldCheck className="text-[#57b894]" size={20} />
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 overflow-hidden relative group">
                  {selectedRunner.id_url ? (
                    <img 
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/verifications/${selectedRunner.id_url}`} 
                      className="w-full h-full object-contain p-4"
                      alt="Valid ID"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 italic">
                      <AlertCircle size={48} />
                      No document found in storage
                    </div>
                  )}
                </div>
              </div>

              {/* Info Side */}
              <div className="w-full md:w-[400px] p-12 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedRunner.full_name}</h2>
                    <p className="text-[#f28e1c] font-black text-[10px] uppercase tracking-widest mt-4">Applicant Profile</p>
                  </div>
                  <button onClick={() => setSelectedRunner(null)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8 flex-1">
                  {[
                    { l: 'Birthday', v: selectedRunner.birthday, i: Calendar },
                    { l: 'Contact', v: selectedRunner.phone, i: Phone },
                    { l: 'Residential Address', v: selectedRunner.address, i: MapPin }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl text-slate-400"><item.i size={20}/></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.l}</p>
                        <p className="text-sm font-bold text-slate-700 leading-tight">{item.v || 'Not provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="mt-12 space-y-4">
                  {activeTab === 'pending' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleAction(selectedRunner.id, 'verified')}
                        className="bg-[#57b894] text-white py-6 rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setShowRejectModal(true)}
                        className="bg-rose-500 text-white py-6 rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase italic">Runner is already {activeTab}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REJECTION REASON MODAL */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8">
              <header className="text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-none">Rejection Reason</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Required for Runner Notification</p>
              </header>

              <textarea 
                className="w-full h-32 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:border-rose-500 outline-none font-bold text-slate-700 transition-all resize-none"
                placeholder="Ex: ID is expired or blurry..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase bg-slate-100 text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAction(selectedRunner.id, 'rejected')}
                  className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase bg-rose-500 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}