import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Table, Tag, Spin, Alert, Empty } from 'antd';
import {
  UserOutlined,
  ExperimentOutlined,
  ClusterOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Admin/DashboardLayout';
import styles from '../../../styles/Dashboard.module.css';
import axios from 'axios';
import {
   PieChart, Pie, 
   LineChart, Line,
   Cell, XAxis,
   YAxis, CartesianGrid,
   Tooltip, Legend 
  } from 'recharts';

const { Title, Paragraph, Text } = Typography;

const DashboardPage = () => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    users: 0,
    models: 0,
    simulations: 0,
    completedSimulations: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [simulationsByStatus, setSimulationsByStatus] = useState([]);
  const [simulationsByType, setSimulationsByType] = useState([]);
  const [simulationTrends, setSimulationTrends] = useState([]);
  const [modelUsage, setModelUsage] = useState([]);
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

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  // Wrap processChartData in useCallback to prevent recreation on every render
  const processChartData = useCallback((simulations, models, users) => {
    // Prepare simulations by status for pie chart
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
      name: status,
      value: statusCounts[status],
      fill: getStatusColor(status)
    }));
    setSimulationsByStatus(statusData);
    
    // Prepare simulations by type for bar chart
    const typeCounts = {};
    simulations.forEach(sim => {
      const type = sim.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const typeData = Object.keys(typeCounts).map(type => ({
      name: type,
      count: typeCounts[type]
    }));
    setSimulationsByType(typeData);
    
    // Prepare model usage data
    const modelUsageData = models.slice(0, 5).map(model => {
      const simulationsUsingModel = simulations.filter(sim => 
        sim.modelId === model.id
      ).length;
      
      return {
        name: model.name,
        simulations: simulationsUsingModel
      };
    }).sort((a, b) => b.simulations - a.simulations);
    
    setModelUsage(modelUsageData);
    
    // Prepare simulation trends (mock data as we don't have real trend data)
    const mockMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = mockMonths.map(month => ({
      name: month,
      completed: Math.floor(Math.random() * 20) + 5,
      failed: Math.floor(Math.random() * 5)
    }));
    
    setSimulationTrends(trendData);
  }, []);  // Empty dependency array to ensure it doesn't change
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersResponse = await axios.get('http://localhost:8000/users', {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        const modelsResponse = await axios.get('http://localhost:8000/molecular-models/admin/all', {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        const simulationsResponse = await axios.get('http://localhost:8000/simulations', {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        const users = usersResponse.data;
        const models = modelsResponse.data;
        const simulations = simulationsResponse.data;
        
        const completedSimulations = simulations.filter(
          sim => sim.status === 'completed'
        ).length;
        
        setStats({
          users: users.length,
          models: models.length,
          simulations: simulations.length,
          completedSimulations
        });
        
        const sortedUsers = [...users].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        ).slice(0, 3);
        setRecentUsers(sortedUsers);
        
        const sortedSimulations = [...simulations].sort((a, b) => 
          new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0)
        ).slice(0, 3);
        setRecentSimulations(sortedSimulations);
        
        processChartData(simulations, models, users);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        if (process.env.NODE_ENV === 'development') {
          setStats({
            users: 124,
            models: 37,
            simulations: 56,
            completedSimulations: 42
          });
          setRecentUsers([]);
          setRecentSimulations([]);
          generateMockChartData();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [processChartData]);  // Include processChartData in dependencies

  const generateMockChartData = () => {
    // Mock data for charts in development
    setSimulationsByStatus([
      { name: 'completed', value: 42, fill: '#52c41a' },
      { name: 'processing', value: 8, fill: '#1890ff' },
      { name: 'pending', value: 4, fill: '#faad14' },
      { name: 'failed', value: 2, fill: '#f5222d' }
    ]);
    
    setSimulationsByType([
      { name: 'Molecular Dynamics', count: 28 },
      { name: 'Quantum Chemistry', count: 15 },
      { name: 'Protein Folding', count: 8 },
      { name: 'Ligand Docking', count: 5 }
    ]);
    
    setModelUsage([
      { name: 'Protein Model A', simulations: 12 },
      { name: 'Water Cluster', simulations: 10 },
      { name: 'DNA Fragment', simulations: 8 },
      { name: 'Enzyme Complex', simulations: 7 },
      { name: 'Lipid Membrane', simulations: 5 }
    ]);
    
    setSimulationTrends([
      { name: 'Jan', completed: 8, failed: 2 },
      { name: 'Feb', completed: 12, failed: 1 },
      { name: 'Mar', completed: 15, failed: 3 },
      { name: 'Apr', completed: 10, failed: 2 },
      { name: 'May', completed: 18, failed: 0 },
      { name: 'Jun', completed: 14, failed: 1 }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#faad14'; // Warning yellow
      case 'processing':
        return '#1890ff'; // Processing blue
      case 'completed':
        return '#52c41a'; // Success green
      case 'failed':
        return '#f5222d'; // Error red
      default:
        return '#d9d9d9'; // Default gray
    }
  };

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

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: role => {
        let color = 'blue';
        if (role === 'ADMIN') color = 'gold';
        if (role === 'RESEARCHER') color = 'green';
        
        return <Tag color={color}>{role}</Tag>;
      },
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
      title: 'Date',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: date => formatDate(date),
      responsive: ['lg']
    }
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
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
    return (
      <div style={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LineChart
          width={450}
          height={220}
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Line type="monotone" dataKey="completed" stroke="#52c41a" strokeWidth={2} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="failed" stroke="#f5222d" strokeWidth={2} />
        </LineChart>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Spin size="large" tip="Loading dashboard data..." />
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
          />
        )}
        
        {/* Welcome Section */}
        <Card className={styles.welcomeCard} bordered={false}>
          <Title level={2} className={styles.welcomeTitle}>Welcome to the Admin Dashboard</Title>
          <Paragraph className={styles.welcomeText}>
            Hello, {userName || 'Admin'}! You have access to manage users, molecular models,
            simulations, and visualization data. Use the sidebar navigation to access different
            sections of the admin panel.
          </Paragraph>
        </Card>

        {/* Statistics Section */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Total Users"
                value={stats.users}
                prefix={<UserOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <RiseOutlined style={{ color: '#52c41a' }} /> Growing steadily
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Molecular Models"
                value={stats.models}
                prefix={<ClusterOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <RiseOutlined style={{ color: '#52c41a' }} /> +3 this week
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Total Simulations"
                value={stats.simulations}
                prefix={<ExperimentOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <RiseOutlined style={{ color: '#52c41a' }} /> +12 this month
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title="Completed Simulations"
                value={stats.completedSimulations}
                prefix={<BarChartOutlined className={styles.statIcon} />}
                valueStyle={{ color: '#fa8c16' }}
                suffix={stats.simulations > 0 ? 
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    ({Math.round(stats.completedSimulations/stats.simulations*100)}%)
                  </Text> : null
                }
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {stats.simulations > 0 && Math.round(stats.completedSimulations/stats.simulations*100) > 70 ?
                    <RiseOutlined style={{ color: '#52c41a' }} /> :
                    <FallOutlined style={{ color: '#f5222d' }} />
                  } Completion rate
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
        {/* Charts Section */}
        <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={12}>
            <Card 
              title={<Title level={4}><BarChartOutlined /> Simulation Status</Title>}
              bordered={false}
              className={styles.tableCard}
            >
              <PieChartComponent data={simulationsByStatus} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title={<Title level={4}><RiseOutlined /> Simulation Trends</Title>}
              bordered={false}
              className={styles.tableCard}
            >
              <LineChartComponent data={simulationTrends} />
            </Card>
          </Col>
        </Row>

        {/* Recent Activity Sections */}
        <Row gutter={[16, 16]} className={styles.activityRow}>
          <Col xs={24} lg={12}>
            <Card 
              title={<Title level={4}><UserOutlined /> Recent Users</Title>}
              bordered={false}
              className={styles.tableCard}
            >
              {recentUsers.length > 0 ? (
                <Table 
                  dataSource={recentUsers} 
                  columns={userColumns} 
                  rowKey="id"
                  size={windowWidth < 768 ? "small" : "middle"}
                  pagination={false}
                />
              ) : (
                <Empty description="No recent user activity" />
              )}
            </Card>
          </Col>
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


export const unstable_noSSR = true;

export default DashboardPage;