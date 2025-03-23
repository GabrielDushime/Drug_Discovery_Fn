import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, message, Card, Divider, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import styles from '../styles/Auth.module.css';
import Footer from '../components/Footer';
import HeaderComponent from '../components/Header';

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        email: values.email,
        password: values.password
      });
      
      const { access_token, user } = response.data;
      
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.fullName);
      localStorage.setItem('userId', user.id);
      
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      
      
      
      if (user.role === 'admin') {
        router.push('/Dashboard/Admin/dashboard');
      } else {
        router.push('/Dashboard/Researcher/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderComponent />
      <Content style={{ flex: '1 0 auto' }}>
        <div className={styles.authContainer}>
          <div className={styles.authWrapper}>
            <Card className={styles.authCard}>
              <div className={styles.logoContainer}>
                <img src="/images/logo.jpg" alt="Logo" className={styles.logo} />
              </div>
              
              <Title level={2} className={styles.authTitle}>Welcome Back</Title>
              <Text className={styles.authSubtitle}>Sign in to continue to Scientific Computing for Drug Discovery</Text>
              
              <Form
                name="login_form"
                className={styles.authForm}
                initialValues={{ remember: true }}
                onFinish={onFinish}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email address!' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className={styles.siteFormItemIcon} />} 
                    placeholder="Email" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                    placeholder="Password"
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item>
                  <div className={styles.rememberForgot}>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox className={styles.customCheckbox}>Remember me</Checkbox>
                    </Form.Item>
                    <Link href="/forgot-password" className={styles.forgotLink}>
                      Forgot password?
                    </Link>
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className={styles.authButton}
                    loading={loading}
                    block
                  >
                    Log in
                  </Button>
                </Form.Item>
                
                <Divider plain>Or</Divider>
                
                <div className={styles.authRedirect}>
                  <Text>Don't have an account?</Text>
                  <Link href="/signup" className={styles.redirectLink}>
                    Sign up now
                  </Link>
                </div>
              </Form>
            </Card>
            
            <div className={styles.returnHome}>
              <Button type="link" onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default LoginPage;