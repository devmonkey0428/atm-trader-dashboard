import React, { useEffect, useState, useCallback } from 'react';
import { Collapse, CollapseProps, notification } from 'antd';
import moment from 'moment';
import apiMain from '../utils/apiMain';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from './components/Loader';
import { RawDeviceData, RawAccountData, DashboardData } from '../types/DataTypes';
import DashboardTable from './components/DashboardTable';
import { isEmbedded } from '../utils/isEmbedded';


const Dashboard: React.FC<{ data: DashboardData[], setData: React.Dispatch<React.SetStateAction<DashboardData[]>> }> = ({ data, setData }) => {
	const navigate = useNavigate();
	const location = useLocation();
	// isEmbedded() ? new URLSearchParams(location.search).get('email') || null : localStorage.getItem('email') || null;
	const email = localStorage.getItem('email') || null;

	useEffect(() => {
		if (isEmbedded() && new URLSearchParams(location.search).get('email') !== null) {
			localStorage.setItem('emailFromParentSite', new URLSearchParams(location.search).get('email') || '')
		}
	}, [])

	const [isLoading, setisLoading] = useState<boolean>(false);


	const getData = useCallback(async () => {
		if (!data.length) {
			setisLoading(true);
		}
		try {
			if (!email) {
				// if (isEmbedded()) {
				// 	navigate('/havetologin');
				// } else {
					navigate('/login');
				// }
				return;
			}
			const response = await apiMain.post('/get_devices_list', { email: email });
			const rawData = response.data.data;

			if (rawData.length === 0) {
				notification.warning({
					message: response.data.message,
					placement: 'topRight'
				});
				if (!isEmbedded) {
					setTimeout(() => {
						localStorage.removeItem('email');
						navigate('/login');
					}, 1000);
					return;
				} else {
					navigate('/empty');
				}
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
						signalStrength: device.signalStrength?.level ?? 0,
					};
				});
				return {
					accountName: item.accountName,
					devices,
				};
			});

			setisLoading(false);
			setData(formattedData);
		} catch (error) {
			localStorage.removeItem('email');
			navigate('/login');
			console.error('Error fetching device data:', error);
		}
	}, [navigate, setData]);

	useEffect(() => {
		getData();
	}, [getData]);

	const [collapseData, setCollapseData] = useState<CollapseProps['items']>([])

	useEffect(() => {
		setCollapseData(
			data.map((item, index) => {
				return {
					key: index,
					label: <span className='underline text-[16px] font-bold' >{item.accountName}</span>,
					children: <DashboardTable data={item.devices} />
				}
			})
		)
	}, [data])

	if (isLoading) return <Loader />

	return (
		<>
			<div className='p-[20px] overflow-auto'>
				<div className='min-w-[1200px]'>
					<Collapse items={collapseData} ghost defaultActiveKey={['0']} />
				</div>
			</div>
		</>
	);
};

export default Dashboard;
