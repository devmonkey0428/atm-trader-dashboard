import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { notification } from 'antd';
import Empty from './pages/Empty';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import Layout from './pages/Layout';
import { DashboardData } from './types/DataTypes';
import { validateEmbedding } from './embedValidator';

const App: React.FC = () => {

  const [data, setData] = useState<DashboardData[]>([]);
  
  notification.config({
    duration: 3,
  });

  if (!validateEmbedding()) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="layout/dashboard" />} />
        <Route path="empty" element={<Empty />} />
        <Route path="login" element={<Login data={data} setData={setData} />} />
        <Route path='layout' element={<Layout />}>
          <Route path='dashboard' element={<Dashboard data={data} setData={setData} />} />
          <Route path='detail/:id/:oid' element={<Detail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
