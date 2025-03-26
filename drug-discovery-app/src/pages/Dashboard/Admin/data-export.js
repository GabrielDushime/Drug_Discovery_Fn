import React, { useState } from 'react';
import { 
  Table, Card, Input, Button, Space, Tag, Typography, message, Spin, 
  Select, Radio, Tooltip, Empty
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, FileTextOutlined, 
  FilePdfOutlined, FileExcelOutlined, DownloadOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Admin/DashboardLayout';
import axiosInstance from '../../../lib/axiosInstance';
import styles from '../../../styles/Data-Export.module.css';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const SimulationStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const DataExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredSimulations, setFilteredSimulations] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
 
  const getAuthToken = () => {
    return localStorage.getItem('token') || ''; 
  };

  const fetchSimulations = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/simulations', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
     
      const exportableSimulations = response.data.filter(
        sim => (
          (sim.status === SimulationStatus.COMPLETED || 
           sim.status?.toLowerCase() === SimulationStatus.COMPLETED.toLowerCase()) && 
          sim.results
        )
      );
      
      setSimulations(exportableSimulations);
      setFilteredSimulations(exportableSimulations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching simulations:', error);
      message.error('Failed to load simulations');
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSimulations();
  }, []);

 
  React.useEffect(() => {
    if (searchText) {
      const filtered = simulations.filter(
        simulation => 
          simulation.name?.toLowerCase().includes(searchText.toLowerCase()) || 
          simulation.type?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredSimulations(filtered);
    } else {
      setFilteredSimulations(simulations);
    }
  }, [searchText, simulations]);

  const handleSearch = e => {
    setSearchText(e.target.value);
  };


  const handleFormatChange = e => {
    setExportFormat(e.target.value);
  };

  
  const handleExport = async (simulationId, format) => {
    setDownloading(true);
    try {
     
      const url = `http://localhost:8000/data-export/${format}/${simulationId}`;
      
    
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `simulation_${simulationId}.${format}`);
      
    
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
    
      const blob = await response.blob();
      
    
      const objectUrl = URL.createObjectURL(blob);
      
     
      link.href = objectUrl;
      
      
      document.body.appendChild(link);
      
      
      link.click();
      
     
      document.body.removeChild(link);
      
      
      URL.revokeObjectURL(objectUrl);
      
      message.success(`Successfully exported simulation as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(`Error exporting simulation as ${format}:`, error);
      message.error(`Failed to export: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getStatusTag = (status) => {
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case SimulationStatus.COMPLETED:
        return <Tag color="success">Completed</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  
  const getColumnsByScreenSize = () => {
    const baseColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => a.name.localeCompare(b.name),
        ellipsis: true,
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: type => <Tag color="blue">{type}</Tag>,
        width: '120px',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => getStatusTag(status),
        width: '120px',
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '180px',
        render: (_, record) => (
          <Space size="small">
            <Tooltip title={`Export as ${exportFormat.toUpperCase()}`}>
              <Button 
                type="primary" 
                icon={getFormatIcon(exportFormat)} 
                onClick={() => handleExport(record.id, exportFormat)}
                loading={downloading}
              >
                {windowWidth > 576 ? `Export ${exportFormat.toUpperCase()}` : ''}
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ];

    
    if (windowWidth >= 992) {
      baseColumns.splice(2, 0, {
        title: 'Model',
        dataIndex: 'molecularModel',
        key: 'molecularModel',
        render: model => model?.name || 'N/A',
        ellipsis: true,
      });
    }

    if (windowWidth >= 1200) {
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: 'Completed',
        dataIndex: 'completedAt',
        key: 'completedAt',
        render: date => formatDate(date),
        width: '180px',
      });
    }

    return baseColumns;
  };


  const getFormatIcon = (format) => {
    switch (format) {
      case 'json':
        return <FileTextOutlined />;
      case 'csv':
        return <FileExcelOutlined />;
      case 'pdf':
        return <FilePdfOutlined />;
      default:
        return <DownloadOutlined />;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.exportContainer}>
        <Card className={styles.exportCard}>
          <div className={styles.exportHeader}>
            <Title level={3}>Export Simulation Data</Title>
            <Space wrap className={styles.actionSpace}>
              <Input 
                placeholder="Search simulations" 
                prefix={<SearchOutlined />} 
                className={styles.searchInput}
                value={searchText}
                onChange={handleSearch}
                allowClear
              />
              <Space>
                <Radio.Group 
                  value={exportFormat} 
                  onChange={handleFormatChange}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="json">JSON</Radio.Button>
                  <Radio.Button value="csv">CSV</Radio.Button>
                  <Radio.Button value="pdf">PDF</Radio.Button>
                </Radio.Group>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchSimulations}
                >
                  {windowWidth > 576 ? 'Refresh' : ''}
                </Button>
              </Space>
            </Space>
          </div>
          
          <div className={styles.tableWrapper}>
            {simulations.length === 0 && !loading ? (
              <Empty 
                description="No completed simulations found" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table 
                columns={getColumnsByScreenSize()} 
                dataSource={filteredSimulations} 
                rowKey="id"
                loading={loading}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total: ${total} simulations`,
                  responsive: true,
                }}
                className={styles.exportTable}
                scroll={{ x: 'max-content' }}
                size={windowWidth < 768 ? "small" : "middle"}
              />
            )}
          </div>
          
          <div className={styles.infoSection}>
            <Title level={4}>About Data Export</Title>
            <Text>
              <ul>
                <li><strong>JSON Format:</strong> Exports the complete simulation results data in JSON format.</li>
                <li><strong>CSV Format:</strong> Exports the simulation trajectory data, suitable for analysis in spreadsheet applications.</li>
                <li><strong>PDF Format:</strong> Generates a formatted report with simulation parameters, statistics, and results summary.</li>
              </ul>
            </Text>
            <Text type="secondary">
              Note: Only completed simulations with results are available for export.
            </Text>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataExportPage;