import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Input, Button, Space, Tag, Typography, Modal, Form, 
  Select, message, Popconfirm, Descriptions, Spin, Empty, Progress,
  Tabs, Statistic, Tooltip
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, 
  PlayCircleOutlined, LineChartOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, WarningOutlined, LoadingOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Researcher/DashboardLayout';
import axiosInstance from '../../../lib/axiosInstance';
import styles from '../../../styles/Simulation.module.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;


const SimulationStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const SimulationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [simulations, setSimulations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredSimulations, setFilteredSimulations] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [createForm] = Form.useForm();
  const [molecularModels, setMolecularModels] = useState([]);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [runningSimulationId, setRunningSimulationId] = useState(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
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
      const response =  await axiosInstance.get('/simulations/my-simulations', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      console.log('Simulations response:', response.data);
      setSimulations(response.data);
      setFilteredSimulations(response.data);
      setLoading(false);
    } catch (error) {
   
      setLoading(false);
    }
  };

  const fetchMolecularModels = async () => {
    try {
      const response =  await axiosInstance.get('/molecular-models', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      setMolecularModels(response.data);
    } catch (error) {
    
    }
  };

  useEffect(() => {
    fetchSimulations();
    fetchMolecularModels();
  }, []);

  useEffect(() => {
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

  const handleCreateSimulation = () => {
    createForm.resetFields();
    setIsCreateModalVisible(true);
  };

  const handleViewSimulation = async (simulationId) => {
    try {
      setLoading(true);
      const response =  await axiosInstance.get(`/simulations/${simulationId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setCurrentSimulation(response.data);
      setIsViewModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching simulation details:', error);
      message.error('Failed to fetch simulation details');
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (simulationId) => {
    try {
      setLoading(true);
       await axiosInstance.delete(`/simulations/${simulationId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      message.success('Simulation deleted successfully');
      fetchSimulations();
    } catch (error) {
      console.error('Error deleting simulation:', error);
      message.error('Failed to delete simulation');
      setLoading(false);
    }
  };

  const handleRunSimulation = async (simulationId) => {
    try {
      setRunningSimulation(true);
      setRunningSimulationId(simulationId);
      
      
      const response =  await axiosInstance.post(`/simulations/run-dask/${simulationId}`, {}, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      message.success('Simulation started successfully');
      
    
      const updatedSimulations = simulations.map(sim => {
        if (sim.id === simulationId) {
          return { ...sim, status: SimulationStatus.PROCESSING };
        }
        return sim;
      });
      
      setSimulations(updatedSimulations);
      setFilteredSimulations(updatedSimulations);
      
    
      if (currentSimulation && currentSimulation.id === simulationId) {
        setCurrentSimulation({
          ...currentSimulation,
          status: SimulationStatus.PROCESSING,
          startedAt: new Date()
        });
      }
      
      
      const pollInterval = setInterval(async () => {
        try {
          const simResponse =  await axiosInstance.get(`/simulations/${simulationId}`, {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
          });
          
          const updatedSimulation = simResponse.data;
          
          
          const newSimulations = simulations.map(sim => {
            if (sim.id === simulationId) {
              return { ...sim, status: updatedSimulation.status };
            }
            return sim;
          });
          
          setSimulations(newSimulations);
          setFilteredSimulations(newSimulations);
          
       
          if (currentSimulation && currentSimulation.id === simulationId) {
            setCurrentSimulation(updatedSimulation);
          }
          
        
          if (updatedSimulation.status !== SimulationStatus.PROCESSING) {
            clearInterval(pollInterval);
            setRunningSimulation(false);
            setRunningSimulationId(null);
            
            if (updatedSimulation.status === SimulationStatus.COMPLETED) {
              message.success('Simulation completed successfully');
            } else if (updatedSimulation.status === SimulationStatus.FAILED) {
              message.error(`Simulation failed: ${updatedSimulation.errorMessage || 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error('Error polling simulation status:', error);
          clearInterval(pollInterval);
          setRunningSimulation(false);
          setRunningSimulationId(null);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error running simulation:', error);
      message.error('Failed to run simulation: ' + (error.response?.data?.message || error.message));
      setRunningSimulation(false);
      setRunningSimulationId(null);
    }
  };

  const handleViewAnalytics = async (simulationId) => {
    try {
      setAnalyticsLoading(true);
      
    
      const response =  await axiosInstance.get(`/simulations/analytics/${simulationId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      setAnalyticsData(response.data);
      setIsAnalyticsModalVisible(true);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      
      if (error.response && error.response.status === 404) {
        if (error.response.data && error.response.data.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Analytics not available. The simulation might not be completed.');
        }
      } else {
        message.error('Failed to fetch analytics: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const submitCreateSimulation = async () => {
    try {
      const values = await createForm.validateFields();
      setLoading(true);
      
      
      let parsedParameters = {};
      if (values.parameters) {
        try {
          if (typeof values.parameters === 'string') {
    
            parsedParameters = JSON.parse(values.parameters.trim());
          } else {
            parsedParameters = values.parameters;
          }
        } catch (e) {
          console.error("Parameter parsing error:", e);
          message.error('Invalid JSON format in parameters');
          setLoading(false);
          return;
        }
      }
      
      const payload = {
        name: values.name,
        type: values.type,
        parameters: parsedParameters,
        molecularModelId: values.molecularModelId
      };
      
      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      
      const response =  await axiosInstance.post('/simulations', payload, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      message.success('Simulation created successfully');
      setIsCreateModalVisible(false);
      fetchSimulations();
    } catch (error) {
      console.error('Full error object:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
       
        let errorMessage = 'Failed to create simulation';
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        message.error(errorMessage);
      } else if (error.request) {
        message.error('No response received from server');
      } else {
        message.error('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getStatusTag = (status) => {
    switch (status) {
      case SimulationStatus.PENDING:
        return <Tag icon={<WarningOutlined />} color="warning">Pending</Tag>;
      case SimulationStatus.PROCESSING:
        return <Tag icon={<LoadingOutlined />} color="processing">Processing</Tag>;
      case SimulationStatus.COMPLETED:
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case SimulationStatus.FAILED:
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
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
        width: '140px',
        filters: [
          { text: 'pending', value: SimulationStatus.PENDING },
          { text: 'processing', value: SimulationStatus.PROCESSING },
          { text: 'pompleted', value: SimulationStatus.COMPLETED },
          { text: 'failed', value: SimulationStatus.FAILED },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '180px',
        render: (_, record) => (
          <Space size="small">
          {   <Tooltip title="View Details">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handleViewSimulation(record.id)}
              />
            </Tooltip> }
            {(record.status === SimulationStatus.PENDING || record.status === 'pending') && (
  <Tooltip title="Run Simulation">
    <Button 
      type="text" 
      icon={<PlayCircleOutlined />} 
      onClick={() => handleRunSimulation(record.id)}
      loading={runningSimulation && runningSimulationId === record.id}
      disabled={runningSimulation}
    />
  </Tooltip>
)}

{(record.status === SimulationStatus.COMPLETED || record.status === 'completed') && (
  <Tooltip title="View Analytics">
    <Button 
      type="text" 
      icon={<LineChartOutlined />} 
      onClick={() => handleViewAnalytics(record.id)}
      loading={analyticsLoading && record.id === currentSimulation?.id}
    />
  </Tooltip>
)}
            
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this simulation?"
                onConfirm={() => handleDeleteSimulation(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                />
              </Popconfirm>
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
        title: 'Started',
        dataIndex: 'startedAt',
        key: 'startedAt',
        render: date => formatDate(date),
        width: '180px',
      });
    }

    return baseColumns;
  };

  const renderParametersAsJson = (parameters) => {
    if (!parameters) return <Text type="secondary">No parameters</Text>;
    
    try {
      if (typeof parameters === 'string') {
        parameters = JSON.parse(parameters);
      }
      return (
        <pre className={styles.jsonDisplay}>
          {JSON.stringify(parameters, null, 2)}
        </pre>
      );
    } catch (e) {
      return <Text>{parameters.toString()}</Text>;
    }
  };

  const renderResultsAsJson = (results) => {
    if (!results || Object.keys(results).length === 0) {
      return <Text type="secondary">No results available</Text>;
    }
    
    return (
      <pre className={styles.jsonDisplay}>
        {JSON.stringify(results, null, 2)}
      </pre>
    );
  };

  const renderAnalytics = () => {
    if (!analyticsData) return <Empty description="No analytics data available" />;
    
    return (
      <Tabs defaultActiveKey="statistics">
        <TabPane tab="Statistics" key="statistics">
          <Card className={styles.analyticsCard}>
            <div className={styles.statisticsGrid}>
              {Object.entries(analyticsData.statistics || {}).map(([key, value]) => (
                <Statistic 
                  key={key} 
                  title={key.replace(/_/g, ' ').toUpperCase()} 
                  value={typeof value === 'number' ? value.toFixed(4) : value} 
                  className={styles.statistic}
                />
              ))}
            </div>
          </Card>
        </TabPane>
        <TabPane tab="Convergence Metrics" key="convergence">
          <Card className={styles.analyticsCard}>
            <div className={styles.convergenceData}>
              {Object.entries(analyticsData.convergence_metrics || {}).map(([key, value]) => (
                <div key={key} className={styles.convergenceItem}>
                  <Title level={5}>{key.replace(/_/g, ' ')}</Title>
                  <Progress 
                    percent={value * 100} 
                    status={value >= 0.95 ? "success" : value >= 0.8 ? "normal" : "exception"}
                    format={percent => `${(percent / 100).toFixed(4)}`}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabPane>
        <TabPane tab="Simulation Time" key="time">
          <Card className={styles.analyticsCard}>
            <Statistic
              title="Total Simulation Time (seconds)"
              value={analyticsData.simulation_time || 0}
              precision={2}
              className={styles.timeStatistic}
            />
          </Card>
        </TabPane>
        <TabPane tab="Raw Data" key="raw">
          <Card className={styles.analyticsCard}>
            {renderResultsAsJson(analyticsData)}
          </Card>
        </TabPane>
      </Tabs>
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.simulationsContainer}>
        <Card className={styles.simulationsCard}>
          <div className={styles.simulationsHeader}>
            <Title level={3}>Molecular Simulations</Title>
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
                <Button 
                  type="primary" 
                  onClick={handleCreateSimulation}
                >
                  {windowWidth > 576 ? 'Create Simulation' : 'Create'}
                </Button>
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
                description="No simulations found" 
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
                className={styles.simulationsTable}
                scroll={{ x: 'max-content' }}
                size={windowWidth < 768 ? "small" : "middle"}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Create Simulation Modal */}
      <Modal
        title="Create New Simulation"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsCreateModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={submitCreateSimulation} loading={loading}>
            Create
          </Button>,
        ]}
        width={windowWidth < 768 ? '95%' : 700}
      >
        <Form form={createForm} layout="vertical">
     
          <Form.Item
            name="name"
            label="Simulation Name"
            rules={[{ required: true, message: 'Please enter simulation name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Simulation Type"
            rules={[{ required: true, message: 'Please select simulation type' }]}
          >
            <Select placeholder="Select simulation type">
              <Option value="molecular_dynamics">Molecular Dynamics</Option>
              <Option value="energy_minimization">Energy Minimization</Option>
              <Option value="binding_affinity">Binding Affinity</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="molecularModelId"
            label="Molecular Model"
            rules={[{ required: true, message: 'Please select a molecular model' }]}
          >
            <Select placeholder="Select molecular model">
              {molecularModels.map(model => (
                <Option key={model.id} value={model.id}>
                  {model.name} ({model.format})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
      
  name="parameters"
  label="Simulation Parameters"
 
  
  rules={[
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        try {
          JSON.parse(value);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject('Please enter valid JSON');
        }
      }
    }
  ]}
>
  <TextArea 
    rows={6} 
   
     placeholder='{ "temperature": 310, "pressure": 1, "timeStep": 0.002, "totalSteps": 1000000 }' 
    
  />
</Form.Item>
        </Form>
      </Modal>

      {/* View Simulation Modal */}
      <Modal
        title="Simulation Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={windowWidth < 768 ? '95%' : 800}
        footer={[
          currentSimulation?.status === SimulationStatus.COMPLETED ? (
            <Button 
              key="analytics" 
              type="primary" 
              icon={<LineChartOutlined />}
              onClick={() => {
                setIsViewModalVisible(false);
                handleViewAnalytics(currentSimulation.id);
              }}
            >
              View Analytics
            </Button>
          ) : currentSimulation?.status === SimulationStatus.PENDING ? (
            <Button 
              key="run" 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleRunSimulation(currentSimulation.id)}
              loading={runningSimulation && runningSimulationId === currentSimulation.id}
              disabled={runningSimulation}
            >
              Run Simulation
            </Button>
          ) : null,
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : currentSimulation && (
          <div className={styles.simulationDetails}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Name" span={2}>{currentSimulation.name}</Descriptions.Item>
              <Descriptions.Item label="Type">{currentSimulation.type}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(currentSimulation.status)}</Descriptions.Item>
              <Descriptions.Item label="Model">
                {currentSimulation.molecularModel?.name || 'N/A'}
              </Descriptions.Item>
           
              <Descriptions.Item label="Started At">{formatDate(currentSimulation.startedAt)}</Descriptions.Item>
              <Descriptions.Item label="Completed At">{formatDate(currentSimulation.completedAt)}</Descriptions.Item>
            </Descriptions>
            
            {currentSimulation.errorMessage && (
              <div className={styles.errorSection}>
                <Title level={5}>Error Message</Title>
                <Paragraph type="danger">{currentSimulation.errorMessage}</Paragraph>
              </div>
            )}
            
            <div className={styles.parametersSection}>
              <Title level={5}>Parameters</Title>
              {renderParametersAsJson(currentSimulation.parameters)}
            </div>
            
            {currentSimulation.results && Object.keys(currentSimulation.results).length > 0 && (
              <div className={styles.resultsSection}>
                <Title level={5}>Results</Title>
                {renderResultsAsJson(currentSimulation.results)}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal
        title={`Analytics: ${analyticsData?.name || 'Simulation'}`}
        open={isAnalyticsModalVisible}
        onCancel={() => setIsAnalyticsModalVisible(false)}
        width={windowWidth < 768 ? '95%' : 900}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsAnalyticsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {analyticsLoading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : (
          renderAnalytics()
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default SimulationsPage;