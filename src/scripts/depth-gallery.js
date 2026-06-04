import * as THREE from "three";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const trailSide = new THREE.Vector3();
const trailTangent = new THREE.Vector3();
const trailCameraDirection = new THREE.Vector3();
const trailHead = new THREE.Vector3();

function getWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function makePlaneGeometry(texture, viewport) {
  const image = texture.image;
  const ratio = image && image.width && image.height ? image.width / image.height : 1;
  const base = viewport.width < 680 ? 3.2 : 4.15;
  const height = base / Math.max(ratio, 0.8);
  return new THREE.PlaneGeometry(base, height);
}

function textureFromImage(loader, image) {
  return new Promise((resolve, reject) => {
    loader.load(
      image.currentSrc || image.src,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function makeTrailPoint(progress, index, cameraZ, mobile) {
  const offset = progress - index * 0.028;
  const spread = mobile ? 0.56 : 1;

  return new THREE.Vector3(
    Math.sin(offset * Math.PI * 3.1) * 1.18 * spread + Math.sin(offset * Math.PI * 8) * 0.16 * spread,
    Math.cos(offset * Math.PI * 2.25) * 0.52 * spread + Math.sin(offset * Math.PI * 5.5) * 0.1,
    cameraZ - 3.15 - index * 0.48,
  );
}

function createTrail(scene) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0xe0753f,
    transparent: true,
    opacity: 0.64,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;

  const sparkleGeometry = new THREE.BufferGeometry();
  const sparkleMaterial = new THREE.PointsMaterial({
    color: 0xe5e1d6,
    transparent: true,
    opacity: 0.72,
    size: 0.07,
    sizeAttenuation: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
  sparkles.frustumCulled = false;
  sparkles.renderOrder = 5;

  scene.add(mesh, sparkles);

  return { geometry, material, mesh, sparkleGeometry, sparkleMaterial, sparkles };
}

export default function initDepthGallery() {
  const sections = document.querySelectorAll("[data-depth-intro]");
  if (!sections.length) return;

  sections.forEach((section) => {
    if (section.dataset.depthReady) return;
    section.dataset.depthReady = "true";

    const canvas = section.querySelector("[data-depth-canvas]");
    const fallback = section.querySelector("[data-depth-fallback]");
    const images = Array.from(fallback?.querySelectorAll("img") || []);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canvas || images.length === 0 || reducedMotion || !getWebGLSupport()) {
      section.classList.add("is-static");
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
	    const state = {
	      viewport: { width: window.innerWidth, height: window.innerHeight },
	      progress: 0,
	      eased: 0,
	      previous: 0,
	      raf: 0,
	      disposed: false,
	      planes: [],
	      trail: createTrail(scene),
	      patterns: [
        [-1.9, 0.65, -0.07],
        [1.65, -0.3, 0.08],
        [-0.15, 0.15, -0.035],
        [1.95, 0.75, 0.06],
        [-1.7, -0.65, -0.08],
        [0.35, -0.2, 0.035],
        [-2.05, 0.2, 0.07],
        [1.4, -0.72, -0.055],
      ],
    };

    function resize() {
      state.viewport.width = window.innerWidth;
      state.viewport.height = window.innerHeight;
      camera.aspect = state.viewport.width / state.viewport.height;
      camera.updateProjectionMatrix();
      renderer.setSize(state.viewport.width, state.viewport.height, false);
    }

	    function updateProgress() {
	      const rect = section.getBoundingClientRect();
	      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
	      state.progress = clamp(-rect.top / scrollable);
	    }

	    function updateTrail(velocity) {
	      const mobile = state.viewport.width < 680;
	      const controlPoints = Array.from({ length: 13 }, (_, index) =>
	        makeTrailPoint(state.eased, index, camera.position.z, mobile),
	      );
	      const curve = new THREE.CatmullRomCurve3(controlPoints);
	      const samples = curve.getPoints(mobile ? 34 : 48);
	      const positions = [];
	      const indices = [];

	      camera.getWorldDirection(trailCameraDirection);

	      samples.forEach((point, index) => {
	        const next = samples[Math.min(index + 1, samples.length - 1)];
	        const previous = samples[Math.max(index - 1, 0)];
	        const t = index / Math.max(samples.length - 1, 1);
        const width = (mobile ? 0.12 : 0.18) * Math.pow(1 - t, 1.65) + 0.018;
	        const pulse = 1 + clamp(Math.abs(velocity) * 52, 0, 0.75);

	        trailTangent.subVectors(next, previous).normalize();
	        trailSide.crossVectors(trailTangent, trailCameraDirection).normalize().multiplyScalar(width * pulse);

	        positions.push(
	          point.x - trailSide.x,
	          point.y - trailSide.y,
	          point.z - trailSide.z,
	          point.x + trailSide.x,
	          point.y + trailSide.y,
	          point.z + trailSide.z,
	        );

	        if (index < samples.length - 1) {
	          const base = index * 2;
	          indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
	        }
	      });

	      state.trail.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	      state.trail.geometry.setIndex(indices);
	      state.trail.geometry.computeBoundingSphere();
      state.trail.material.opacity = mobile ? 0.48 : 0.64;

	      trailHead.copy(samples[0] || controlPoints[0]);
	      const sparklePositions = [];
	      for (let index = 0; index < 9; index += 1) {
	        const phase = state.eased * Math.PI * 16 + index * 1.7;
	        const scale = mobile ? 0.28 : 0.42;
	        sparklePositions.push(
	          trailHead.x + Math.sin(phase) * scale * (0.3 + index * 0.03),
	          trailHead.y + Math.cos(phase * 1.3) * scale * (0.24 + index * 0.025),
	          trailHead.z + Math.sin(phase * 0.7) * 0.22 - index * 0.035,
	        );
	      }

	      state.trail.sparkleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparklePositions, 3));
	      state.trail.sparkleGeometry.computeBoundingSphere();
	      state.trail.sparkleMaterial.opacity = clamp(0.42 + Math.abs(velocity) * 18, 0.42, 0.86);
	    }

	    function render() {
      if (state.disposed) return;

      updateProgress();
      state.eased += (state.progress - state.eased) * 0.08;
      const velocity = state.eased - state.previous;
      state.previous = state.eased;

      const finalDepth = Math.max((state.planes.length - 1) * 2.65, 1);
      camera.position.z = 5.5 - state.eased * (finalDepth + 6.2);
      camera.position.x = Math.sin(state.eased * Math.PI * 1.7) * 0.38 + velocity * 18;
      camera.position.y = Math.cos(state.eased * Math.PI * 1.15) * 0.12 - state.eased * 0.16;
      camera.lookAt(camera.position.x * 0.1, camera.position.y * 0.1, camera.position.z - 5.6);

	      group.rotation.z = velocity * 2.8;
	      group.rotation.y = velocity * 3.6;
	      updateTrail(velocity);

      state.planes.forEach((plane, index) => {
        const distance = Math.abs(plane.position.z - (camera.position.z - 4.35));
        const focus = clamp(1 - distance / 5.5);
        const drift = Math.sin(state.eased * Math.PI * 2 + index) * 0.05;

        plane.material.opacity = lerp(0.16, 1, focus);
        plane.position.x = plane.userData.baseX + velocity * plane.userData.velocityPush + drift;
        plane.position.y = plane.userData.baseY - state.eased * 0.3 + drift * 0.35;
        plane.rotation.z = plane.userData.baseRotation + velocity * 4;
      });

      section.style.setProperty("--depth-progress", state.eased.toFixed(3));
      renderer.render(scene, camera);
      state.raf = window.requestAnimationFrame(render);
    }

    async function boot() {
      resize();
      const textures = await Promise.all(images.map((image) => textureFromImage(loader, image)));

      textures.forEach((texture, index) => {
        const geometry = makePlaneGeometry(texture, state.viewport);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          toneMapped: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const pattern = state.patterns[index % state.patterns.length];
        const mobile = state.viewport.width < 680;

        mesh.position.set(mobile ? pattern[0] * 0.45 : pattern[0], mobile ? pattern[1] * 0.72 : pattern[1], -index * 2.65);
        mesh.rotation.z = mobile ? pattern[2] * 0.5 : pattern[2];
        mesh.userData.baseX = mesh.position.x;
        mesh.userData.baseY = mesh.position.y;
        mesh.userData.baseRotation = mesh.rotation.z;
        mesh.userData.velocityPush = mobile ? 5 : 12;

        group.add(mesh);
        state.planes.push(mesh);
      });

      section.classList.add("is-webgl-ready");
      render();
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    boot().catch(() => {
      section.classList.add("is-static");
    });
  });
}
