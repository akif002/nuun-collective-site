import * as THREE from "three";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;

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
  const base = viewport.width < 680 ? 2.3 : 3.85;
  const height = base / ratio;
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
      patterns: [
        [-0.72, 0.35, -0.035],
        [0.66, -0.22, 0.045],
        [-0.16, 0.12, -0.025],
        [0.78, 0.48, 0.035],
        [-0.65, -0.4, -0.045],
        [0.22, -0.12, 0.025],
        [-0.82, 0.18, 0.04],
        [0.58, -0.46, -0.035],
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

    function render() {
      if (state.disposed) return;

      updateProgress();
      state.eased += (state.progress - state.eased) * 0.08;
      const velocity = state.eased - state.previous;
      state.previous = state.eased;
      const mobile = state.viewport.width < 680;

      const finalDepth = Math.max((state.planes.length - 1) * 2.65, 1);
      camera.position.z = 5.5 - state.eased * (finalDepth + 6.2);
      camera.position.x = Math.sin(state.eased * Math.PI * 1.7) * (mobile ? 0.1 : 0.22) + velocity * (mobile ? 3 : 8);
      camera.position.y = Math.cos(state.eased * Math.PI * 1.15) * (mobile ? 0.06 : 0.1) - state.eased * 0.12;
      camera.lookAt(camera.position.x * 0.1, camera.position.y * 0.1, camera.position.z - 5.6);

      group.rotation.z = velocity * 2.8;
      group.rotation.y = velocity * 3.6;

      state.planes.forEach((plane, index) => {
        const distance = Math.abs(plane.position.z - (camera.position.z - 4.35));
        const focus = clamp(1 - distance / 5.5);
        const drift = Math.sin(state.eased * Math.PI * 2 + index) * 0.05;

        plane.material.opacity = lerp(0.16, 1, focus);
        plane.position.x = plane.userData.baseX + velocity * plane.userData.velocityPush + drift * (mobile ? 0.45 : 1);
        plane.position.y = plane.userData.baseY - state.eased * (mobile ? 0.16 : 0.24) + drift * 0.35;
        plane.rotation.z = plane.userData.baseRotation + velocity * (mobile ? 2 : 3);
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

        mesh.position.set(mobile ? pattern[0] * 0.62 : pattern[0], mobile ? pattern[1] * 0.72 : pattern[1], -index * 2.65);
        mesh.rotation.z = mobile ? pattern[2] * 0.5 : pattern[2];
        mesh.userData.baseX = mesh.position.x;
        mesh.userData.baseY = mesh.position.y;
        mesh.userData.baseRotation = mesh.rotation.z;
        mesh.userData.velocityPush = mobile ? 1.5 : 6;

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
