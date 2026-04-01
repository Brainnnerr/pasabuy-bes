import { useEffect, useState } from 'react';
import { User, Mail, Calendar, LogOut, X } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useNavigate } from 'react-router-dom';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Fetch extra details from your profiles table if you have one
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({
        ...authUser,
        profile_name: profile?.full_name || 'PasaBuy User',
        role: profile?.role || 'Client'
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* --- HEADER/AVATAR SECTION --- */}
        <div className="bg-[#57b894] p-8 text-center relative">
          <button 
  onClick={onClose} 
  title="Close Profile"
  aria-label="Close Profile"
  className="absolute top-6 right-6 p-2 bg-black/10 rounded-full text-white hover:bg-black/20 transition-all"
>
  <X size={18} />
</button>
          
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-[#57b894] shadow-lg">
            <User size={48} />
          </div>
          <h3 className="text-xl font-black uppercase italic text-white leading-none">
            {loading ? 'Loading...' : user?.profile_name}
          </h3>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 bg-emerald-700/20 px-3 py-1 rounded-full mt-2 inline-block">
            {user?.role || 'Member'}
          </span>
        </div>

        {/* --- DETAILS SECTION --- */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="bg-white p-2 rounded-xl shadow-sm text-[#57b894]"><Mail size={16}/></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Address</span>
                <span className="text-xs font-bold text-slate-700">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="bg-white p-2 rounded-xl shadow-sm text-[#57b894]"><Calendar size={16}/></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Member Since</span>
                <span className="text-xs font-bold text-slate-700">
                  {user ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '---'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleLogout} 
              className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
              Sign Out, Bes!
            </button>
            <button 
              onClick={onClose} 
              className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* --- FOOTER DECOR --- */}
        <div className="bg-slate-50 py-4 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">PasaBuy Borongan v1.0</p>
        </div>
      </div>
    </div>
  );
}