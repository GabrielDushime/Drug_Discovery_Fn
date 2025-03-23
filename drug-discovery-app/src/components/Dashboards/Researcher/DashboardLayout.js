import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Sidebar from '../../Dashboards/Researcher/Sider';
import styles from '../../../styles/DashboardLayout.module.css';

const { Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
   
    checkIfMobile();
    
    
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const checkIfMobile = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
  
    if (mobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout className={styles.dashboardLayout}>
    
      <Header className={styles.fixedHeader} />
      
    
      <Layout className={styles.bodyContent}>
        <Sidebar 
          collapsed={collapsed} 
          toggleCollapsed={toggleCollapsed} 
          className={styles.sidebar}
        />
        
        <Content 
          className={`${styles.contentArea} ${collapsed && !isMobile ? styles.collapsedContent : ''} ${
            isMobile ? styles.mobileContent : ''
          }`}
        >
          {children}
        </Content>
      </Layout>
      
      
      <Footer className={styles.fixedFooter} />
    </Layout>
  );
};

export default DashboardLayout;