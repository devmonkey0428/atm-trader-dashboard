import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Space, Checkbox, Divider } from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import SignalStrength from './SignalStrength';
import { DataType } from '../../types/DataTypes';
import { TableProps } from 'antd/es/table';
import { FilterFilled, SearchOutlined } from '@ant-design/icons';
import { FilterValue } from 'antd/es/table/interface';
import { isEmbedded } from '../../utils/isEmbedded';

type DataIndex = keyof DataType;

const DashboardTable: React.FC<{ data: DataType[], email: string }> = ({ data, email }) => {
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});

  const searchInput = useRef<InputRef>(null);

  const handleChange: TableProps<DataType>['onChange'] = (_pagination, filters) => {
    setFilteredInfo(filters);
  };

  const clearFilters = () => {
    setFilteredInfo({});
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => {
            setSelectedKeys(e.target.value ? [e.target.value] : []);
            confirm({ closeDropdown: false });
          }}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space className='w-full justify-end'>
          <Button
            onClick={() => {
              if (clearFilters) {
                clearFilters();
              }
              confirm();
            }}
            type='primary'
            size="small"
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#026670' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filteredValue: filteredInfo[dataIndex] || null,
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  const getColumnSelectProps = (
    dataIndex: DataIndex,
    filters: { text: string; value: string }[]
  ): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Checkbox.Group
          options={filters.map(filter => filter.value)}
          value={selectedKeys as string[]}
          onChange={(list: string[]) => {
            setSelectedKeys(list);
            confirm({ closeDropdown: false });
          }}
          className='flex flex-col gap-2'
        />
        <Divider className='my-2' />
        <Space className='w-full justify-end'>
          <Button
            onClick={() => {
              if (clearFilters) {
                clearFilters();
              }
              confirm();
            }}
            type='primary'
            size="small"
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    onFilter: (value, record) => record[dataIndex] == value,
    filteredValue: filteredInfo[dataIndex] || null,
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Device',
      dataIndex: 'num',
      key: 'num',
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Gateway Name',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      render: (name, record) => (
        <Link to={`/layout/detail/${record.key}/${record.oid}${isEmbedded() ? `?email=${email}` : ''}`} className='underline'>
          {name}
        </Link>
      ),
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialNum',
      key: 'serialNum',
      ...getColumnSearchProps('serialNum'),
    },
    {
      title: 'Connection Status',
      dataIndex: 'connectionStatus',
      key: 'connectionStatus',
      ...getColumnSelectProps('connectionStatus', [
        { text: 'Online', value: 'Online' },
        { text: 'Offline', value: 'Offline' },
      ]),
    },
    {
      title: 'Online/Offline Duration',
      dataIndex: 'connectionDuration',
      key: 'connectionDuration',
    },
    {
      title: 'ICCID',
      dataIndex: 'iccid',
      key: 'iccid',
      ...getColumnSearchProps('iccid'),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ...getColumnSearchProps('location'),
    },
    {
      title: 'Signal Strength',
      dataIndex: 'signalStrength',
      key: 'signalStrength',
      render: (strength) => <SignalStrength signalStrength={Number(strength)} />,
      ...getColumnSelectProps('signalStrength', [
        { text: '1', value: '1' },
        { text: '2', value: '2' },
        { text: '3', value: '3' },
        { text: '4', value: '4' },
        { text: '5', value: '5' },
      ]),
    },
  ];

  return (
    <div>
      <div className='flex justify-end mt-[-52px]'>
        <Button
          type='primary'
          className='mb-2'
          onClick={clearFilters}
        >
          <FilterFilled /> Reset Filters
        </Button>
      </div>

      <Table<DataType>
        bordered
        columns={columns}
        dataSource={data}
        onChange={handleChange}
      />
    </div>
  );
};

export default DashboardTable;
