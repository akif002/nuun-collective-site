let THREE;

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
  const base = viewport.width < 680 ? 3.2 : 4.15;
  const height = base / ratio;
  return new THREE.PlaneGeometry(base, height);
}

function textureFromImage(loader, image) {
  return new Promise((resolve, reject) => {
    loader.load(
      window.innerWidth < 680 ? image.dataset.mobileSrc : (image.dataset.src || image.currentSrc || image.src),
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 2;
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

  sections.forEach(async (section) => {
    if (section.dataset.depthReady) return;
    section.dataset.depthReady = "true";

    const canvas = section.querySelector("[data-depth-canvas]");
    const fallback = section.querySelector("[data-depth-fallback]");
    const images = Array.from(fallback?.querySelectorAll("img") || []);
    const showStatic = () => {
      images.forEach((image) => {
        image.src = window.innerWidth < 680 ? image.dataset.mobileSrc : image.dataset.src;
      });
      section.classList.remove("is-animated", "is-webgl-ready");
      section.classList.add("is-static");
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canvas || images.length === 0 || reducedMotion || !getWebGLSupport()) {
      showStatic();
      return;
    }

    // Let the first optimized photo paint before loading the 3D renderer.
    let renderer;
    try {
      await images[0].decode();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      THREE = await import("three");
      renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.innerWidth >= 680,
      alpha: true,
      powerPreference: "high-performance",
    });
    } catch {
      showStatic();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 680 ? 1 : 1.25));

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
      inViewport: false,
      ready: false,
      planes: [],
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
      state.viewport.height = section.querySelector('.depth-stage').clientHeight;
      camera.aspect = state.viewport.width / state.viewport.height;
      camera.updateProjectionMatrix();
      renderer.setSize(state.viewport.width, state.viewport.height, false);
    }

    function updateProgress() {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - state.viewport.height, 1);
      state.progress = clamp(-rect.top / scrollable);
    }

    function scheduleRender() {
      if (state.disposed || !state.ready || !state.inViewport || document.hidden || state.raf) return;
      state.raf = window.requestAnimationFrame(render);
    }

    function render() {
      state.raf = 0;
      if (state.disposed || !state.inViewport || document.hidden) return;

      updateProgress();
      state.eased += (state.progress - state.eased) * 0.08;
      const velocity = state.eased - state.previous;
      state.previous = state.eased;

      const finalDepth = Math.max((images.length - 1) * 2.65, 1);
      camera.position.z = 5.5 - state.eased * (finalDepth + 6.2);
      camera.position.x = Math.sin(state.eased * Math.PI * 1.7) * 0.38 + velocity * 18;
      camera.position.y = Math.cos(state.eased * Math.PI * 1.15) * 0.12 - state.eased * 0.16;
      camera.lookAt(camera.position.x * 0.1, camera.position.y * 0.1, camera.position.z - 5.6);

      group.rotation.z = velocity * 2.8;
      group.rotation.y = velocity * 3.6;

      state.planes.forEach((plane) => {
        const distance = Math.abs(plane.position.z - (camera.position.z - 4.35));
        const focus = clamp(1 - distance / 5.5);
        plane.visible = distance < 12;
        const drift = Math.sin(state.eased * Math.PI * 2 + plane.userData.photoIndex) * 0.05;

        plane.material.opacity = lerp(0.16, 1, focus);
        plane.position.x = plane.userData.baseX + velocity * plane.userData.velocityPush + drift;
        plane.position.y = plane.userData.baseY - state.eased * 0.3 + drift * 0.35;
        plane.rotation.z = plane.userData.baseRotation + velocity * 4;
      });

      section.style.setProperty("--depth-progress", state.eased.toFixed(3));
      renderer.render(scene, camera);
      if (Math.abs(state.progress - state.eased) > 0.0005 || Math.abs(velocity) > 0.00005) scheduleRender();
    }

    async function boot() {
      resize();
      async function addPhoto(image, index) {
        const texture = await textureFromImage(loader, image);
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
        mesh.userData.photoIndex = index;
        mesh.userData.baseY = mesh.position.y;
        mesh.userData.baseRotation = mesh.rotation.z;
        mesh.userData.velocityPush = mobile ? 5 : 12;

        group.add(mesh);
        state.planes.push(mesh);
      }

      await Promise.all(images.slice(0, 3).map(addPhoto));

      section.classList.add("is-webgl-ready");
      state.ready = true;
      scheduleRender();
      // Decode remaining photos progressively instead of blocking the opening frame.
      for (let index = 3; index < images.length && !state.disposed; index++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        try {
          await addPhoto(images[index], index);
          scheduleRender();
        } catch { /* Keep the gallery usable if an individual photo fails. */ }
      }
    }

    const onResize = () => {
      // Mobile Safari emits resize events as its address bar expands and collapses.
      if (window.innerWidth < 680 && state.viewport.width === window.innerWidth) return;
      resize(); scheduleRender();
    };
    window.addEventListener("resize", onResize, { passive: true });

    window.addEventListener("scroll", scheduleRender, { passive: true });
    document.addEventListener("visibilitychange", scheduleRender);
    const observer = new IntersectionObserver(([entry]) => {
      state.inViewport = entry.isIntersecting;
      scheduleRender();
    });
    observer.observe(section);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      state.disposed = true;
      window.cancelAnimationFrame(state.raf);
      observer.disconnect();
      showStatic();
    });
    boot().catch(() => {
      state.disposed = true;
      observer.disconnect();
      renderer.dispose();
      showStatic();
    });
  });
}
