import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  clearTemperatureValues,
  getSimulationGridBounds,
  mapSimulationSamplesToGrid,
  mergeVisibleTemperatureValues,
  revealTemperatureValuesNearPoint,
} from "./simulation.js";

export const DEFAULT_WORKPIECE_MODEL_URL = "/models/workpiece.glb";
export const DEFAULT_TOOL_MODEL_URL = "/models/tool.glb";

export const LOCAL_GRINDING_SCENE_CONFIG = {
  sceneUnitsPerMm: 0.03,
  modelUnits: {
    solidWorksMetersToSceneUnits: 30,
  },
  workpiece: {
    widthMm: 100,
    depthMm: 100,
    heightMm: 8,
  },
  tool: {
    referenceDiameterMm: 24,
  },
  temperatureGrid: {
    columns: 40,
    rows: 40,
    cellWidthMm: 2.5,
    cellDepthMm: 2.5,
  },
  markers: {
    showContactRing: false,
    directionArrowLengthMm: 6,
  },
};

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
  processingGroup.name = "local-grinding-temperature-demo";

  const sceneUnitsPerMm = LOCAL_GRINDING_SCENE_CONFIG.sceneUnitsPerMm;
  const solidWorksMetersToSceneUnits = LOCAL_GRINDING_SCENE_CONFIG.modelUnits.solidWorksMetersToSceneUnits;
  const plateWidth = LOCAL_GRINDING_SCENE_CONFIG.workpiece.widthMm * sceneUnitsPerMm;
  const plateDepth = LOCAL_GRINDING_SCENE_CONFIG.workpiece.depthMm * sceneUnitsPerMm;
  const plateHeight = LOCAL_GRINDING_SCENE_CONFIG.workpiece.heightMm * sceneUnitsPerMm;
  const toolReferenceDiameter = LOCAL_GRINDING_SCENE_CONFIG.tool.referenceDiameterMm * sceneUnitsPerMm;
  const toolReferenceRadius = toolReferenceDiameter / 2;
  const pathWidthMm = LOCAL_GRINDING_SCENE_CONFIG.workpiece.widthMm;
  const pathDepthMm = LOCAL_GRINDING_SCENE_CONFIG.workpiece.depthMm;
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

  const temperatureCells = [];
  const pathHeatValues = [];
  const targetTemperatureValues = [];
  const revealedTemperatureValues = [];
  const temperatureCellCenters = [];
  const temperatureCellGroup = new THREE.Group();
  const temperatureColumns = LOCAL_GRINDING_SCENE_CONFIG.temperatureGrid.columns;
  const temperatureRows = LOCAL_GRINDING_SCENE_CONFIG.temperatureGrid.rows;
  const temperatureCellWidth = plateWidth / temperatureColumns;
  const temperatureCellDepth = plateDepth / temperatureRows;
  const lowTemperatureColor = new THREE.Color(0x17324a);
  const midTemperatureColor = new THREE.Color(0xf4c65d);
  const highTemperatureColor = new THREE.Color(0xff5b35);

  for (let row = 0; row < temperatureRows; row += 1) {
    for (let column = 0; column < temperatureColumns; column += 1) {
      const cell = new THREE.Mesh(
        new THREE.PlaneGeometry(temperatureCellWidth * 0.86, temperatureCellDepth * 0.86),
        new THREE.MeshBasicMaterial({
          color: lowTemperatureColor,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
        }),
      );
      cell.rotation.x = -Math.PI / 2;
      cell.position.set(
        -plateWidth / 2 + temperatureCellWidth * (column + 0.5),
        0.018,
        -plateDepth / 2 + temperatureCellDepth * (row + 0.5),
      );
      temperatureCells.push(cell);
      temperatureCellCenters.push({ x: cell.position.x, z: cell.position.z });
      pathHeatValues.push(0);
      targetTemperatureValues.push(0);
      revealedTemperatureValues.push(0);
      temperatureCellGroup.add(cell);
    }
  }
  processingGroup.add(temperatureCellGroup);

  function pathPointToScene(point) {
    return new THREE.Vector3(
      (Number(point.x) / pathWidthMm) * plateWidth,
      0,
      (Number(point.z) / pathDepthMm) * plateDepth,
    );
  }

  function createDefaultLinePoints() {
    return [
      pathPointToScene({ x: -40, z: 0 }),
      pathPointToScene({ x: 40, z: 0 }),
    ];
  }

  let toolPathPoints = createDefaultLinePoints();

  const pathLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(toolPathPoints),
    new THREE.LineBasicMaterial({ color: 0x7ee7ff, transparent: true, opacity: 0.72 }),
  );
  processingGroup.add(pathLine);

  const trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([toolPathPoints[0], toolPathPoints[0].clone()]),
    new THREE.LineBasicMaterial({ color: 0xffcf66, transparent: true, opacity: 0.96 }),
  );
  processingGroup.add(trailLine);

  const toolGroup = new THREE.Group();
  const toolModelSlot = new THREE.Group();
  const fallbackToolHead = new THREE.Mesh(
    new THREE.CylinderGeometry(toolReferenceRadius, toolReferenceRadius, toolReferenceDiameter, 36),
    new THREE.MeshPhysicalMaterial({
      color: 0xff9c5f,
      roughness: 0.3,
      metalness: 0.48,
      emissive: 0x431600,
      emissiveIntensity: 0.8,
    }),
  );
  fallbackToolHead.position.y = toolReferenceRadius;
  toolModelSlot.add(fallbackToolHead);

  const directionMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, LOCAL_GRINDING_SCENE_CONFIG.markers.directionArrowLengthMm * sceneUnitsPerMm, 14),
    new THREE.MeshBasicMaterial({ color: 0x69f0c7 }),
  );
  directionMarker.position.y = 0.045;
  toolGroup.add(toolModelSlot, directionMarker);
  processingGroup.add(toolGroup);

  scene.add(processingGroup);

  const particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(360);
  for (let index = 0; index < particlePositions.length; index += 3) {
    particlePositions[index] = (Math.random() - 0.5) * 8;
    particlePositions[index + 1] = (Math.random() - 0.1) * 5;
    particlePositions[index + 2] = (Math.random() - 0.5) * 8;
  }
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

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

  function updateTemperatureCellColors() {
    const visibleValues = mergeVisibleTemperatureValues(pathHeatValues, revealedTemperatureValues);
    temperatureCells.forEach((cell, index) => {
      const value = THREE.MathUtils.clamp(visibleValues[index] ?? 0, 0, 1);
      const color = value < 0.55
        ? lowTemperatureColor.clone().lerp(midTemperatureColor, value / 0.55)
        : midTemperatureColor.clone().lerp(highTemperatureColor, (value - 0.55) / 0.45);
      cell.material.color.copy(color);
      cell.material.opacity = 0.18 + value * 0.58;
    });
  }

  function resetTemperatureMap() {
    clearTemperatureValues(pathHeatValues);
    clearTemperatureValues(revealedTemperatureValues);
    updateTemperatureCellColors();
    updateToolPose(0, { revealTemperature: false });
  }

  function updateToolPose(progress, { revealTemperature = true } = {}) {
    const exactIndex = progress * (toolPathPoints.length - 1);
    const pointIndex = Math.min(Math.floor(exactIndex), toolPathPoints.length - 2);
    const localMix = exactIndex - pointIndex;
    const point = toolPathPoints[pointIndex].clone().lerp(toolPathPoints[pointIndex + 1], localMix);
    const tangent = toolPathPoints[pointIndex + 1].clone().sub(toolPathPoints[pointIndex]).normalize();

    toolGroup.position.copy(point);
    directionMarker.position.set(tangent.x * 0.18, 0.045, tangent.z * 0.18);
    directionMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

    const trailPoints = toolPathPoints.slice(0, pointIndex + 1);
    trailPoints.push(point);
    trailLine.geometry.dispose();
    trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);

    if (revealTemperature) {
      temperatureCells.forEach((cell, index) => {
        const distance = Math.hypot(cell.position.x - point.x, cell.position.z - point.z);
        if (distance < toolReferenceRadius) {
          pathHeatValues[index] = Math.min(1, pathHeatValues[index] + (0.08 * (1 - distance / toolReferenceRadius)));
        }
      });
      revealTemperatureValuesNearPoint({
        targetTemperatureValues,
        revealedTemperatureValues,
        cellCenters: temperatureCellCenters,
        point,
        radius: toolReferenceRadius,
      });
    }
    updateTemperatureCellColors();
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

  function normalizeToolModel(object) {
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    object.position.sub(center);
    object.scale.setScalar(solidWorksMetersToSceneUnits);
    object.updateWorldMatrix(true, true);
    const normalizedBounds = new THREE.Box3().setFromObject(object);
    object.position.y -= normalizedBounds.min.y;
  }

  function applyToolPathPayload(pathPayload) {
    const points = Array.isArray(pathPayload?.points)
      ? pathPayload.points.map(pathPointToScene)
      : [];

    if (points.length < 2) {
      return false;
    }

    toolPathPoints = points;
    pathLine.geometry.dispose();
    pathLine.geometry = new THREE.BufferGeometry().setFromPoints(toolPathPoints);
    processingProgress = 0;
    resetTemperatureMap();
    return true;
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
      clearTemperatureValues(pathHeatValues);
      clearTemperatureValues(revealedTemperatureValues);
    }
    processingProgress = nextProgress % 1;
    updateToolPose(processingProgress);
    particles.rotation.y -= 0.0015;
    glowRing.rotation.z += 0.0025;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  fitProcessingDemoToObject();
  fitActiveObjectToView(false);
  animate();

  return {
    loadDefaultWorkpieceModel(url = DEFAULT_WORKPIECE_MODEL_URL) {
      loader.load(
        url,
        (gltf) => {
          if (loadedModel) {
            scene.remove(loadedModel);
          }
          loadedModel = gltf.scene;
          loadedModel.userData.sourceName = "固定工件模型：workpiece.glb";
          normalizeModel(loadedModel);
          scene.add(loadedModel);
          fitProcessingDemoToObject(loadedModel);
          resetTemperatureMap();
          fitActiveObjectToView(false);
          setStatus("已加载固定工件模型：workpiece.glb");
        },
        undefined,
        () => {
          fitProcessingDemoToObject();
          resetTemperatureMap();
          setStatus("未载入固定工件模型，当前使用简化平板回退");
        },
      );
    },
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
          resetTemperatureMap();
          fitActiveObjectToView();
          URL.revokeObjectURL(objectUrl);
        },
        undefined,
        (error) => {
          const message =
            error?.message ||
            error?.target?.statusText ||
            "当前模型未能完成解析，请检查压缩格式或导出设置。";
          setStatus(`模型载入失败：${file.name}，${message}`, { persist: true });
          URL.revokeObjectURL(objectUrl);
        },
      );
    },
    loadDefaultToolModel(url = DEFAULT_TOOL_MODEL_URL) {
      loader.load(
        url,
        (gltf) => {
          toolModelSlot.clear();
          const toolModel = gltf.scene;
          toolModel.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
            }
          });
          normalizeToolModel(toolModel);
          toolModelSlot.add(toolModel);
        },
        undefined,
        () => {
          toolModelSlot.clear();
          toolModelSlot.add(fallbackToolHead);
          setStatus("固定工具模型未能加载，当前使用圆柱占位工具。");
        },
      );
    },
    applyToolPath(pathPayload) {
      if (applyToolPathPayload(pathPayload)) {
        setStatus(`已加载打磨路径：${pathPayload?.id ?? "line_grinding_demo"}`);
      }
    },
    fitActiveObjectToView,
    setProcessingSpeed(value) {
      processingSpeed = Number.isFinite(value) && value > 0 ? value : 1;
    },
    applySimulationResult(result) {
      const samples = result?.samples ?? [];
      const valueKey = result?.valueKey ?? "temperature_c";
      const { width, depth } = getSimulationGridBounds(result, {
        width: plateWidth,
        depth: plateDepth,
      });
      const mappedValues = mapSimulationSamplesToGrid(samples, {
        columns: temperatureColumns,
        rows: temperatureRows,
        width,
        depth,
        valueKey,
        xKey: result?.xKey ?? "x",
        zKey: result?.zKey ?? "z",
      });
      mappedValues.forEach((value, index) => {
        targetTemperatureValues[index] = value;
      });
      clearTemperatureValues(revealedTemperatureValues);
      updateTemperatureCellColors();
      setStatus("已加载温度场目标结果：颜色将随工具运动逐步显色");
    },
    resetProcessingDemo() {
      processingProgress = 0;
      resetTemperatureMap();
      setStatus("局部打磨演示已重置：工具回到直线路径起点");
    },
  };
}
