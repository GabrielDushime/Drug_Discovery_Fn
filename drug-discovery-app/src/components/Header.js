import React, { useEffect, useState } from 'react';
import { Layout, Typography } from 'antd';
import styles from '../styles/Header.module.css';

const { Header } = Layout;
const { Title } = Typography;

const HeaderComponent = () => {
  
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1); 
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => {
        
        const newPosition = prev + (0.2 * direction);
        
       
        if (newPosition >= 100) {
          setDirection(-1);
          return 100;
        } else if (newPosition <= 0) {
          setDirection(1);
          return 0;
        }
        
        return newPosition;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <Header className={styles.header}>
      <img src="/images/logo.jpg" alt="Logo" className={styles.logo} />
      <div className={styles.movingTextContainer}>
        <div 
          className={styles.movingText} 
          style={{ transform: `translateX(${position}%)` }}
        >
          <Title level={1}>Scientific Computing for Drug Discovery</Title>
        </div>
      </div>
    </Header>
  );
};

export default HeaderComponent;