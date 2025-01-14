import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import moment from 'moment';
import { Row, Col, Card } from 'antd';
import apiMain from '../utils/apiMain';
import DataUsageChart from './components/DataUsageChart';
import ConnectionStatusChart from './components/ConnectionStatusChart';
import Loader from './components/Loader';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { DeviceInfo } from '../types/DataTypes';
import { isEmbedded } from '../utils/isEmbedded';

const Detail: React.FC = () => {
	const { id, oid } = useParams<{ id: string; oid: string; }>();
	const location = useLocation();

	const [info, setInfo] = useState<DeviceInfo | null>(null);
	const [extraData, setExtraData] = useState<{monthlyRate: string, wirelessPlan: string}>({monthlyRate: '', wirelessPlan: ''});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const getInfo = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await apiMain.get(`/get_device/${id}`);
			await setInfo(response.data.result);
			await setExtraData(response.data.extraData);
			await setIsLoading(false);
		}
		catch (error) {
			console.error('Error fetching device data:', error);
		}
	}, [id]);

	const duration = useMemo(() => {
		if (!info) return null;
		return moment.duration(moment().diff(moment(info.logtime)));
	}, [info])

	useEffect(() => {
		getInfo();
	}, [getInfo]);

	if (isLoading) return <Loader />

	return (
		<>
			{
				info &&
				<div className='p-[10px] md:p-[20px] flex flex-col gap-[20px] max-w-full'>
					<div className='flex justify-start items-center gap-[20px] mb-[20px]'>
						<Link to={`/layout/dashboard${isEmbedded() ? `?email=${new URLSearchParams(location.search).get('email')}` : ''}`}><ArrowLeftOutlined className='text-[#026670] text-2xl font-bold' /></Link>
						<h2 className='text-[#026670] text-2xl font-bold'>
							{info.name || ''}
						</h2>
						<div
							className='rounded-[5px] text-[#fff] text-[12px] px-[10px] py-[2px]'
							style={{
								backgroundColor: info.online ? '#3EB044' : '#AAA',
							}}
						>
							{info.online ? 'online' : 'offline'}
						</div>
					</div>

					<div className='flex flex-col gap-[15px]'>
						<Row>
							<Col span={24} sm={8} >
								<p>
									Serial Number: {info.serialNumber || ''}
								</p>
							</Col>
							<Col span={24} sm={8} >
								<p>
									Device Models: {info.model || ''}
								</p>
							</Col>
							<Col span={24} sm={8} >
								<p>
									Firmware Version: {info.info?.swVersion || ''}
								</p>
							</Col>
						</Row>
						<Row>
							<Col span={24} sm={8}>
								<p>
									Wireless Plan: {extraData.wirelessPlan}
								</p>
							</Col>
							<Col span={24} sm={8}>
								<p>
									Monthly Rate: {extraData.monthlyRate}
								</p>
							</Col>
							<Col span={24} sm={8}>
								<p>
									Online Duration: {duration ? `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes ${duration.seconds()} seconds` : ''}
								</p>
							</Col>
						</Row>
						<Row>
							<Col span={24} sm={8}>
								<p>
									Created At: {info.createTime ? moment(info.createTime).format('YYYY-MM-DD HH:mm:ss') : ''}
								</p>
							</Col>
							<Col span={24} sm={8}>
								<p>
									Updated At: {info.updateTime ? moment(info.updateTime).format('YYYY-MM-DD HH:mm:ss') : ''}
								</p>
							</Col>
						</Row>
					</div>

					<div className='flex flex-col gap-[20px]'>
						<Card title="Detailed Information">
							<div className='flex flex-col gap-[15px]'>
								<Row>
									<Col span={24} sm={8}>
										<p>
											IP: {info.pubIp || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Phone: {info.mobileNumber || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Address: {info.address || ''}
										</p>
									</Col>
								</Row>

								<Row>
									<Col span={24} sm={8}>
										<p>
											Uplink: {''} {/* Add logic here if there's data */}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Configuration State: {info.config?.sync || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Login Protocol: {info.protocol || ''}
										</p>
									</Col>
								</Row>

								<Row>
									<Col span={24} sm={8}>
										<p>
											IMSI: {info.info?.imsi || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											IMEI: {info.info?.imei || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											ICCID: {info.info?.iccid || ''}
										</p>
									</Col>
								</Row>

								<Row>
									<Col span={24} sm={8}>
										<p>
											Hardware Version: {info.info?.hwVersion || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Bootloader Version: {info.info?.bootVersion || ''}
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Reconnect Reason: {info.info?.reconnectReason || ''}
										</p>
									</Col>
								</Row>

								{/* <Row>
									<Col span={24} sm={8}>
										<p>
											Wireless Plan: {extraData.wirelessPlan} 
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Monthly Rate: {extraData.monthlyRate} 
										</p>
									</Col>
									<Col span={24} sm={8}>
										<p>
											Description: {''}
										</p>
									</Col>
								</Row> */}
							</div>
						</Card>

						{
							id && oid &&
							<div className='max-w-full overflow-auto'>
								<DataUsageChart id={id} oid={oid} />
							</div>
						}
						{
							id && oid &&
							<div className='max-w-full overflow-auto'>
								<ConnectionStatusChart id={id} />
							</div>
						}
					</div>
				</div>
			}
		</>
	);
}

export default Detail;
