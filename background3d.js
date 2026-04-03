(function() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 4;
    // move the camera slightly as if handheld, to give a more dynamic angle   

camera.position.y = -0.5;
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;  // was ACESFilmic
renderer.toneMappingExposure = 0.5;
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    renderer.domElement.id = 'bg-canvas';
    document.body.appendChild(renderer.domElement);

    // --- SHARED VARIABLES ---
    // These need to be accessible by both the HDRI loader
    // and the model loader, which load at the same time
    let envMap = null;
    let model = null;

let bloomEnabled = true; 
let nOriginalMaterial = null;  // store the glowing material
// Glass material — transparent, refractive, shiny
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.00,
    roughness: 0.00,
    transmission: 1.0,      // makes it see-through (1 = fully transparent)
    thickness: 0.5,         // how thick the glass looks (affects refraction)
    ior: 1.5,               // index of refraction (glass is ~1.5)
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide  // render both sides so you can see through it
});    



// --- LAYERS ---
    const BLOOM_LAYER = 1;
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_LAYER);

    // --- BLOOM SETUP ---
    const renderPass = new THREE.RenderPass(scene, camera);

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,    // strength — was 0.5, lower to keep color
    1.0,    // radius — higher for softer spread
    0.01  
    );

    const bloomComposer = new THREE.EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderPass);
    bloomComposer.addPass(bloomPass);

    // --- MOUSE TRACKING FOR TILT ---
    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        bloomEnabled = !bloomEnabled;
        console.log('Bloom:', bloomEnabled ? 'ON' : 'OFF');
        if (model) {
            model.traverse(function(child) {
                if (child.isMesh && child.name.toLowerCase().includes('n')) {
                    if (bloomEnabled) {
                        // Switch back to glowing material
                        child.material = nOriginalMaterial;
                        child.layers.enable(BLOOM_LAYER);
                    } else {
                        // Switch to glass
                        glassMaterial.envMap = envMap;
                        glassMaterial.envMapIntensity = 1.5;
                        glassMaterial.needsUpdate = true;
                        child.material = glassMaterial;
                        child.layers.disable(BLOOM_LAYER);
                    }
                }
            });
        }
    }
});
    // --- FINAL COMPOSER (bloom + normal combined) ---
    const finalPass = new THREE.ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    vec4 base = texture2D(baseTexture, vUv);
                    vec4 bloom = texture2D(bloomTexture, vUv);
                    gl_FragColor = 1.0 - (1.0 - base) * (1.0 - bloom);
                }
            `,
            defines: {}
        }),
        'baseTexture'
    );
    finalPass.needsSwap = true;

    const finalComposer = new THREE.EffectComposer(renderer);
    finalComposer.addPass(renderPass);
    finalComposer.addPass(finalPass);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

 //   const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  //  directionalLight.position.set(0, 0, 5);
   // scene.add(directionalLight);

    // --- MATERIALS ---
    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const materialStore = {};

    function hideMesh(obj) {
        if (obj.isMesh && !bloomLayer.test(obj.layers)) {
            materialStore[obj.uuid] = obj.material;
            obj.material = darkMaterial;
        }
    }

    function restoreMesh(obj) {
        if (materialStore[obj.uuid]) {
            obj.material = materialStore[obj.uuid];
            delete materialStore[obj.uuid];
        }
    }

    // --- HELPER: Apply envMap to the "M" ---
    // Called whenever the envMap OR the model finishes loading
    function applyEnvMap() {
        if (!envMap || !model) return;  // wait until both are ready

        model.traverse(function(child) {
            if (child.isMesh && child.name.toLowerCase().includes('m')) {
                child.material.envMap = envMap;
                child.material.envMapIntensity = 1.5;
                child.material.needsUpdate = true;
                console.log('Applied envMap to M');
            }
        });
    }

    // --- ENVIRONMENT MAP ---
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.load('monochrome_studio_02_1k.hdr', function(texture) {
        envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
        console.log('HDRI loaded');

        // Try applying — if model is already loaded, this works now
        applyEnvMap();
    });

    // --- LOAD THE MODEL ---
    const loader = new THREE.GLTFLoader();

    loader.load('logo2.glb', function(gltf) {
        model = gltf.scene;

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.scale.set(1, 1, 1);

        // Set up each mesh
        model.traverse(function(child) {
            if (child.isMesh) {
                console.log('Found mesh:', child.name);

if (child.name.toLowerCase().includes('n')) {
    child.layers.enable(BLOOM_LAYER);
    if (child.material.emissive) {
        child.material.emissive = new THREE.Color(0x33ff55);
        child.material.emissiveIntensity = 2;
    }
    nOriginalMaterial = child.material;  // save it
}
            }
        });

        scene.add(model);
        console.log('Model loaded');

        // Try applying — if HDRI is already loaded, this works now
        applyEnvMap();
    });

    // --- ANIMATION LOOP ---
  
    function animate() {
        requestAnimationFrame(animate);
    const t = performance.now();
    camera.position.x = Math.sin(t / 2000) * 0.05 + Math.cos(t / 3500) * 0.02;
    camera.position.y = Math.cos(t / 1800) * 0.05 + Math.sin(t / 2800) * 0.02-0.45;

        if (model) {
            const targetRotX = mouseY * 0.3 + Math.PI / 2;
            const targetRotZ = mouseX * -0.3;

            model.rotation.x += (targetRotX - model.rotation.x) * 0.05;
            model.rotation.z += (targetRotZ - model.rotation.z) * 0.05;
        }

        if (bloomEnabled) {
            scene.traverse(hideMesh);
            bloomComposer.render();
            scene.traverse(restoreMesh);
            finalComposer.render();
        } else {
            renderer.render(scene, camera);
        }
        window.addEventListener('scroll', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const fadeDistance = 500;
    const opacity = Math.max(0, 1 - window.scrollY / fadeDistance);
   // canvas.style.opacity = opacity;
model.position.y = (window.scrollY * 0.0025)-0.45; // move model down slightly as you scroll
});

    }
    animate();

    // --- HANDLE WINDOW RESIZE ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        bloomComposer.setSize(window.innerWidth, window.innerHeight);
        finalComposer.setSize(window.innerWidth, window.innerHeight);
    });

// --- SCROLL FADE FOR 3D BACKGROUND ---
// Fades the logo out as you scroll down, fades back in at the top


})();