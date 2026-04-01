import { useState, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { Camera, ArrowRight, Building2, User, CheckCircle2 } from 'lucide-react'; // Cleaned up unused imports

export default function StoreApplication({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload your Business Permit, Partner!");

    setUploading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/permit-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-permits')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('stores').upsert([{ 
        id: user.id, 
        store_name: formData.get('storeName'),
        owner_full_name: formData.get('ownerName'),
        email: user.email,
        business_permit_url: filePath,
        status: 'pending' 
      }]);

      if (insertError) throw insertError;
      onComplete();
    } catch (error: any) {
      alert("Submission failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] p-6 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 border border-slate-50 animate-in fade-in slide-in-from-bottom duration-700">
        <header className="text-center">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Partner <span className="text-[#57b894]">Onboarding</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4 italic">Register your business to start selling</p>
        </header>

        <div className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="storeName" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
              <Building2 size={12}/> Store Name
            </label>
            <input 
              id="storeName"
              required 
              name="storeName" 
              placeholder="Ex: Borongan Delights" 
              className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ownerName" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
              <User size={12}/> Owner Full Name
            </label>
            <input 
              id="ownerName"
              required 
              name="ownerName" 
              placeholder="Your Full Name" 
              className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="permit-upload" className="text-[9px] font-black uppercase text-slate-400 ml-4 italic flex items-center gap-2">
              Business Permit Image
            </label>
            <input 
              id="permit-upload"
              type="file" 
              ref={fileInputRef} 
              title="Upload Business Permit"
              className="hidden" 
              accept="image/*" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className={`p-12 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center gap-4 cursor-pointer transition-all ${
                selectedFile ? "bg-emerald-50 border-[#57b894] text-[#57b894]" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-[#57b894]/30"
              }`}
            >
              {selectedFile ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 size={40} className="mx-auto" />
                  <p className="text-xs font-black uppercase truncate max-w-[250px]">{selectedFile.name}</p>
                  <p className="text-[10px] font-black underline opacity-50">Change File</p>
                </div>
              ) : (
                <>
                  <Camera size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">Tap to Upload Permit Image</p>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading} 
          className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase disabled:opacity-50"
        >
          {uploading ? 'Verifying...' : 'Submit Application'}
          {!uploading && <ArrowRight />}
        </button>
      </form>
    </div>
  );
}