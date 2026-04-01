import { useState } from 'react';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  User, Store, Truck, X, Mail, Lock, 
  UserCircle, ArrowLeft, ShoppingBag, 
  Eye, EyeOff, Loader2 
} from 'lucide-react';

type Role = 'client' | 'store' | 'runner' | 'admin';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // Hardcoded Admin Bypass for testing
          if (email === 'admin@pasabuy.com' && password === 'admin123') {
            return navigate('/admin/dashboard');
          }
          throw error;
        }

        // Fetch user profile to determine where to send them
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw new Error("Profile not found. Please contact support.");

        const role = profile?.role;

        if (role === 'admin' || email === 'admin@pasabuy.com') navigate('/admin/dashboard');
        else if (role === 'runner') navigate('/runner/dashboard');
        else if (role === 'store') navigate('/store/dashboard');
        else navigate('/client/home');

      } else {
        // --- REGISTRATION LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName, 
              role: selectedRole,
              store_name: selectedRole === 'store' ? storeName : null 
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;
        alert('📦 Registration Success! We sent a confirmation link to your Gmail. Please click it before trying to log in, Bes!');
        setSelectedRole(null);
        setIsLogin(true); // Switch to login view for convenience
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please type your email address in the field first, Bes! 📧");
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("Bes, check your Gmail! We sent the reset link there. 📬");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const RoleCard = ({ role, title, icon: Icon, color }: { role: Role, title: string, icon: any, color: string }) => (
    <button 
      disabled={isLoading}
      onClick={() => { setSelectedRole(role); setIsLogin(true); setShowPassword(false); }}
      className="group flex flex-row md:flex-col items-center gap-6 md:gap-4 p-6 md:p-12 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-[#57b894] hover:shadow-2xl hover:shadow-[#57b894]/10 transition-all w-full disabled:opacity-50"
    >
      <div className={`p-4 md:p-6 rounded-2xl ${color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon className="w-6 h-6 md:w-10 md:h-10" />
      </div>
      <div className="flex flex-col md:items-center text-left md:text-center">
        <span className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight italic">{title}</span>
        <span className="text-xs text-slate-400 font-bold md:mt-1">Enter Portal</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center p-6 md:p-12">
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 font-black text-xs hover:text-[#57b894] transition-all tracking-[0.2em]">
          <ArrowLeft size={18} /> BACK TO HOME
        </button>
      </div>

      <div className="w-full max-w-6xl flex flex-col items-center text-center">
        <img src="/pb-logo.png" alt="Logo" className="h-20 md:h-28 mb-10 drop-shadow-xl" />
        <div className="mb-12 md:mb-20">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
            Choose Your <span className="text-[#57b894]">Portal</span>
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mt-4 italic">
            Select your account type to continue to PasaBuy Bes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 w-full">
          <RoleCard role="client" title="Client" icon={User} color="bg-blue-500" />
          <RoleCard role="store" title="Store Partner" icon={Store} color="bg-[#57b894]" />
          <RoleCard role="runner" title="Runner" icon={Truck} color="bg-[#f28e1c]" />
        </div>
      </div>

      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-[3.5rem] shadow-2xl overflow-y-auto relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedRole(null)} 
              aria-label="Close Portal" title="Close Portal"      
              className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-10 pb-0 pt-20 sm:pt-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-none">
                {selectedRole} <br />
                <span className="text-[#57b894]">Portal</span>
              </h3>
              
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-10">
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 text-xs font-black rounded-xl transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>LOGIN</button>
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 text-xs font-black rounded-xl transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>REGISTER</button>
              </div>
            </div>

            <form onSubmit={handleAuth} className="p-10 space-y-4">
              {!isLogin && (
                <>
                  <div className="relative group">
                    <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#57b894]" size={22} />
                    <input required type="text" placeholder="Full Name" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  
                  {selectedRole === 'store' && (
                    <div className="relative group">
                      <ShoppingBag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#57b894]" size={22} />
                      <input required type="text" placeholder="Store Name" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </div>
                  )}
                </>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#57b894]" size={22} />
                <input required type="email" placeholder="Email Address" className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#57b894]" size={22} />
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full pl-14 pr-14 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#57b894] focus:bg-white outline-none font-bold text-slate-700 transition-all" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {isLogin && (
                <button 
                  type="button" 
                  disabled={isLoading}
                  onClick={handleForgotPassword}
                  className="text-[10px] font-black text-[#57b894] uppercase tracking-widest hover:underline ml-2 disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              )}
              
              <button 
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 mt-4 uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  isLogin ? 'Continue' : 'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}