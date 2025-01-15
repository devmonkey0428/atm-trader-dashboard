import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { notification } from 'antd';
import Empty from './pages/Empty';
import HavetoLogin from './pages/HavetoLogin';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import Layout from './pages/Layout';
import { DashboardData } from './types/DataTypes';
import { validateEmbedding } from './embedValidator';

const App: React.FC = () => {

  const [data, setData] = useState<DashboardData[]>([]);

  useEffect(() => {
    const sendHeightToParent = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'UPDATE_HEIGHT', height }, 'https://atmtrader.com');
    };

    // Observe height changes
    const observer = new ResizeObserver(() => {
      sendHeightToParent();
    });

    observer.observe(document.body);

    // Send initial height
    sendHeightToParent();

    // Cleanup the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

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
        <Route path="havetologin" element={<HavetoLogin />} />
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
