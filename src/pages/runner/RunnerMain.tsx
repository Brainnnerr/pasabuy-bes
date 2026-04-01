import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import RunnerDashboard from './RunnerDashboard';
import { 
  Clock, Camera, ArrowRight, CheckCircle2, 
  MapPin, Phone, Calendar 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RunnerMain() {
  const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'verified'>('loading');
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRunnerStatus();
  }, []);

  const fetchRunnerStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data } = await supabase.from('runners').select('status').eq('id', user.id).single();
      if (data) setStatus(data.status as any);
      else setStatus('none');
    } else {
      navigate('/login');
    }
  };

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload a valid ID first, Bes!");
    
    setUploading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('runners').insert([{ 
        id: user.id, 
        full_name: user.user_metadata.full_name,
        email: user.email,
        birthday: formData.get('birthday'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        id_url: filePath,
        status: 'pending' 
      }]);

      if (insertError) throw insertError;
      
      setStatus('pending');
    } catch (error: any) {
      alert("Submission failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#57b894] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black italic text-[#57b894] uppercase tracking-widest text-xs">Accessing Portal...</p>
        </div>
      </div>
    );
  }

  if (status === 'verified') return <RunnerDashboard user={user} />;

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#f8fafc]">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-orange-100 text-[#f28e1c] rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xl shadow-orange-200/50">
            <Clock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              APPLICATION <span className="text-[#f28e1c]">SENT!</span>
            </h2>
            <p className="text-slate-500 font-bold leading-relaxed italic text-sm px-4">
              Please wait, Bes! Our Admin is currently verifying your documents. This usually takes less than 24 hours.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#57b894] hover:border-[#57b894] transition-all shadow-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 flex flex-col items-center justify-center">
      <form 
        onSubmit={handleApply} 
        className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom duration-700 border border-slate-50"
      >
        <header className="text-center">
          <div className="bg-[#f28e1c]/10 text-[#f28e1c] w-fit px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mx-auto mb-4">Runner Recruitment</div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-none tracking-tighter">
            Join The <span className="text-[#f28e1c]">Fleet</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 italic">Verify your identity to start earning</p>
        </header>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label htmlFor="birthday" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
                <Calendar size={10}/> Birthday
              </label>
              <input required id="birthday" name="birthday" type="date" className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#f28e1c] focus:bg-white outline-none font-bold text-slate-700 transition-all" />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
                <Phone size={10}/> Phone Number
              </label>
              <input required id="phone" name="phone" type="tel" placeholder="09..." className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#f28e1c] focus:bg-white outline-none font-bold text-slate-700 transition-all" />
            </div>
          </div>
          
          <div className="space-y-1">
              <label htmlFor="address" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
                <MapPin size={10}/> Current Address
              </label>
              <input required id="address" name="address" type="text" placeholder="Street, Brgy, Borongan City" className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#f28e1c] focus:bg-white outline-none font-bold text-slate-700 transition-all" />
          </div>

          <input 
  type="file" 
  id="id_upload"
  ref={fileInputRef} 
  className="hidden" 
  accept="image/*" 
  title="Upload ID Document"
  aria-label="Upload Valid ID Image"
  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
/>

          {/* FIX: Removed role="button" and tabIndex from container to avoid nested interactive elements */}
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className={`p-10 rounded-[2rem] border-4 border-dashed flex flex-col items-center gap-4 cursor-pointer transition-all ${
              selectedFile 
              ? "bg-emerald-50 border-[#57b894] text-[#57b894]" 
              : "bg-orange-50 border-orange-100 text-[#f28e1c] hover:bg-orange-100 hover:border-orange-200"
            }`}
          >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 size={40} />
                  <div className="text-center">
                    <p className="text-xs font-black uppercase truncate max-w-[200px]">{selectedFile.name}</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} 
                      className="text-[10px] font-black underline text-slate-400 mt-1 uppercase hover:text-rose-500"
                    >
                      Change File
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-[#f28e1c]"><Camera size={32} /></div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600">Upload Valid ID</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">UMID, Driver's License, or Student ID</p>
                  </div>
                </>
              )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading} 
          className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-95 transition-all uppercase disabled:opacity-50 disabled:bg-slate-400"
        >
          {uploading ? 'Processing...' : 'Submit Application'}
          {!uploading && <ArrowRight />}
        </button>
      </form>
    </div>
  );
}