import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Table, Tag, Spin, Alert, Empty, Button } from 'antd';
import {
  ExperimentOutlined,
  ClusterOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import DashboardLayout from './DashboardLayout';
import styles from '../../../styles/ResearcherDashboard.module.css';
import axiosInstance from '../../../lib/axiosInstance';
import {
  PieChart, Pie, 
  LineChart, Line,
  Cell, XAxis,
  YAxis, CartesianGrid,
  Tooltip, Legend 
} from 'recharts';

const { Title, Paragraph, Text } = Typography;

export const getServerSideProps = async () => {
  return { props: {} };
};

const ResearcherDashboardPage = () => {
  const isBrowser = typeof window !== 'undefined';
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    models: 0,
    simulations: 0,
    completedSimulations: 0,
    successRate: 0
  });
 
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [simulationsByStatus, setSimulationsByStatus] = useState([]);
  const [simulationTrends, setSimulationTrends] = useState([]);

  const [windowWidth, setWindowWidth] = useState(isBrowser ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (isBrowser) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isBrowser]);

  const getAuthToken = () => {
    if (!isBrowser) return '';
    return localStorage.getItem('token') || '';
  };

  useEffect(() => {
    if (isBrowser) {
      const storedUserName = localStorage.getItem('userName');
      if (storedUserName) {
        setUserName(storedUserName);
      }
    }
  }, [isBrowser]);

  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return ' #AED6F1'; 
      case 'processing':
        return '#1890ff'; 
      case 'completed':
        return '#1A5276'; 
      case 'failed':
        return '#f5222d'; 
      default:
        return '#d9d9d9'; 
    }
  };

 
  const processChartData = useCallback((simulations, models) => {

    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    simulations.forEach(sim => {
      if (statusCounts.hasOwnProperty(sim.status)) {
        statusCounts[sim.status]++;
      }
    });
    
    const statusData = Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status],
      fill: getStatusColor(status)
    }));
    setSimulationsByStatus(statusData);
    
    
    const modelUsageMap = {};
    simulations.forEach(sim => {
      const modelId = sim.modelId || 'unknown';
      if (!modelUsageMap[modelId]) {
        modelUsageMap[modelId] = 0;
      }
      modelUsageMap[modelId]++;
    });
    
    
    if (simulations.length > 0) {
      const monthlyData = {};
      simulations.forEach(sim => {
        const date = new Date(sim.startedAt || sim.createdAt || new Date());
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            name: new Date(date.getFullYear(), date.getMonth(), 1)
              .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            completed: 0,
            failed: 0,
            total: 0
          };
        }
        
        monthlyData[monthKey].total++;
        
        if (sim.status === 'completed') {
          monthlyData[monthKey].completed++;
        } else if (sim.status === 'failed') {
          monthlyData[monthKey].failed++;
        }
      });
      
      const trendsData = Object.values(monthlyData).sort((a, b) => {
        return new Date(a.name) - new Date(b.name);
      });
      
      setSimulationTrends(trendsData);
    } else {
      setSimulationTrends([]);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        try {
          let models = [];
          let simulations = [];
          
          try {
            const modelsResponse = await axios.get(`https://drug-discovery-bn.onrender.com/molecular-models`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            models = modelsResponse.data || [];
          } catch (modelErr) {
            if (modelErr.response && modelErr.response.status !== 404) {
              throw modelErr;
            }
          }
          
          try {
            const simulationsResponse = await axios.get(`https://drug-discovery-bn.onrender.com/simulations/my-simulations`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            simulations = simulationsResponse.data || [];
          } catch (simErr) {
            if (simErr.response && simErr.response.status !== 404) {
              throw simErr;
            }
          }
          
          const completedSimulations = simulations.filter(
            sim => sim.status === 'completed'
          ).length;
          
          const successRate = simulations.length > 0 
            ? Math.round((completedSimulations / simulations.length) * 100) 
            : 0;
          
          setStats({
            models: models.length,
            simulations: simulations.length,
            completedSimulations,
            successRate
          });
          
        
          
          const sortedSimulations = [...simulations].sort((a, b) => 
            new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0)
          ).slice(0, 5);
          setRecentSimulations(sortedSimulations);
          
          processChartData(simulations, models);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          
          if (err.response) {
            if (err.response.status === 403) {
              setError('Access forbidden. Your account may not have permission to view this data or your session has expired.');
              if (isBrowser) localStorage.removeItem('token'); 
            } else if (err.response.status === 401) {
              setError('Authentication failed. Please log in again.');
              if (isBrowser) localStorage.removeItem('token');
            } else {
              setError(`API Error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
            }
          } else if (err.request) {
            setError('Network error: Unable to connect to the server. Please check your connection.');
          } else {
            setError('An unexpected error occurred. Please try again later.');
          }
          
          setStats({
            models: 0,
            simulations: 0,
            completedSimulations: 0,
            successRate: 0
          });
          setRecentModels([]);
          setRecentSimulations([]);
          setSimulationsByStatus([]);
          setModelUsage([]);
          setSimulationTrends([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); 

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag icon={<WarningOutlined />} color="warning">Pending</Tag>;
      case 'processing':
        return <Tag icon={<LoadingOutlined />} color="processing">Processing</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const modelColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => formatDate(date),
      responsive: ['lg']
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => window.location.href = `/molecular-models/${record.id}`}>
            View
          </Button>
          <Button type="link" size="small" onClick={() => window.location.href = `/simulations/new?modelId=${record.id}`}>
            Run Simulation
          </Button>
        </Space>
      ),
      responsive: ['md']
    }
  ];

  const simulationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => getStatusTag(status),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: date => formatDate(date),
      responsive: ['lg']
    },
  ];

  const PieChartComponent = ({ data }) => {
    const COLORS = ['#52c41a', '#1890ff', '#faad14', '#f5222d', '#d9d9d9'];
  
    return (
      <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
        <PieChart width={340} height={300} margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
          <Pie
            data={data}
            cx="50%"
            cy="40%"
            labelLine={true}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}`, 'Count']} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
        </PieChart>
      </div>
    );
  };

  const LineChartComponent = ({ data }) => {
    if (!data || data.length === 0) {
      return <Empty description="No trend data available" />;
    }
    
    return (
      <div style={{ width: '100%', height: 250, display: 'flex', justifyContent: 'center' }}>
        <LineChart
          width={450}
          height={250}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="completed" stroke="#1A5276" strokeWidth={2} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="failed" stroke="#f5222d" strokeWidth={2} />
        </LineChart>
      </div>
    );
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  // Add this function that was referenced but missing
  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Spin size="large" tip="Loading your research dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboardContainer}>
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            action={
              <Space>
                {error.includes('authentication') || error.includes('token') || error.includes('forbidden') ? (
                  <Button size="small" type="primary" onClick={handleLogin}>
                    Log In
                  </Button>
                ) : (
                  <Button size="small" type="ghost" onClick={handleRetry}>
                    <ReloadOutlined /> Retry
                  </Button>
                )}
              </Space>
            }
          />
        )}
        
        {/* Welcome Section */}
        <Card className={styles.welcomeCard} bordered={false}>
          <Title level={2} className={styles.welcomeTitle}>Research Dashboard</Title>
          <Paragraph className={styles.welcomeText}>
            Welcome back, {userName || 'Researcher'}! View your molecular models, simulations, and analysis results.
            Track your research progress and visualize your simulation outcomes all in one place.
          </Paragraph>
          <Row gutter={16}>
            <Col>
              <Button type="primary" icon={<ClusterOutlined />} onClick={() => window.location.href = '/Dashboard/Researcher/molecular-model'}>
                New Model
              </Button>
            </Col>
            <Col>
              <Button icon={<ExperimentOutlined />} onClick={() => window.location.href = '/Dashboard/Researcher/simulation'}>
                New Simulation
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Information Alert for new users */}
        {(stats.models === 0 || stats.simulations === 0) && (
          <Alert
            message="Get Started with Your Research"
            description={
              <Space direction="vertical">
                {stats.models === 0 && (
                  <Paragraph>
                    <strong>No molecular models found.</strong> Start by creating molecular models for your research. 
                    Models are the foundation for running simulations and analysis.
                  </Paragraph>
                )}
                {stats.models > 0 && stats.simulations === 0 && (
                  <Paragraph>
                    <strong>No simulations found.</strong> You have {stats.models} molecular model(s) ready. 
                    The next step is to run simulations to analyze your models and visualize the results.
                  </Paragraph>
                )}
                <Row gutter={16}>
                  {stats.models === 0 && (
                    <Col>
                      <Button type="primary" icon={<ClusterOutlined />} onClick={() => window.location.href = '/Dashboard/Researcher/molecular-model'}>
                        Create First Model
                      </Button>
                    </Col>
                  )}
                  {stats.models > 0 && stats.simulations === 0 && (
                    <Col>
                      <Button type="primary" icon={<ExperimentOutlined />} onClick={() => window.location.href = '/Dashboard/Researcher/simulation'}>
                        Run First Simulation
                      </Button>
                    </Col>
                  )}
                </Row>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Statistics Section */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={12} sm={12} md={8}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Molecular Models"
                value={stats.models}
                prefix={<ClusterOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {stats.models > 0 ? "Your research building blocks" : "Create your first model"}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Total Simulations"
                value={stats.simulations}
                prefix={<ExperimentOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {stats.simulations > 0 ? "Analyses performed to date" : "Run your first simulation"}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Success Rate"
                value={stats.successRate}
                suffix="%"
                prefix={<BarChartOutlined className={styles.statIcon} />}
                valueStyle={{ color: stats.successRate > 70 ? '#52c41a' : (stats.successRate > 40 ? '#faad14' : '#f5222d') }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {stats.simulations > 0 ? (
                    stats.successRate > 70 ? 
                      <span><RiseOutlined style={{ color: '#52c41a' }} /> Excellent completion rate</span> :
                      <span><FallOutlined style={{ color: '#faad14' }} /> Could improve completion</span>
                  ) : "Complete simulations / Total"}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><BarChartOutlined /> Simulation Status</Space>}
              extra={stats.simulations > 0 ? <Button type="link" size="small" href="/simulations">View All</Button> : null}
              bordered={false}
              className={styles.chartCard}
            >
              {stats.simulations > 0 ? (
                <PieChartComponent data={simulationsByStatus} />
              ) : (
                <Empty 
                  description={
                    <Space direction="vertical" align="center">
                      <Text>No simulation data available</Text>
                      <Button type="primary" size="small" icon={<ExperimentOutlined />} onClick={() => window.location.href = '/Dashboard/Researcher/simulation'}>
                        Start a Simulation
                      </Button>
                    </Space>
                  }
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><RiseOutlined /> Simulation Trends</Space>}
              bordered={false}
              className={styles.chartCard}
            >
              {simulationTrends.length > 0 ? (
                <LineChartComponent data={simulationTrends} />
              ) : (
                <Empty description="Run simulations to see trends over time" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Recent Activity Sections */}
        <Row gutter={[16, 16]} className={styles.activityRow}>
          <Col xs={24} lg={12}>
            <Card 
              title={<Title level={4}><ExperimentOutlined /> Recent Simulations</Title>}
              bordered={false}
              className={styles.tableCard}
            >
              {recentSimulations.length > 0 ? (
                <Table 
                  dataSource={recentSimulations} 
                  columns={simulationColumns} 
                  rowKey="id"
                  size={windowWidth < 768 ? "small" : "middle"}
                  pagination={false}
                />
              ) : (
                <Empty description="No recent simulation activity" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
};

export default ResearcherDashboardPage;