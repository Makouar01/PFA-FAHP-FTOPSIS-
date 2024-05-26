import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import FAHP from './pages/Fahp';
import FTOPSIS from './pages/Topsis';
import Home from './pages/Home';

function AppRouter() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home/*" element={<Home />} />
          <Route path="/fahp" element={<FAHP />} />
          <Route path="/ftopsis" element={<FTOPSIS />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;
