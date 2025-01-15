import { Button } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImgLogo from '../../assets/logo.png';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { isEmbedded } from '../../utils/isEmbedded';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem('email') || null;

  const handleLogout = () => {
    localStorage.removeItem('email');
    navigate('/login');
  }

  return (
    <>
      <div className={`flex justify-between items-center ${isEmbedded() ? 'bg-transparent pt-[20px] pr-[35px] pb-[0px]' : 'bg-[#026670] p-[20px]'}`}>
        {
          isEmbedded() ? (
            <div></div>
          ) : (
            <Link className='w-[140px] md:w-auto' to='/'><img src={ImgLogo} alt='logo' /></Link>
          )
        }
        <div className='flex'>
          <span className={`mr-[10px] text-[18px] hidden md:block ${isEmbedded() ? 'text-[#026670]' : 'text-[#FFF]'}`} ><UserOutlined className='mr-[5px]' />{email}</span>
          <Button type='primary' className={`${!isEmbedded() && 'border-[#FFF]'}`} onClick={() => handleLogout()} >Logout</Button>
        </div>
      </div>

    </>
  );
}

export default Header;
