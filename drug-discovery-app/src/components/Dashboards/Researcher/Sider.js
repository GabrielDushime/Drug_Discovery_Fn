import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { useRouter } from 'next/router';
import {
  DashboardOutlined,
  UserOutlined,
  ExperimentOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ClusterOutlined,
  BarChartOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import styles from '../../../styles/Sider.module.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, toggleCollapsed, className }) => {
  const router = useRouter();
  const [userName, setUserName] = useState('Admin');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
   
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }

    
    checkIfMobile();
    
    
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const checkIfMobile = () => {
    setIsMobile(window.innerWidth <= 768);
   
    if (window.innerWidth <= 768 && !collapsed && toggleCollapsed) {
      toggleCollapsed();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const userMenu = (
    <Menu className={styles.userDropdownMenu}>
      <Menu.Item key="profile" icon={<UserOutlined />}>
      <Link href="/profile">Profile</Link>
    </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link href="/admin/settings">Settings</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const navItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/Dashboard/Researcher/dashboard">Dashboard</Link>,
    },
   
    {
      key: 'molecular-models',
      icon: <ClusterOutlined />,
      label: <Link href="/Dashboard/Researcher/molecular-model">Molecular Models</Link>,
    },
    {
      key: 'simulations',
      icon: <ExperimentOutlined />,
      label: <Link href="/Dashboard/Researcher/simulation">Simulations</Link>,
    },
    {
      key: 'data-export',
      icon: <ExportOutlined />,
      label: <Link href="/Dashboard/Researcher/data-export">Data Export</Link>,
    },
    {
      key: 'visualization',
      icon: <BarChartOutlined />,
      label: <Link href="/Dashboard/Researcher/visualization">Visualization</Link>,
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      collapsedWidth={isMobile ? 0 : 80}
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${className || ''}`}
      breakpoint="lg"
    >
      {/* User Profile Section */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <Avatar 
            size={collapsed ? 36 : 50} 
            icon={<UserOutlined />} 
            className={styles.avatar}
            style={{ backgroundColor: '#ff7700' }}
          />
          {!collapsed && (
            <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
              <div className={styles.userDetails}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userRole}>Researcher</span>
                <SettingOutlined className={styles.settingsIcon} />
              </div>
            </Dropdown>
          )}
        </div>
        
        {/* Collapsed state mini menu */}
        {collapsed && (
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              className={styles.collapsedMenuButton}
            />
          </Dropdown>
        )}
      </div>

      {/* Navigation Menu */}
      <div className={styles.menuContainer}>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[router.pathname.split('/').pop() || 'dashboard']}
          className={collapsed ? `${styles.navMenu} ${styles.collapsedMenu}` : styles.navMenu}
          items={navItems}
        />
      </div>

      {/* Toggle Button for Mobile */}
      {isMobile && (
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          className={styles.mobileToggle}
        />
      )}
      
    
    </Sider>
  );
};

export default Sidebar;