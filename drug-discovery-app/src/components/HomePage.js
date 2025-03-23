import React, { useState } from 'react';
import { Button, Carousel, Layout, Typography, Row, Col } from 'antd';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Footer from '../components/Footer';
import HeaderComponent from '../components/Header';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleLoginClick = () => {
    setLoading(true);
    router.push('/login');
  };
  
  const carouselItems = [
    {
      image: '/images/5.jpg',
      title: 'Advanced Molecular Simulations',
      description: 'Upload molecular models and run high-performance simulations in the cloud'
    },
    {
      image: '/images/4.jpg',
      title: 'Interactive Data Analysis',
      description: 'Visualize and analyze simulation results with powerful analytical tools'
    },
    {
      image: '/images/5.jpg',
      title: '3D Molecular Visualization',
      description: 'Explore molecular structures in 3D with interactive visualization tools'
    }
  ];

  return (
    <Layout className={styles.layout}>
      <HeaderComponent />
      
      <Content className={styles.content}>
        <div className={styles.heroSection}>
          <Carousel autoplay className={styles.carousel}>
            {carouselItems.map((item, index) => (
              <div key={index} className={styles.carouselItem}>
                <div className={styles.carouselContent} style={{ backgroundImage: `url(${item.image})` }}>
                  <div className={styles.carouselOverlay}>
                    <Title level={2} className={styles.carouselTitle}>{item.title}</Title>
                    <Paragraph className={styles.carouselDescription}>{item.description}</Paragraph>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
          
          <div className={styles.buttonContainer}>
            <Button
              type="primary"
              size="large"
              onClick={handleLoginClick}
               loading={loading} 
              className={styles.loginButton}
            >
              Login to Continue
            </Button>
          </div>
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
};

export default HomePage;