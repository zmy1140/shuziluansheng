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

  const placeholderGroup = new THREE.Group();
  const pipe = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.25, 0.24, 180, 24, 2, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0x5ab2ff,
      roughness: 0.22,
      metalness: 0.78,
      clearcoat: 0.65,
      emissive: 0x092b48,
      emissiveIntensity: 1.2,
    }),
  );
  pipe.rotation.z = 0.45;

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.42, 1.4, 36),
    new THREE.MeshPhysicalMaterial({
      color: 0xff9c5f,
      roughness: 0.28,
      metalness: 0.55,
      emissive: 0x4a1d07,
      emissiveIntensity: 1.1,
    }),
  );
  head.position.set(1.75, 0.45, 0);
  head.rotation.z = Math.PI / 2.4;

  const spark = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x89fff1 }),
  );
  spark.position.set(1.1, 0.08, 0);

  placeholderGroup.add(pipe, head, spark);
  scene.add(placeholderGroup);

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

  let loadedModel;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  function setStatus(message, options) {
    statusNode.textContent = message;
    notifyModelStatus?.(message, options);
  }

  function getActiveObject() {
    return loadedModel ?? placeholderGroup;
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
    if (!loadedModel) {
      placeholderGroup.rotation.y += 0.003;
    }
    particles.rotation.y -= 0.0015;
    glowRing.rotation.z += 0.0025;
    spark.scale.setScalar(1 + Math.sin(performance.now() * 0.004) * 0.12);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

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

          placeholderGroup.visible = false;
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
  };
}
