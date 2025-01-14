import dayjs, { Dayjs } from 'dayjs';

export interface DataPoint {
  send: number;
  receive: number;
  time: string;
  endTime: string;
  total: number;
}

export interface ChartData {
  result: DataPoint[];
}

export interface RawDataPoint {
  timestamp: number;
  value: number;
}

export interface InhaneToken {
  access_token: string;
}

export interface DeviceInfo {
  name: string;
  online: boolean;
  serialNumber: string;
  model: string;
  createTime?: string;
  updateTime?: string;
  logtime?: string;
  pubIp?: string;
  mobileNumber?: string;
  address?: string;
  protocol?: string;
  info?: {
    swVersion?: string;
    hwVersion?: string;
    bootVersion?: string;
    imsi?: string;
    imei?: string;
    iccid?: string;
    reconnectReason?: string;
  };
  config?: {
    sync?: string;
  };
}

export interface DataType {
  key: string;
  oid: string;
  num: number | string;
  name: string;
  serialNum: string;
  connectionStatus: string;
  connectionDuration: string;
  iccid: string;
  location: string;
  signalStrength: string | number;
}

export interface RawDeviceData {
  _id: string;
  oid: string;
  name: string;
  serialNumber: string;
  online: boolean;
  logtime: string;
  info?: {
    iccid: string;
  };
  address?: string;
  signalStrength?: {
    level: number;
  };
}

export interface RawAccountData {
  accountName: string;
  devices: RawDeviceData[];
}

export interface StatusData {
  startTime: number;
  status: number; // 0: Offline, 1: Online, 2: Abnormal
}

export interface PropsPickDateAndMethod {
  method: string;
  setMethod: React.Dispatch<React.SetStateAction<string>>;
  dateRange: dayjs.Dayjs[] | string[];
  setDateRange: React.Dispatch<React.SetStateAction<dayjs.Dayjs[] | string[]>>;
}

export interface PropsPickDateAndUnit {
  unit: string;
  setUnit: React.Dispatch<React.SetStateAction<string>>;
  dateRange: Dayjs[] | string[];
  setDateRange: React.Dispatch<React.SetStateAction<Dayjs[] | string[]>>;
  selectedMonth: Dayjs | string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<Dayjs | string>>
}

export interface ChartDataPoint {
  time?: string;
  date?: string;
  send: number;
  receive: number;
  total: number;
}

export interface DashboardData {
  accountName: string;
  devices: DataType[];
}
