
import React from 'react';
import { Row, Col, Typography } from 'antd';
import styles from '../styles/Footer.module.css';

const { Title, Text, Paragraph } = Typography;

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Title level={4}>About the Project</Title>
          <Paragraph>
            Scientific Computing for Drug Discovery provides a web-based interface for pharmaceutical companies 
            to submit molecular models for simulation and analysis.
          </Paragraph>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Title level={4}>Features</Title>
          <ul className={styles.footerList}>
            <li>Molecular model submission</li>
            <li>Distributed simulation execution</li>
            <li>Interactive 3D visualization</li>
            <li>Advanced data analysis</li>
          </ul>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Title level={4}>Technologies</Title>
          <ul className={styles.footerList}>
            <li>Backend: NestJS, TypeScript</li>
            <li>Frontend: Next.js, Three.js</li>
            <li>Simulation: OpenMM, Dask</li>
            <li>Database: PostgreSQL</li>
          </ul>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Title level={4}>Contact</Title>
          <Paragraph>
            College of Science and Technology<br />
            School of ICT<br />
            Department of Computer and Software Engineering<br />
            Email: support@drugdiscovery.com
          </Paragraph>
        </Col>
      </Row>
      <Row className={styles.copyright}>
        <Col span={24}>
          <Text>© 2025 Scientific Computing for Drug Discovery. All rights reserved.</Text>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;