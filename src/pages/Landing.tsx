import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, Store, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col font-sans selection:bg-[#57b894] selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Content */}
          <div className="flex flex-col text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#57b894]/10 text-[#57b894] text-xs font-bold uppercase tracking-widest rounded-full border border-[#57b894]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#57b894] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#57b894]"></span>
                </span>
                Now Serving Borongan
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tight">
                Your Campus <br />
                <span className="text-[#57b894]">Super App.</span>
              </h1>
              
              <p className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Gutom? Kapoy? Pa-Buy, Bes dayon! The most reliable way to get ESSU favorites and city essentials delivered to your doorstep.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate('/login')}
                className="group bg-[#f28e1c] hover:bg-[#e07d10] text-white text-lg font-bold py-5 px-10 rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                GET STARTED
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              {[
                { icon: <ShoppingBag className="text-[#57b894]" />, label: 'Shop' },
                { icon: <Truck className="text-[#f28e1c]" />, label: 'Deliver' },
                { icon: <Store className="text-blue-500" />, label: 'Partner' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center lg:items-start gap-1">
                  <div className="p-2 bg-slate-50 rounded-lg">{item.icon}</div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Visual Image */}
          <div className="relative order-first lg:order-last animate-in fade-in zoom-in duration-1000">
            {/* Abstract Decorative Circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#57b894]/20 to-transparent rounded-full blur-3xl -z-10"></div>
            
            <img 
              src="/pb-logo.png" 
              alt="PasaBuy Bes" 
              className="w-full h-auto max-w-sm md:max-w-md mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] animate-float" 
            />
          </div>

        </div>
      </main>

      {/* --- FOOTER (Centered Text) --- */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; 2026 PasaBuy Bes. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}