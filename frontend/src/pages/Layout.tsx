import React from 'react';
import Header from './components/Header';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <>
      <Header/>
      <Outlet/>
    </>
  );
}

export default Layout;
