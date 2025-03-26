import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Space, Tag, Typography, Modal, Form, Select, message, Popconfirm } from 'antd';
import { SearchOutlined, UserAddOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Admin/DashboardLayout';
import styles from '../../../styles/UsersPage.module.css';
import axiosInstance from '../../../lib/axiosInstance';

const { Title } = Typography;
const { Option } = Select;

const UsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/users', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      console.log('Users response:', response.data);
      setUsers(response.data);
      setFilteredUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(
        user => 
          user.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
          user.email?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);

  const handleSearch = e => {
    setSearchText(e.target.value);
  };

  const handleAddUser = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    editForm.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    setIsEditModalVisible(true);
  };

  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setCurrentUser(response.data);
      setIsViewModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      
      if (process.env.NODE_ENV === 'development' && users) {
        const user = users.find(u => u.id === userId);
        if (user) {
          setCurrentUser(user);
          setIsViewModalVisible(true);
          message.warning('Using cached data (API connection failed)');
        } else {
          message.error('Failed to fetch user details');
        }
      } else {
        message.error('Failed to fetch user details');
      }
      
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (process.env.NODE_ENV === 'development') {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setFilteredUsers(prev => prev.filter(user => user.id !== userId));
        message.warning('User deleted (mock operation)');
        setLoading(false);
      } else {
        message.error('Failed to delete user');
        setLoading(false);
      }
    }
  };

  const submitAddUser = async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true);
      
      const userData = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role
      };
      
      const response = await axiosInstance.post('/users/create', userData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      message.success('User created successfully');
      setIsAddModalVisible(false);
      fetchUsers();
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        if (errorData.email && errorData.email.includes('already exists')) {
          message.error('Email already exists. Please use a different email address.');
        } else if (typeof errorData === 'object') {
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey) {
            message.error(`${firstErrorKey}: ${errorData[firstErrorKey]}`);
          } else {
            message.error('Failed to create user. Please try again.');
          }
        } else {
          message.error('Failed to create user. Please try again.');
        }
      } else {
        message.error('An error occurred. Please try again later.');
      }
      
      setLoading(false);
    }
  };

  const submitEditUser = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      
      const userData = {
        fullName: values.fullName,
        email: values.email,
        role: values.role
      };
      
      await axiosInstance.put(`users/${currentUser.id}`, userData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      message.success('User updated successfully');
      setIsEditModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  
  const getColumns = () => {
    
    const baseColumns = [
      {
        title: 'Name',
        dataIndex: 'fullName',
        key: 'fullName',
        sorter: (a, b) => a.fullName.localeCompare(b.fullName),
        ellipsis: true,
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: (role) => {
          let color = 'blue';
          if (role === 'ADMIN') color = 'gold';
          if (role === 'RESEARCHER') color = 'green';
          
          return <Tag color={color}>{role}</Tag>;
        },
        width: '100px',
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '120px',
        render: (_, record) => (
          <Space size="small">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewUser(record.id)}
            />
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditUser(record)}
            />
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];


    if (windowWidth >= 768) {
      baseColumns.splice(1, 0, {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
      });
    }

    return baseColumns;
  };

  return (
    <DashboardLayout>
      <div className={styles.usersContainer}>
        <Card className={styles.usersCard}>
          <div className={styles.usersHeader}>
            <Title level={3}>User Management</Title>
            <Space wrap className={styles.actionSpace}>
              <Input 
                placeholder="Search users" 
                prefix={<SearchOutlined />} 
                className={styles.searchInput}
                value={searchText}
                onChange={handleSearch}
                allowClear
              />
              <Space>
                <Button 
                  type="primary" 
                  icon={<UserAddOutlined />}
                  onClick={handleAddUser}
                >
                  {windowWidth > 576 ? 'Add User' : ''}
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                >
                  {windowWidth > 576 ? 'Refresh' : ''}
                </Button>
              </Space>
            </Space>
          </div>
          
          <div className={styles.tableWrapper}>
            <Table 
              columns={getColumns()} 
              dataSource={filteredUsers} 
              rowKey="id"
              loading={loading}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} users`,
                responsive: true,
              }}
              className={styles.usersTable}
              scroll={{ x: 'max-content' }}
              size={windowWidth < 768 ? "small" : "middle"}
            />
          </div>
        </Card>
      </div>

      {/* Add User Modal */}
      <Modal
        title="Add New User"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={submitAddUser} loading={loading}>
            Create User
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="Add Role"
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="researcher">Researcher</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={submitEditUser} loading={loading}>
            Update User
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
         
          <Form.Item
            name="role"
            label="Role"
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="researcher">Researcher</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View User Modal */}
      <Modal
        title="User Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {currentUser && (
          <div>
            <p><strong>Name:</strong> {currentUser.fullName}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
            <p><strong>Created:</strong> {formatDate(currentUser.createdAt)}</p>
            <p><strong>Last Updated:</strong> {formatDate(currentUser.updatedAt)}</p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default UsersPage;