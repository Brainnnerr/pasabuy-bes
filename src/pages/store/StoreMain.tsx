import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import StoreDashboard from './StoreDashboard'; 
import StoreApplication from './StoreApplication'; 
import { Store } from 'lucide-react'; // Removed unused Clock
import { useNavigate } from 'react-router-dom';

export default function StoreMain() {
  const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'active' | 'suspended'>('loading');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStoreStatus = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      setUser(authUser);
      const { data, error } = await supabase
        .from('stores')
        .select('status')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        setStatus('none');
      } else {
        setStatus(data.status as any);
      }
    } else {
      navigate('/login');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#57b894] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black italic text-[#57b894] uppercase tracking-widest text-[10px]">Accessing Portal...</p>
        </div>
      </div>
    );
  }

  if (status === 'active') return <StoreDashboard user={user} />;

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#fcfdfe]">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-50 text-[#57b894] rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xl shadow-emerald-100">
            <Store size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Application <span className="text-[#57b894]">Received!</span>
            </h2>
            <p className="text-slate-500 font-bold leading-relaxed italic text-sm">
              Hang tight, Partner! Our Admin is reviewing your Business Permit. You'll get access to the dashboard once verified.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#57b894] hover:border-[#57b894] transition-all active:scale-95"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // If status is 'none' or 'suspended', show the application form
  return <StoreApplication user={user} onComplete={() => setStatus('pending')} />;
}