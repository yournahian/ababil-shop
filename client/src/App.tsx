import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import { AuthProvider, useAuth } from './context/AuthContext';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CartDrawer from './components/CartDrawer';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'buyer' | 'seller' }> = ({ children, allowedRole }) => {
  const { isLoggedIn, user } = useAuth();
  
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'seller' ? "/seller-dashboard" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ShopProvider>
        <Router>
          <div className="min-h-screen selection:bg-primary selection:text-black">
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRole="buyer">
                    <BuyerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/seller-dashboard" 
                element={
                  <ProtectedRoute allowedRole="seller">
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </ShopProvider>
    </AuthProvider>
  );
};

export default App;
