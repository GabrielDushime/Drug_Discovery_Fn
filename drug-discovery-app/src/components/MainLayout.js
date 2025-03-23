import React from 'react';
import { Layout, ConfigProvider } from 'antd';
import Head from 'next/head';

const MainLayout = ({ children, title = 'Scientific Computing for Drug Discovery' }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Head>
        <title>{title}</title>
        <meta name="description" content="Scientific Computing for Drug Discovery - A platform for pharmaceutical companies to simulate and analyze molecular models" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Layout style={{ minHeight: '100vh' }}>
        {children}
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;