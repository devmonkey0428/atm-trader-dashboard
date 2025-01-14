import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Select, DatePicker } from 'antd';
import ReactEcharts from "echarts-for-react";
import apiMain from '../../utils/apiMain.ts';
import dayjs, { Dayjs } from 'dayjs';
import { PropsPickDateAndUnit, ChartDataPoint } from '../../types/DataTypes';
const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';
const monthFormat = 'YYYY-MM';


const PickDateAndUnit: React.FC<PropsPickDateAndUnit> = ({
    unit,
    setUnit,
    dateRange,
    setDateRange,
    selectedMonth,
    setSelectedMonth
}) => {


    return (
        <div className='flex items-center gap-2'>
            <Select
                style={{
                    width: 100
                }}
                value={unit}
                options={[
                    { value: 'hour', label: 'By hour' },
                    { value: 'day', label: 'By day' }
                ]}
                onSelect={(val) => { setUnit(val) }}
            />
            {
                unit === 'hour' ?
                    <RangePicker
                        style={{ width: 220 }}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                        format={dateFormat}
                        value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                        onChange={(_, val) => { setDateRange(val) }}
                    /> :
                    <DatePicker
                        style={{ width: 100 }}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                        picker='month'
                        format={monthFormat}
                        value={dayjs(selectedMonth, monthFormat)}
                        onChange={(date) => { setSelectedMonth(date || dayjs()) }}
                    />
            }
        </div>
    );
}

const DataUsageChart: React.FC<{ id: string, oid: string }> = ({ id, oid }) => {

    const [unit, setUnit] = useState<string>('hour');
    const [dateRange, setDateRange] = useState<Dayjs[] | string[]>([dayjs().subtract(1, 'day').format(dateFormat), dayjs().format(dateFormat)]);
    const [selectedMonth, setSelectedMonth] = useState<Dayjs | string>(dayjs().format(monthFormat));

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

    const { times, sendData, receiveData, totalData } = useMemo(() => {
        const times: string[] = [];
        const sendData: number[] = [];
        const receiveData: number[] = [];
        const totalData: number[] = [];

        chartData.forEach((point: ChartDataPoint) => {
            const date = unit === 'hour' ?
                (point.time ? new Date(point.time) : new Date()) :
                point.date;
            const formattedTime = unit === 'hour' ?
                dayjs(date).format('YYYY-MM-DD hh:mm') :
                `${String(date).substring(0, 4)}-${String(date).substring(4, 6)}-${String(date).substring(6, 8)}`;
            times.push(formattedTime);
            sendData.push(Number((point.send / 1024).toFixed(1)));
            receiveData.push(Number((point.receive / 1024).toFixed(1)));
            totalData.push(Number((point.total / 1024).toFixed(1)));
        });

        return { times, sendData, receiveData, totalData };
    }, [chartData, unit]);

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: (params: {
                name: string;
                value: number;
                seriesName: string;
            }[]) => {
                const startTime = params[0].name;
                const endTime = dayjs(startTime).add(1, 'hour').format('YYYY-MM-DD HH:mm');
                return `<div>
                        <div style='text-align:center;'>${startTime} - ${endTime}</div>
                        <div style='text-align:center;'>Total: ${(params[0].value + params[1].value).toFixed(1)} KiB</div>
                        <div style='text-align:center;'>Downstream: ${params[1].value.toFixed(1)} KiB</div>
                        <div style='text-align:center;'>Upstream: ${params[0].value.toFixed(1)} KiB</div>
                    </div>`;
            },
        },
        grid: {
            left: '10px',
            right: '10px',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: times
        },
        yAxis: {
            type: 'value',
            name: 'KiB',
        },
        series: [
            {
                name: 'Receive',
                type: 'bar',
                stack: 'Total',
                data: receiveData,
                smooth: true,
                color: '#E87E8A',
                barMaxWidth: 40,
            },
            {
                name: 'Send',
                type: 'bar',
                stack: 'Total',
                data: sendData,
                smooth: true,
                color: '#41A4E0',
                barMaxWidth: 40,
                itemStyle: {
                    borderRadius: [20, 20, 0, 0],
                },
            },
            {
                name: 'Max',
                type: 'line',
                markPoint: {
                    data: [
                        {
                            type: 'max',
                            name: 'Max Total',
                            label: {
                                show: true,
                                position: 'top',
                                distance: 5,
                                formatter: (params: { value: number }) => `${params.value.toFixed(1)} KiB`,
                                textStyle: {
                                    color: '#000',
                                    fontSize: 12,
                                    fontWeight: 'normal'
                                },
                            }
                        }
                    ],
                    symbolSize: 0,
                },
                data: totalData,
                symbol: 'none',
                lineStyle: {
                    color: 'transparent'
                },
            }
        ],
    }), [times, sendData, receiveData, totalData]);

    const getDataUsage = useCallback(async () => {
        try {
            const response = await apiMain.get(`/get_data_usage/${id}?oid=${oid}&unit=${unit}&after=${dateRange[0]}&before=${dayjs(dateRange[1]).add(1, 'day').format(dateFormat)}&month=${dayjs(selectedMonth).format('YYYYMM')}`);
            setChartData(response.data.result);
        } catch (error) {
            console.log('Error occurred while getting data usage: ', error);
        }
    }, [id, oid, unit, dateRange, selectedMonth]);

    useEffect(() => {
        getDataUsage();
    }, [getDataUsage]);

    return (
        <>
            <Card className='min-w-[700px]' title='Data Usage' extra={<PickDateAndUnit unit={unit} setUnit={setUnit} dateRange={dateRange} setDateRange={setDateRange} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />}>
                <ReactEcharts
                    option={option}
                />
            </Card>
        </>
    );
}

export default DataUsageChart;
