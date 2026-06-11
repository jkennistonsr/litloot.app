import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User, Terminal, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_420px] bg-primary grid-bg relative overflow-hidden">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 bg-secondary rounded-sm flex items-center justify-center glow-cyan mb-4">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
           <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter uppercase text-text-main leading-[0.8] text-center">
             JOIN THE <br /><span className="text-secondary text-glow drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">MARKETPLACE</span>
           </h1>
           <p className="text-text-dim font-mono text-xs tracking-[0.4em] uppercase opacity-60">Secure Access</p>
         </motion.div>
      </div>

      {/* Auth Panel Side */}
      <section className="flex flex-col justify-center p-6 sm:p-8 bg-surface/90 border-l border-border-glow backdrop-blur-xl relative z-20">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-sm mx-auto w-full space-y-6 sm:space-y-8"
        >
          <div className="flex justify-center lg:hidden mb-4">
             <div className="w-16 h-16 bg-secondary rounded-sm flex items-center justify-center glow-cyan">
               <ShoppingCart className="w-8 h-8 text-primary" />
             </div>
          </div>

          <div className="text-center space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-text-main tracking-tight leading-none">Access Account</h2>
            <p className="text-[10px] text-text-dim uppercase tracking-widest">Sign in to continue</p>
          </div>

          <div className="flex bg-text-main/5 p-1 rounded-sm border border-text-main/10">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black transition-all rounded-xs uppercase tracking-widest",
                isLogin ? "bg-secondary text-primary glow-cyan" : "text-text-dim hover:text-text-main"
              )}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black transition-all rounded-xs uppercase tracking-widest",
                !isLogin ? "bg-secondary text-primary glow-cyan" : "text-text-dim hover:text-text-main"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-primary border border-text-main/20 rounded-sm py-4 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-primary border border-text-main/20 rounded-sm py-4 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-primary border border-text-main/20 rounded-sm py-4 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center text-red-500 bg-red-500/5 border border-red-500/10 p-3 rounded-sm cyber-corners">
                <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
                <p className="text-[10px] font-mono leading-tight">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-primary py-4 rounded-sm font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4 relative overflow-hidden group shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)] active:scale-[0.98] force-gpu-layer"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="animate-pulse">ESTABLISHING LINK...</span>
                </div>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? "LOG IN" : "SIGN UP"}
                </>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-text-main/20"></div>
            </div>
            <span className="relative px-4 text-text-dim bg-surface text-[10px] font-bold tracking-[0.2em] uppercase">OR</span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-text-main/5 hover:bg-text-main/10 border border-text-main/20 text-text-main py-4 rounded-sm font-bold text-xs uppercase transition-all flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C9.03,19.27 6.59,17.13 6.59,13.6C6.59,10.07 9.03,7.93 12.19,7.93C14.07,7.93 15.63,8.7 16.5,9.5L18.4,7.6C17.1,6.3 14.8,5.2 12.2,5.2C7.5,5.2 3.7,8.8 3.7,13.6C3.7,18.4 7.5,22 12.2,22C16.8,22 21.5,18.7 21.5,13.5C21.5,12.7 21.4,11.9 21.35,11.1Z"/>
            </svg>
            Continue with Google
          </button>
        </motion.div>

        <div className="mt-auto pt-8 border-t border-text-main/10 flex items-center justify-between opacity-50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full glow-cyan" />
            <span className="text-[10px] font-mono">Connection: Secure</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-text-dim/50">1.0.42</span>
        </div>
      </section>
    </div>
  );
}
