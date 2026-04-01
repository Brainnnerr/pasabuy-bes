import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';

// Admin Pages
import AdminMain from './pages/admin/AdminMain';
import AdminRunners from './pages/admin/AdminRunners';
import AdminStores from './pages/admin/AdminStores';

// Other Role Pages
import RunnerMain from './pages/runner/RunnerMain';
import StoreMain from './pages/store/StoreMain';

// Client Pages
import ClientHome from './pages/client/ClientHome'; // Import the client home

import ClientOrders from './pages/client/ClientOrders';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* --- ADMIN SUITE ROUTES --- */}
        <Route path="/admin/dashboard" element={<AdminMain />} />
        <Route path="/admin/runners" element={<AdminRunners />} />
        <Route path="/admin/stores" element={<AdminStores />} />
        
        {/* --- RUNNER ROUTES --- */}
        <Route path="/runner/dashboard" element={<RunnerMain />} />

        
<Route path="/client/home" element={<ClientHome />} />
<Route path="/client/orders" element={<ClientOrders />} />

        {/* --- STORE ROUTES --- */}
        <Route path="/store/dashboard" element={<StoreMain />} />
        <Route path="/store/products" element={<StoreMain />} />
        <Route path="/store/orders" element={<StoreMain />} />
        <Route path="/store/settings" element={<StoreMain />} />

        {/* --- CLIENT ROUTES --- */}
        <Route path="/client/home" element={<ClientHome />} />

        {/* Fallback to Landing if route doesn't exist */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;