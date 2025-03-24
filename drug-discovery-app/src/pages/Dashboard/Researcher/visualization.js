import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Spin, Typography, Tabs, Select, Button, Space, message, Radio, Empty,
  Slider, Tooltip, Switch, Row, Col
} from 'antd';
import { 
  ReloadOutlined, ExpandOutlined, CompressOutlined, 
  PlayCircleOutlined, PauseCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../../components/Dashboards/Researcher/DashboardLayout';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import styles from '../../../styles/Visualization.module.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const VisualizationPage = () => {
 
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedSimulationId, setSelectedSimulationId] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [activeTab, setActiveTab] = useState('model');
  const [viewMode, setViewMode] = useState('ball-and-stick');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showBonds, setShowBonds] = useState(true);
  const [colorBy, setColorBy] = useState('element');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);


  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const moleculeGroupRef = useRef(null);
  const playIntervalRef = useRef(null);
  
  const SimulationStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  };

 
  const elementColors = {
    H: 0xFFFFFF,  
    C: 0x808080,  
    N: 0x0000FF, 
    O: 0xFF0000,  
    P: 0xFFA500,  
    S: 0xFFFF00,  
    CL: 0x00FF00, 
    default: 0xAAAAAA 
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (rendererRef.current && containerRef.current) {
        rendererRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };


  const fetchModelsAndSimulations = async () => {
    try {
     
      const modelsResponse = await axios.get('http://localhost:8000/molecular-models', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setModels(modelsResponse.data);

     
      const simulationsResponse = await axios.get('http://localhost:8000/simulations/my-simulations', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      const completedSimulations = simulationsResponse.data.filter(
        sim => (
            (sim.status === SimulationStatus.COMPLETED || 
             sim.status?.toLowerCase() === SimulationStatus.COMPLETED.toLowerCase()) && 
            sim.results
          )
      );
      
      setSimulations(completedSimulations);
      
      if (modelsResponse.data.length > 0) {
        setSelectedModelId(modelsResponse.data[0].id);
      }
      
      if (completedSimulations.length > 0) {
        setSelectedSimulationId(completedSimulations[0].id);
      }
    } catch (error) {
      
    }
  };

 
  useEffect(() => {
    fetchModelsAndSimulations();
  }, []);

 
  useEffect(() => {
    const loadVisualizationData = async () => {
      if (activeTab === 'model' && selectedModelId) {
        await fetchModelData(selectedModelId);
      } else if (activeTab === 'trajectory' && selectedSimulationId) {
        await fetchTrajectoryData(selectedSimulationId);
      }
    };

    loadVisualizationData();
  }, [activeTab, selectedModelId, selectedSimulationId]);

  const fetchModelData = async (modelId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/visualization/model/${modelId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setVisualizationData(response.data);
      setFrameCount(0); 
      setCurrentFrame(0);
    } catch (error) {
  
    } finally {
      setLoading(false);
    }
  };

  const fetchTrajectoryData = async (simulationId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/visualization/trajectory/${simulationId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setVisualizationData(response.data);
      setFrameCount(response.data.trajectory?.length || 0);
      setCurrentFrame(0);
      setIsPlaying(false);
    } catch (error) {
     
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (visualizationData && containerRef.current) {
      initScene();
      return () => {
        cleanupScene();
      };
    }
  }, [visualizationData, viewMode, showBonds, colorBy]);

 
  useEffect(() => {
    if (
      visualizationData && 
      activeTab === 'trajectory' && 
      visualizationData.trajectory && 
      visualizationData.trajectory.length > 0 &&
      moleculeGroupRef.current
    ) {
      updateMoleculePosition(currentFrame);
    }
  }, [currentFrame, visualizationData]);

 
  useEffect(() => {
    if (isPlaying && frameCount > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame((prevFrame) => {
          if (prevFrame >= frameCount - 1) {
            return 0;
          }
          return prevFrame + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, frameCount, playbackSpeed]);

  const initScene = () => {
    if (!containerRef.current) return;

    
    cleanupScene();

    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

  
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

   
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;

    
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    
    createMolecule();

   
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const cleanupScene = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  };

  const createMolecule = () => {
    if (!visualizationData || !sceneRef.current) return;

    const structureData = activeTab === 'model' ? 
      visualizationData.structureData : 
      visualizationData.model.structureData;

    if (!structureData || !structureData.atoms) return;

    const moleculeGroup = new THREE.Group();
    moleculeGroupRef.current = moleculeGroup;

   
    const atoms = structureData.atoms;
    const atomMeshes = [];

    atoms.forEach((atom, index) => {
      let color;
      
      if (colorBy === 'element') {
        
        const element = atom.element.toUpperCase();
        color = elementColors[element] || elementColors.default;
      } else if (colorBy === 'residue') {
       
        const hash = hashCode(atom.residueName);
        color = new THREE.Color(`hsl(${hash % 360}, 70%, 50%)`).getHex();
      } else if (colorBy === 'chain') {
    
        const hash = hashCode(atom.chainId);
        color = new THREE.Color(`hsl(${hash % 360}, 70%, 50%)`).getHex();
      }

   
      let radius = 0.5;
      if (viewMode === 'spacefill') {
       
        radius = getAtomRadius(atom.element) || 1.0;
      } else if (viewMode === 'ball-and-stick') {
        radius = 0.3;
      }

      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshPhongMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
      moleculeGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    
    if (showBonds && structureData.bonds) {
      structureData.bonds.forEach(bond => {
        if (bond.atomIndex1 < atoms.length && bond.atomIndex2 < atoms.length) {
          const atom1 = atoms[bond.atomIndex1];
          const atom2 = atoms[bond.atomIndex2];
          
          const start = new THREE.Vector3(atom1.position.x, atom1.position.y, atom1.position.z);
          const end = new THREE.Vector3(atom2.position.x, atom2.position.y, atom2.position.z);
          
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();
          
         
          const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
          const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
          
          const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
          
         
          bondMesh.position.copy(start);
          bondMesh.position.add(direction.multiplyScalar(0.5));
          bondMesh.lookAt(end);
          bondMesh.rotateX(Math.PI / 2);
          
          moleculeGroup.add(bondMesh);
        }
      });
    }

   
    sceneRef.current.add(moleculeGroup);

   
    centerCamera();
  };

  const updateMoleculePosition = (frameIndex) => {
   
    if (moleculeGroupRef.current) {
      moleculeGroupRef.current.rotation.y = (frameIndex * 0.1) % (2 * Math.PI);
    }
  };

  const centerCamera = () => {
    if (moleculeGroupRef.current && cameraRef.current) {
     
      const boundingBox = new THREE.Box3().setFromObject(moleculeGroupRef.current);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
    
      moleculeGroupRef.current.position.sub(center);
      
      
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let distance = maxDim / (2 * Math.tan(fov / 2));
      
      
      distance *= 1.5;
      
      
      cameraRef.current.position.z = distance;
      cameraRef.current.near = distance / 100;
      cameraRef.current.far = distance * 100;
      cameraRef.current.updateProjectionMatrix();
      
   
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  };

  const getAtomRadius = (element) => {
  
    const radii = {
      'H': 1.2,
      'C': 1.7,
      'N': 1.55,
      'O': 1.52,
      'P': 1.8,
      'S': 1.8,
      'CL': 1.75
    };
    return radii[element.toUpperCase()] || 1.5;
  };

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setIsPlaying(false);
  };

  const handleModelChange = (modelId) => {
    setSelectedModelId(modelId);
  };

  const handleSimulationChange = (simulationId) => {
    setSelectedSimulationId(simulationId);
    setIsPlaying(false);
  };

  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  const handleColorByChange = (value) => {
    setColorBy(value);
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (!isFullScreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullScreen(!isFullScreen);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFrameChange = (value) => {
    setCurrentFrame(value);
  };

  const handleSpeedChange = (value) => {
    setPlaybackSpeed(value);
  };

  const handleBondsToggle = (checked) => {
    setShowBonds(checked);
  };

  const refreshData = () => {
    if (activeTab === 'model' && selectedModelId) {
      fetchModelData(selectedModelId);
    } else if (activeTab === 'trajectory' && selectedSimulationId) {
      fetchTrajectoryData(selectedSimulationId);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.visualizationContainer}>
        <Card className={styles.visualizationCard}>
          <div className={styles.visualizationHeader}>
            <Title level={3}>Molecular Visualization</Title>
            <Space wrap>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refreshData}
              >
                Refresh
              </Button>
            </Space>
          </div>
          
          <Tabs activeKey={activeTab} onChange={handleTabChange} className={styles.visualizationTabs}>
            <TabPane tab="Static Model" key="model">
              <div className={styles.controlsPanel}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={8}>
                    <Text strong>Select Model:</Text>
                    <Select
                      value={selectedModelId}
                      onChange={handleModelChange}
                      placeholder="Select a molecular model"
                      className={styles.fullWidthSelect}
                      loading={loading}
                    >
                      {models.map(model => (
                        <Option key={model.id} value={model.id}>{model.name}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={8}>
                    <Text strong>View Mode:</Text>
                    <Radio.Group 
                      value={viewMode} 
                      onChange={handleViewModeChange}
                      optionType="button" 
                      buttonStyle="solid"
                      className={styles.viewModeRadio}
                    >
                      <Radio.Button value="ball-and-stick">Ball & Stick</Radio.Button>
                      <Radio.Button value="spacefill">Space Fill</Radio.Button>
                      <Radio.Button value="wireframe">Wireframe</Radio.Button>
                    </Radio.Group>
                  </Col>
                  <Col xs={24} md={8}>
                    <Space direction="vertical" className={styles.visualControls}>
                      <div>
                        <Text strong>Color By:</Text>
                        <Select
                          value={colorBy}
                          onChange={handleColorByChange}
                          className={styles.fullWidthSelect}
                        >
                          <Option value="element">Element</Option>
                          <Option value="residue">Residue</Option>
                          <Option value="chain">Chain</Option>
                        </Select>
                      </div>
                      <div>
                        <Text strong style={{ marginRight: '8px' }}>Show Bonds:</Text>
                        <Switch checked={showBonds} onChange={handleBondsToggle} />
                      </div>
                    </Space>
                  </Col>
                </Row>
              </div>
            </TabPane>
            <TabPane tab="Trajectory Animation" key="trajectory">
              <div className={styles.controlsPanel}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={8}>
                    <Text strong>Select Simulation:</Text>
                    <Select
                      value={selectedSimulationId}
                      onChange={handleSimulationChange}
                      placeholder="Select a completed simulation"
                      className={styles.fullWidthSelect}
                      loading={loading}
                    >
                      {simulations.map(sim => (
                        <Option key={sim.id} value={sim.id}>{sim.name}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={8}>
                    <Space direction="vertical" className={styles.trajectoryControls}>
                      <div className={styles.playbackControls}>
                        <Button 
                          type="primary" 
                          shape="circle" 
                          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                          onClick={togglePlayPause}
                          disabled={!frameCount}
                        />
                        <Slider 
                          min={0} 
                          max={frameCount > 0 ? frameCount - 1 : 0} 
                          value={currentFrame}
                          onChange={handleFrameChange}
                          disabled={!frameCount}
                          className={styles.frameSlider}
                        />
                      </div>
                      <div>
                        <Text strong>Playback Speed:</Text>
                        <Slider 
                          min={0.5} 
                          max={5} 
                          step={0.5}
                          value={playbackSpeed}
                          onChange={handleSpeedChange}
                          disabled={!frameCount}
                          className={styles.speedSlider}
                          marks={{ 0.5: '0.5x', 1: '1x', 3: '3x', 5: '5x' }}
                        />
                      </div>
                    </Space>
                  </Col>
                  <Col xs={24} md={8}>
                    <Space direction="vertical" className={styles.visualControls}>
                      <div>
                        <Text strong>View Mode:</Text>
                        <Radio.Group 
                          value={viewMode} 
                          onChange={handleViewModeChange}
                          optionType="button" 
                          buttonStyle="solid"
                          className={styles.viewModeRadio}
                        >
                          <Radio.Button value="ball-and-stick">Ball & Stick</Radio.Button>
                          <Radio.Button value="spacefill">Space Fill</Radio.Button>
                        </Radio.Group>
                      </div>
                      <div>
                        <Text strong style={{ marginRight: '8px' }}>Show Bonds:</Text>
                        <Switch checked={showBonds} onChange={handleBondsToggle} />
                      </div>
                    </Space>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </Tabs>
          
          <div className={styles.visualizationWrapper}>
            <Button 
              icon={isFullScreen ? <CompressOutlined /> : <ExpandOutlined />}
              className={styles.fullscreenButton}
              onClick={toggleFullScreen}
              type="text"
            />
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spin size="large" tip="Loading visualization..." />
              </div>
            ) : visualizationData ? (
              <div 
                ref={containerRef} 
                className={styles.visualizationCanvas}
              />
            ) : (
              <div className={styles.emptyState}>
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text>
                      {activeTab === 'model' 
                        ? "Select a molecular model to visualize" 
                        : "Select a simulation to visualize its trajectory"}
                    </Text>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={refreshData}
                  >
                    Load Visualization
                  </Button>
                </Empty>
              </div>
            )}
          </div>
          
          {visualizationData && (
            <div className={styles.infoSection}>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Title level={4}>
                    {activeTab === 'model' 
                      ? `Model: ${visualizationData.name}` 
                      : `Simulation: ${visualizationData.simulation?.name}`}
                  </Title>
                  <Text>
                    {activeTab === 'model' 
                      ? visualizationData.description 
                      : `Type: ${visualizationData.simulation?.type}`}
                  </Text>
                </Col>
                <Col xs={24} md={12}>
                  <div className={styles.statsSection}>
                    <Text strong>Structure Information:</Text>
                    <ul className={styles.statsList}>
                      <li>
                        <Text>Atoms: {visualizationData.structureData?.atomCount || 
                          visualizationData.model?.structureData?.atomCount || 0}</Text>
                      </li>
                      <li>
                        <Text>Bonds: {visualizationData.structureData?.bondCount || 
                          visualizationData.model?.structureData?.bondCount || 0}</Text>
                      </li>
                      {activeTab === 'trajectory' && (
                        <li>
                          <Text>Trajectory Frames: {frameCount}</Text>
                        </li>
                      )}
                    </ul>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VisualizationPage;