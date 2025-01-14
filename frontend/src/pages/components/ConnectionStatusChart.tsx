import React, { useEffect, useState, useCallback } from 'react';
import { Card, Select, DatePicker, Table, TableProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import apiMain from '../../utils/apiMain.ts';
import dayjs, { Dayjs } from 'dayjs';
import { BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { StatusData, PropsPickDateAndMethod } from '../../types/DataTypes';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';

const PickDateAndMethod: React.FC<PropsPickDateAndMethod> = ({
    method,
    setMethod,
    dateRange,
    setDateRange
}) => {
    return (
        <div className='flex items-center gap-2'>
            <Select
                style={{ width: 100 }}
                value={method}
                options={[
                    { value: 'chart', label: <span className='flex items-center gap-2'><BarChartOutlined/>Chart</span> },
                    { value: 'list', label: <span className='flex items-center gap-2'><UnorderedListOutlined/>List</span> }
                ]}
                onChange={(val) => setMethod(val)}
            />
            <RangePicker
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                style={{ width: 220 }}
                format={dateFormat}
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={(_, val) => { setDateRange(val) }}
            />
        </div>
    );
}

const ConnectionStatusChart: React.FC<{ id: string }> = ({ id }) => {

    const [dateRange, setDateRange] = useState<Dayjs[] | string[]>([dayjs().subtract(1, 'day').format(dateFormat), dayjs().format(dateFormat)]);
    const [method, setMethod] = useState<string>('chart');

    const [data, setData] = useState<StatusData[]>([]);

    const columns: TableProps<StatusData>['columns'] = [
        {
            title: 'Time',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (startTime: number) => dayjs(startTime * 1000).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: 'Event',
            dataIndex: 'status',
            key: 'status',
            render: (status: number) => status === 0 ? 'Logout' : 'Login',
        }
    ];

    const getConnectionStatus = useCallback(async () => {
        try {
            const response = await apiMain.get(`/get_connection_status/${id}?start_time=${dayjs(dateRange[0]).unix()}&end_time=${dayjs(dateRange[1]).unix()}`);
            const chartData = await response.data.result;
            await setData(chartData.map(([startTime, status]: [number, number]) => ({ startTime, status })));
        } catch (error) {
            console.log('Error occurred while getting connection status: ', error);
        }
    }, [id, dateRange]);

    useEffect(() => {
        getConnectionStatus();
    }, [getConnectionStatus]);



    const seriesData = data.map((entry, index) => {
        if (index < data.length - 1) {
            const nextEntry = data[index + 1];
            return {
                name: entry.status === 0 ? 'Offline' : entry.status === 1 ? 'Online' : 'Abnormal',
                value: [
                    entry.startTime * 1000,
                    nextEntry ? nextEntry.startTime * 1000 : new Date().getTime(),
                    entry.status,
                ],
            };
        }
    });

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: {
                value: [number, number, number];
                name: string;
                seriesName: string;
            }) => {
                const start = dayjs(params.value[0]).format('YYYY-MM-DD HH:mm');
                const end = dayjs(params.value[1]).format('YYYY-MM-DD HH:mm');
                return `<div>
                    <div class='flex items-center justify-center gap-2'><div class='rounded-full w-[10px] h-[10px]' style='background-color: ${params.name === 'Offline' ? '#c4c4c4' : params.name === 'Online' ? '#4caf50' : '#f44336'};'></div>${params.name}</div>
                    <div class='text-xs text-gray-500'>${start} - ${end}</div>
                </div>`
            },
        },
        grid: {
            left: '10px',
            right: '10px',
            bottom: '50px',
            containLabel: true,
        },
        xAxis: {
            type: 'time',
            boundaryGap: true,
            axisLabel: {
                formatter: (value: number) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
                },
            },
        },
        yAxis: {
            type: 'category',
            data: ['Offline', 'Online', 'Abnormal'],
        },
        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: 0,
                start: 0,
                end: 100,
                filterMode: 'none'
            },
            {
                type: 'inside',
                xAxisIndex: 0,
                start: 0,
                end: 100,
            },
        ],
        series: [
            {
                type: 'custom',
                name: 'Status',
                smooth: true,
                renderItem: (_params: unknown, api: {
                    value: (index: number) => number;
                    coord: (params: [number, number]) => [number, number];
                    style: (params: { fill: string }) => {
                        fill: string;
                        [key: string]: string | number;
                    };
                }) => {
                    const categoryIndex = api.value(2);
                    const startCoord = api.coord([api.value(0), categoryIndex]);
                    const endCoord = api.coord([api.value(1), categoryIndex]);
                    const barHeight = 30;

                    const color =
                        categoryIndex === 0 // Offline
                            ? '#c4c4c4'
                            : categoryIndex === 1 // Online
                                ? '#4caf50'
                                : '#f44336'; // Abnormal

                    return {
                        type: 'rect',
                        shape: {
                            x: startCoord[0],
                            y: startCoord[1] - barHeight / 2,
                            width: endCoord[0] - startCoord[0],
                            height: barHeight,
                        },
                        style: api.style({
                            fill: color,
                        }),
                    };
                },
                encode: {
                    x: [0, 1], // Start and end times
                    y: 2, // Category index
                },
                data: seriesData,
                clip: true,
            },
        ],
    };

    return (
        <>
            <Card className='min-w-[700px]' title='Connection Status' extra={<PickDateAndMethod method={method} setMethod={setMethod} dateRange={dateRange} setDateRange={setDateRange} />}>
                {
                    method === 'chart' ? 
                    <ReactECharts
                        option={option}
                        style={{ height: 250 }}
                    />
                    : <Table
                        size='small'
                        columns={columns}
                        dataSource={data}
                        pagination={false}
                    />
                }
            </Card>
        </>
    );
}

export default ConnectionStatusChart;
