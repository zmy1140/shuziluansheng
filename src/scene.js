import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function setupScene(sceneRoot, statusNode, notifyModelStatus = null) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sceneRoot.clientWidth || 800, sceneRoot.clientHeight || 420);
  sceneRoot.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07111c, 12, 30);

  const camera = new THREE.PerspectiveCamera(
    42,
    (sceneRoot.clientWidth || 800) / (sceneRoot.clientHeight || 420),
    0.1,
    100,
  );
  camera.position.set(4.8, 3.4, 6.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.target.set(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xbfe8ff, 0.8);
  const key = new THREE.DirectionalLight(0x71d7ff, 2.4);
  key.position.set(5, 6, 5);
  const rim = new THREE.PointLight(0xff8d3a, 20, 30, 2);
  rim.position.set(-3, 1.5, -4);
  scene.add(ambient, key, rim);

  const floorGrid = new THREE.GridHelper(24, 28, 0x0d86d1, 0x0d3650);
  floorGrid.position.y = -1.5;
  floorGrid.material.opacity = 0.28;
  floorGrid.material.transparent = true;
  scene.add(floorGrid);

  const rearGrid = new THREE.GridHelper(20, 20, 0x0f9df0, 0x0a2d46);
  rearGrid.rotation.x = Math.PI / 2;
  rearGrid.position.set(0, 1.2, -4.8);
  rearGrid.material.opacity = 0.2;
  rearGrid.material.transparent = true;
  scene.add(rearGrid);

  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.025, 20, 120),
    new THREE.MeshBasicMaterial({ color: 0x1ed6ff }),
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = -0.55;
  scene.add(glowRing);

  const processingGroup = new THREE.Group();
  processingGroup.name = "processing-demo";

  const plateWidth = 4.4;
  const plateDepth = 2.8;
  const plateHeight = 0.24;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth),
    new THREE.MeshPhysicalMaterial({
      color: 0x344c61,
      roughness: 0.56,
      metalness: 0.28,
      clearcoat: 0.2,
    }),
  );
  plate.position.y = -plateHeight / 2;
  processingGroup.add(plate);

  const riskCells = [];
  const riskValues = [];
  const riskCellGroup = new THREE.Group();
  const riskColumns = 26;
  const riskRows = 16;
  const riskCellWidth = plateWidth / riskColumns;
  const riskCellDepth = plateDepth / riskRows;
  const lowRiskColor = new THREE.Color(0x17324a);
  const midRiskColor = new THREE.Color(0xf4c65d);
  const highRiskColor = new THREE.Color(0xff5b35);
  for (let row = 0; row < riskRows; row += 1) {
    for (let column = 0; column < riskColumns; column += 1) {
      const cell = new THREE.Mesh(
        new THREE.PlaneGeometry(riskCellWidth * 0.86, riskCellDepth * 0.86),
        new THREE.MeshBasicMaterial({
          color: lowRiskColor,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
        }),
      );
      cell.rotation.x = -Math.PI / 2;
      cell.position.set(
        -plateWidth / 2 + riskCellWidth * (column + 0.5),
        0.018,
        -plateDepth / 2 + riskCellDepth * (row + 0.5),
      );
      riskCells.push(cell);
      riskValues.push(0);
      riskCellGroup.add(cell);
    }
  }
  processingGroup.add(riskCellGroup);

  const spiralPoints = [];
  const spiralTurns = 4.2;
  const spiralSteps = 360;
  for (let index = 0; index < spiralSteps; index += 1) {
    const ratio = index / (spiralSteps - 1);
    const angle = ratio * spiralTurns * Math.PI * 2;
    const radiusX = THREE.MathUtils.lerp(plateWidth * 0.43, plateWidth * 0.08, ratio);
    const radiusZ = THREE.MathUtils.lerp(plateDepth * 0.43, plateDepth * 0.08, ratio);
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radiusX, 0.045, Math.sin(angle) * radiusZ));
  }

  const pathLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spiralPoints),
    new THREE.LineBasicMaterial({ color: 0x7ee7ff, transparent: true, opacity: 0.72 }),
  );
  processingGroup.add(pathLine);

  const trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([spiralPoints[0], spiralPoints[0].clone()]),
    new THREE.LineBasicMaterial({ color: 0xffcf66, transparent: true, opacity: 0.96 }),
  );
  processingGroup.add(trailLine);

  const toolGroup = new THREE.Group();
  const toolHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.72, 36),
    new THREE.MeshPhysicalMaterial({
      color: 0xff9c5f,
      roughness: 0.3,
      metalness: 0.48,
      emissive: 0x431600,
      emissiveIntensity: 0.8,
    }),
  );
  toolHead.position.y = 0.41;
  const contactRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.012, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xffdf8f }),
  );
  contactRing.rotation.x = Math.PI / 2;
  contactRing.position.y = 0.06;
  const directionMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.26, 18),
    new THREE.MeshBasicMaterial({ color: 0x69f0c7 }),
  );
  directionMarker.position.y = 0.08;
  toolGroup.add(toolHead, contactRing, directionMarker);
  processingGroup.add(toolGroup);

  const spark = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0x89fff1 }),
  );
  processingGroup.add(spark);
  scene.add(processingGroup);

  const particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(360);
  for (let index = 0; index < particlePositions.length; index += 3) {
    particlePositions[index] = (Math.random() - 0.5) * 8;
    particlePositions[index + 1] = (Math.random() - 0.1) * 5;
    particlePositions[index + 2] = (Math.random() - 0.5) * 8;
  }
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );

  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: 0x7fdcff,
      size: 0.03,
      transparent: true,
      opacity: 0.72,
    }),
  );
  scene.add(particles);

  const clock = new THREE.Clock();
  let loadedModel;
  let processingProgress = 0;
  let processingSpeed = 1;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  function setStatus(message, options) {
    statusNode.textContent = message;
    notifyModelStatus?.(message, options);
  }

  function getActiveObject() {
    return loadedModel ?? processingGroup;
  }

  function resetRiskMap() {
    riskValues.fill(0);
    updateRiskCellColors();
    updateToolPose(0);
  }

  function updateRiskCellColors() {
    riskCells.forEach((cell, index) => {
      const value = THREE.MathUtils.clamp(riskValues[index], 0, 1);
      const color = value < 0.55
        ? lowRiskColor.clone().lerp(midRiskColor, value / 0.55)
        : midRiskColor.clone().lerp(highRiskColor, (value - 0.55) / 0.45);
      cell.material.color.copy(color);
      cell.material.opacity = 0.18 + value * 0.58;
    });
  }

  function updateToolPose(progress) {
    const exactIndex = progress * (spiralPoints.length - 1);
    const pointIndex = Math.min(Math.floor(exactIndex), spiralPoints.length - 2);
    const localMix = exactIndex - pointIndex;
    const point = spiralPoints[pointIndex].clone().lerp(spiralPoints[pointIndex + 1], localMix);
    const tangent = spiralPoints[pointIndex + 1].clone().sub(spiralPoints[pointIndex]).normalize();

    toolGroup.position.copy(point);
    spark.position.set(point.x, point.y + 0.03, point.z);
    directionMarker.position.set(tangent.x * 0.28, 0.08, tangent.z * 0.28);
    directionMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

    const trailPoints = spiralPoints.slice(0, pointIndex + 1);
    trailPoints.push(point);
    trailLine.geometry.dispose();
    trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);

    riskCells.forEach((cell, index) => {
      const distance = Math.hypot(cell.position.x - point.x, cell.position.z - point.z);
      if (distance < 0.34) {
        riskValues[index] = Math.min(1, riskValues[index] + (0.08 * (1 - distance / 0.34)));
      }
    });
    updateRiskCellColors();
  }

  function fitProcessingDemoToObject(object = null) {
    if (!object) {
      processingGroup.position.set(0, 0, 0);
      processingGroup.scale.setScalar(1);
      plate.visible = true;
      return;
    }

    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = Math.max(Math.min(size.x / plateWidth, size.z / plateDepth) * 0.82, 0.38);
    processingGroup.position.set(center.x, bounds.max.y + 0.04 * scale, center.z);
    processingGroup.scale.setScalar(scale);
    plate.visible = false;
  }

  function normalizeModel(object) {
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    object.position.sub(center);

    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    object.scale.setScalar(3 / maxSize);
  }

  function fitObjectToView(object, showStatus = true) {
    if (!object) {
      return;
    }

    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.6);
    const target = sphere.center.clone();

    const direction = camera.position.clone().sub(controls.target);
    if (direction.lengthSq() === 0) {
      direction.set(1, 0.8, 1.2);
    }
    direction.normalize();

    const fitHeightDistance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.35;

    controls.target.copy(target);
    camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
    controls.minDistance = Math.max(radius * 0.8, 1.8);
    controls.maxDistance = Math.max(distance * 4, 12);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = Math.max(distance * 20, 100);
    camera.updateProjectionMatrix();
    controls.update();

    rearGrid.position.x = target.x;
    rearGrid.position.y = target.y + radius * 0.15;
    rearGrid.position.z = target.z - Math.max(radius * 2.4, 4.8);
    rearGrid.scale.setScalar(Math.max(radius * 0.9, 1));
    floorGrid.position.y = Math.min(target.y - radius * 1.05, -0.45);

    if (showStatus && loadedModel) {
      setStatus(`当前显示：${loadedModel.userData.sourceName}（已自动居中）`);
    }
  }

  function fitActiveObjectToView(showStatus = true) {
    fitObjectToView(getActiveObject(), showStatus);
  }

  const resizeObserver = new ResizeObserver(() => {
    const width = sceneRoot.clientWidth || 800;
    const height = sceneRoot.clientHeight || 420;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    fitActiveObjectToView(false);
  });
  resizeObserver.observe(sceneRoot);

  function animate() {
    const delta = clock.getDelta();
    const nextProgress = processingProgress + delta * 0.055 * processingSpeed;
    if (nextProgress >= 1) {
      riskValues.fill(0);
    }
    processingProgress = nextProgress % 1;
    updateToolPose(processingProgress);
    particles.rotation.y -= 0.0015;
    glowRing.rotation.z += 0.0025;
    spark.scale.setScalar(1 + Math.sin(performance.now() * 0.004) * 0.18);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  fitProcessingDemoToObject();
  fitActiveObjectToView(false);
  animate();

  return {
    loadLocalModel(file) {
      const objectUrl = URL.createObjectURL(file);
      loader.load(
        objectUrl,
        (gltf) => {
          if (loadedModel) {
            scene.remove(loadedModel);
          }

          loadedModel = gltf.scene;
          loadedModel.userData.sourceName = file.name;
          loadedModel.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
            }
          });

          normalizeModel(loadedModel);
          scene.add(loadedModel);
          fitProcessingDemoToObject(loadedModel);
          resetRiskMap();
          fitActiveObjectToView();
          URL.revokeObjectURL(objectUrl);
        },
        undefined,
        (error) => {
          const message =
            error?.message ||
            error?.target?.statusText ||
            "当前模型未能完成解析，请检查压缩格式或导出设置。";
          setStatus(`模型载入失败：${file.name}（${message}）`, { persist: true });
          URL.revokeObjectURL(objectUrl);
        },
      );
    },
    fitActiveObjectToView,
    setProcessingSpeed(value) {
      processingSpeed = Number.isFinite(value) && value > 0 ? value : 1;
    },
    resetProcessingDemo() {
      processingProgress = 0;
      resetRiskMap();
      setStatus("加工演示已重置：螺旋轨迹回到外圈起点");
    },
  };
}
