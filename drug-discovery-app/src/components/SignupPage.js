import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card, Divider, Select, Layout } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import styles from '../styles/Auth.module.css';
import Footer from '../components/Footer';
import HeaderComponent from '../components/Header';
import Image from 'next/image';

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const defaultValues = {
    email: "researcher@example.com",
    password: "StrongPassword123!",
    fullName: "John Doe",
    role: "researcher"
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      await axios.post('https://drug-discovery-bn.onrender.com/users/create', {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: "researcher"
      });
   
      message.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.response?.status === 409) {
        message.error('Email already exists. Please use a different email or log in.');
      } else {
        message.error(error.response?.data?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderComponent/>
      <Content style={{ flex: '1 0 auto' }}>
        <div className={styles.authContainer}>
          <div className={styles.authWrapper}>
            <Card className={styles.authCard}>
            <div className={styles.logoContainer}>
  <Image 
    src="/images/logo.jpg" 
    alt="Logo" 
    className={styles.logo} 
    width={150}  
    height={50}  
  />
</div>
              
              <Title level={2} className={styles.authTitle}>Create Account</Title>
              <Text className={styles.authSubtitle}>Sign up to start using Scientific Computing for Drug Discovery</Text>
              
              <Form
                name="signup_form"
                className={styles.authForm}
                onFinish={onFinish}
                initialValues={defaultValues}
              >
                <Form.Item
                  name="fullName"
                  rules={[{ required: true, message: 'Please input your full name!' }]}
                >
                  <Input 
                    prefix={<UserOutlined className={styles.siteFormItemIcon} />} 
                    placeholder="Full Name" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email address!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className={styles.siteFormItemIcon} />} 
                    placeholder="Email" 
                    size="large"
                  />
                </Form.Item>
                
                {/* Hidden Role Field with Default Value */}
                <Form.Item name="role" hidden initialValue="researcher">
                  <Input type="hidden" />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { min: 8, message: 'Password must be at least 8 characters long!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                    placeholder="Password"
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                    placeholder="Confirm Password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className={styles.authButton}
                    loading={loading}
                    block
                  >
                    Sign Up
                  </Button>
                </Form.Item>
                
                <Divider plain>Or</Divider>
                
                <div className={styles.authRedirect}>
                  <Text>Already have an account?</Text>
                  <Link href="/login" className={styles.redirectLink}>
                    Log in
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

export default SignupPage;