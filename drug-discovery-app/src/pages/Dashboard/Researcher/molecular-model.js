import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Input, Button, Space, Tag, Typography, Modal, Form, 
  Select, message, Popconfirm, Upload, Descriptions, Spin, Empty
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, 
  UploadOutlined, DownloadOutlined, FileOutlined, CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Researcher/DashboardLayout';
import axiosInstance from '../../../lib/axiosInstance';
import styles from '../../../styles/Molecular-Model.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MolecularModelsPage = () => {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredModels, setFilteredModels] = useState([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  

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

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/molecular-models', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      console.log('Models response:', response.data);
      setModels(response.data);
      setFilteredModels(response.data);
      setLoading(false);
    } catch (error) {
     
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = models.filter(
        model => 
          model.name?.toLowerCase().includes(searchText.toLowerCase()) || 
          model.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [searchText, models]);

  const handleSearch = e => {
    setSearchText(e.target.value);
  };

  const handleUploadModel = () => {
    uploadForm.resetFields();
    setFileList([]);
    setIsUploadModalVisible(true);
  };

  const handleViewModel = async (modelId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/molecular-models/${modelId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setCurrentModel(response.data);
      setIsViewModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching model details:', error);
      message.error('Failed to fetch model details');
      setLoading(false);
    }
  };

  const handleDeleteModel = async (modelId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/molecular-models/${modelId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      message.success('Molecular model deleted successfully');
      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      message.error('Failed to delete model');
      setLoading(false);
    }
  };

  const handleDownloadModel = async (modelId, modelName) => {
    try {
      const response = await axiosInstance.get(`/molecular-models/${modelId}/file`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        responseType: 'blob',
      });
      
     
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${modelName}.${currentModel?.format.toLowerCase() || 'pdb'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Model download started');
    } catch (error) {
      console.error('Error downloading model:', error);
      message.error('Failed to download model');
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const validExtensions = ['.pdb', '.mol2', '.sdf'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(ext)) {
        message.error('Only PDB, MOL2, or SDF files are allowed!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const submitUploadModel = async () => {
    try {
      if (fileList.length === 0) {
        message.error('Please select a file to upload');
        return;
      }
      
      const values = await uploadForm.validateFields();
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', fileList[0]);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      
      if (values.format) {
        formData.append('format', values.format);
      }
      
      const response = await axiosInstance.post('/molecular-models', formData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      message.success('Molecular model uploaded successfully');
      setIsUploadModalVisible(false);
      fetchModels();
    } catch (error) {
      console.error('Error uploading model:', error);
      
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          message.error(error.response.data);
        } else {
          message.error('Failed to upload model. Please try again.');
        }
      } else {
        message.error('An error occurred. Please try again later.');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
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
        title: 'Format',
        dataIndex: 'format',
        key: 'format',
        render: format => <Tag color="blue">{format}</Tag>,
        width: '90px',
      },
      {
        title: 'Status',
        dataIndex: 'isValidated',
        key: 'isValidated',
        render: (isValidated) => (
          isValidated ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Valid</Tag> : 
          <Tag icon={<CloseCircleOutlined />} color="error">Invalid</Tag>
        ),
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
              onClick={() => handleViewModel(record.id)}
            />
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownloadModel(record.id, record.name)}
            />
            <Popconfirm
              title="Are you sure you want to delete this model?"
              onConfirm={() => handleDeleteModel(record.id)}
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

    
    if (windowWidth >= 992) {
      baseColumns.splice(1, 0, {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      });
    }


    if (windowWidth >= 1200) {
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: 'Uploaded',
        dataIndex: 'uploadedAt',
        key: 'uploadedAt',
        render: date => formatDate(date),
        width: '180px',
      });
    }

    return baseColumns;
  };

  const renderValidationResults = (results) => {
    if (!results || Object.keys(results).length === 0) {
      return <Text>No validation data available</Text>;
    }

    return (
      <Descriptions bordered size="small" column={1}>
        {Object.entries(results).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {typeof value === 'boolean' ? (
              value ? <Tag color="success">Pass</Tag> : <Tag color="error">Fail</Tag>
            ) : (
              <span>{value}</span>
            )}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.modelsContainer}>
        <Card className={styles.modelsCard}>
          <div className={styles.modelsHeader}>
            <Title level={3}>Molecular Models</Title>
            <Space wrap className={styles.actionSpace}>
              <Input 
                placeholder="Search models" 
                prefix={<SearchOutlined />} 
                className={styles.searchInput}
                value={searchText}
                onChange={handleSearch}
                allowClear
              />
              <Space>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  onClick={handleUploadModel}
                >
                  {windowWidth > 576 ? 'Upload Model' : ''}
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchModels}
                >
                  {windowWidth > 576 ? 'Refresh' : ''}
                </Button>
              </Space>
            </Space>
          </div>
          
          <div className={styles.tableWrapper}>
            {models.length === 0 && !loading ? (
              <Empty 
                description="No molecular models found" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table 
                columns={getColumnsByScreenSize()} 
                dataSource={filteredModels} 
                rowKey="id"
                loading={loading}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total: ${total} models`,
                  responsive: true,
                }}
                className={styles.modelsTable}
                scroll={{ x: 'max-content' }}
                size={windowWidth < 768 ? "small" : "middle"}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Upload Model Modal */}
      <Modal
        title="Upload Molecular Model"
        open={isUploadModalVisible}
        onCancel={() => setIsUploadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsUploadModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={submitUploadModel} loading={uploading}>
            Upload
          </Button>,
        ]}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            name="name"
            label="Model Name"
            rules={[{ required: true, message: 'Please enter model name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="format"
            label="Format"
            help="If not specified, format will be detected from file extension"
          >
            <Select placeholder="Auto-detect">
              <Option value="pdb">PDB</Option>
              <Option value="mol2">MOL2</Option>
              <Option value="sdf">SDF</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="file"
            label="Model File"
            rules={[{ required: true, message: 'Please upload a model file' }]}
          >
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Model Modal */}
      <Modal
        title="Molecular Model Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={windowWidth < 768 ? '95%' : 700}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadModel(currentModel?.id, currentModel?.name)}
          >
            Download File
          </Button>,
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : currentModel && (
          <div className={styles.modelDetails}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Name" span={2}>{currentModel.name}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {currentModel.description || <Text type="secondary">No description</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Format">
                <Tag icon={<FileOutlined />} color="blue">{currentModel.format}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Validation Status">
                {currentModel.isValidated ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">Valid</Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">Invalid</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded At">{formatDate(currentModel.uploadedAt)}</Descriptions.Item>
            </Descriptions>
            
            <div className={styles.validationSection}>
              <Title level={5}>Validation Results</Title>
              {renderValidationResults(currentModel.validationResults)}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default MolecularModelsPage;