import React, { useState, useCallback } from 'react';
import { Input, Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import ImgLogo from '../assets/logo-green.png';
import Loader from './components/Loader';
import apiMain from '../utils/apiMain';
import moment from 'moment';
import { DashboardData, RawAccountData, RawDeviceData } from '../types/DataTypes';

const Login: React.FC<{ data: DashboardData[], setData: React.Dispatch<React.SetStateAction<DashboardData[]>> }> = ({ setData }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');

  const handleInputEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }

  const [isLoading, setisLoading] = useState<boolean>(false);

  const getData = useCallback(async () => {
    setisLoading(true);
    try {
      const email = localStorage.getItem('email') || null;
      if (!email) {
        navigate('/login');
        return;
      }
      const response = await apiMain.post('/get_devices_list', { email: email });
      const rawData = response.data.data;

      if (rawData.length === 0) {
        notification.warning({
          message: response.data.message,
          placement: 'topRight'
        });
        setTimeout(() => {
          localStorage.removeItem('email');
          setisLoading(false);
        }, 1000);
        return;
      }

      const formattedData = rawData.map((item: RawAccountData) => {
        const devices = item.devices.map((device: RawDeviceData, index: number) => {
          const duration = moment.duration(moment().diff(moment(device.logtime)));
          const days = duration.days();
          const hours = duration.hours();
          const minutes = duration.minutes();
          const seconds = duration.seconds();

          return {
            key: device._id,
            oid: device.oid,
            num: index + 1,
            name: device.name,
            serialNum: device.serialNumber,
            connectionStatus: device.online ? 'Online' : 'Offline',
            connectionDuration: `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`,
            iccid: device.info?.iccid ?? '',
            location: device.address ?? '',
            signalStrength: device.signalStrength?.level ?? '',
          };
        });
        return {
          accountName: item.accountName,
          devices,
        };
      });

      setisLoading(false);
      setData(formattedData);
      navigate('/layout/dashboard');
    } catch (error) {
      localStorage.removeItem('email');
      navigate('/login');
      console.error('Error fetching device data:', error);
    }
  }, [navigate, setData]);

  const handleLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notification.warning({
        message: 'Please input a valid email address',
        placement: 'topRight'
      });
      return;
    }

    if (!email) {
      notification.warning({
        message: 'Please input email',
        placement: 'topRight'
      });
      return;
    }
    localStorage.setItem('email', email);
    // navigate('/layout/dashboard');
    getData();
  }

  const handleKeyupLogin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }

  if (isLoading) return <Loader />

  return (
    <>
      <div className='flex justify-center items-center h-screen'>
        <div className='flex flex-col gap-4 max-w-[300px] w-full mx-[20px]'>
          <img src={ImgLogo} alt='logo' className='w-[200px] mx-auto mb-[20px]' />
          <Input typeof='email' size='large' placeholder='Input you email' prefix={<UserOutlined />} value={email} onChange={handleInputEmail} onKeyUp={handleKeyupLogin} />
          <Button type='primary' size='large' onClick={() => handleLogin()} >Login</Button>
        </div>
      </div>
    </>
  );
}

export default Login;
