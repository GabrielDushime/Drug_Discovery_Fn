import React from 'react';
import LoginPage from '../components/LoginPage';
import MainLayout from '../components/MainLayout';
import { Footer } from 'antd/es/layout/layout';

export default function Login() {
  return (
    <MainLayout title="Login - Scientific Computing for Drug Discovery">
      <LoginPage />
     
    </MainLayout>
  );
}