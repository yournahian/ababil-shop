import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signup(name, email, role);
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center pt-28 pb-12 px-6">
        <div className="w-full max-w-md p-8 glass rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 text-sm mb-8">Join the decentralized marketplace.</p>
          
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* Role Toggle */}
            <div className="p-1 bg-black/40 rounded-xl flex items-center mb-4 border border-white/10">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'buyer' ? 'bg-primary text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'seller' ? 'bg-primary text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                Seller
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button type="submit" className="w-full py-4 rounded-xl bg-primary text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all uppercase tracking-wider mt-4">
              Sign Up
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
