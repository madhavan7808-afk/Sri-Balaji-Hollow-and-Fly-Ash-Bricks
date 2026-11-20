/**
 * Sri Balaji Hollow and Fly Ash Bricks
 * High-End 3D Architectural WebGL Experience, Reactive Physics & Dual Theme Engine
 */

(function () {
    'use strict';

    /* ==========================================================================
       1. Theme Switcher Engine (Dark & Light Theme)
       ========================================================================== */
    const getStoredTheme = () => {
        return localStorage.getItem('sri_balaji_theme') || 'dark';
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sri_balaji_theme', theme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    const initTheme = () => {
        const currentTheme = getStoredTheme();
        applyTheme(currentTheme);

        const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const active = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = active === 'dark' ? 'light' : 'dark';
                applyTheme(next);
            });
        });
    };

    /* ==========================================================================
       2. Global Interactive 3D Particle Canvas Engine (#bgParticlesCanvas)
          - Full viewport hardware-accelerated canvas
          - 3D depth simulation (x, y, z layers)
          - Cursor repulsion & proximity web lines on PC
          - Touch drag & repulsion on mobile / tablet
          - Expanding shockwave ripple on click / tap
          - Adaptive color palette responding instantly to Dark / Light theme
       ========================================================================== */
    const initGlobalParticles = () => {
        const canvas = document.getElementById('bgParticlesCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let particles = [];
        let shockwaves = [];
        let animationFrameId = null;

        // Interaction state
        const pointer = {
            x: -9999,
            y: -9999,
            active: false,
            radius: 150,
            force: 6
        };

        const getColors = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            if (isLight) {
                return {
                    particles: [
                        { r: 200, g: 75, b: 44, weight: 0.45 },   // terracotta
                        { r: 2, g: 132, b: 199, weight: 0.35 },   // sapphire blue
                        { r: 100, g: 116, b: 139, weight: 0.20 }  // slate
                    ],
                    lineColor: 'rgba(15, 23, 42, ',
                    shockwaveColor: 'rgba(200, 75, 44, '
                };
            }
            return {
                particles: [
                    { r: 255, g: 87, b: 34, weight: 0.5 },    // vibrant terracotta
                    { r: 56, g: 189, b: 248, weight: 0.35 },  // electric cyan
                    { r: 148, g: 163, b: 184, weight: 0.15 }  // silver slate
                ],
                lineColor: 'rgba(56, 189, 248, ',
                shockwaveColor: 'rgba(255, 87, 34, '
            };
        };

        let currentPalette = getColors();

        window.addEventListener('themeChanged', () => {
            currentPalette = getColors();
            // Re-assign particle colors smoothly
            particles.forEach(p => {
                const choice = selectWeightedColor(currentPalette.particles);
                p.rgb = choice;
            });
        });

        const selectWeightedColor = (list) => {
            const r = Math.random();
            let acc = 0;
            for (let i = 0; i < list.length; i++) {
                acc += list[i].weight;
                if (r <= acc) return list[i];
            }
            return list[0];
        };

        class Particle3D {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = Math.random() * width;
                this.y = initial ? Math.random() * height : (Math.random() < 0.5 ? -10 : height + 10);
                // 3D depth layer: 0.3 (far) to 1.6 (near)
                this.z = 0.3 + Math.random() * 1.3;
                this.radius = (1.2 + Math.random() * 2.2) * this.z;
                
                // Drift velocity scaled by depth
                const speed = (0.2 + Math.random() * 0.45) * this.z;
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;

                // Physics displacement
                this.dx = 0;
                this.dy = 0;

                this.rgb = selectWeightedColor(currentPalette.particles);
                this.baseAlpha = (0.25 + Math.random() * 0.45) * (this.z / 1.6);
                this.pulseSpeed = 0.01 + Math.random() * 0.02;
                this.pulseOffset = Math.random() * Math.PI * 2;
            }

            update(time) {
                // Return displacement back to 0 with spring physics
                this.dx *= 0.92;
                this.dy *= 0.92;

                // Cursor / Touch repulsion
                if (pointer.active) {
                    const diffX = (this.x + this.dx) - pointer.x;
                    const diffY = (this.y + this.dy) - pointer.y;
                    const dist = Math.hypot(diffX, diffY);
                    const effectiveRadius = pointer.radius * this.z;

                    if (dist < effectiveRadius && dist > 0) {
                        const force = (1 - dist / effectiveRadius) * pointer.force * this.z;
                        const angle = Math.atan2(diffY, diffX);
                        this.dx += Math.cos(angle) * force * 5;
                        this.dy += Math.sin(angle) * force * 5;
                    }
                }

                // Shockwave reaction
                for (let i = 0; i < shockwaves.length; i++) {
                    const sw = shockwaves[i];
                    const diffX = (this.x + this.dx) - sw.x;
                    const diffY = (this.y + this.dy) - sw.y;
                    const dist = Math.hypot(diffX, diffY);
                    const ringDist = Math.abs(dist - sw.radius);

                    if (ringDist < 25 && dist > 0) {
                        const swForce = (1 - ringDist / 25) * sw.strength * this.z;
                        const angle = Math.atan2(diffY, diffX);
                        this.dx += Math.cos(angle) * swForce * 6;
                        this.dy += Math.sin(angle) * swForce * 6;
                    }
                }

                // Apply velocity & bounds wrap
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < -20) this.x = width + 20;
                if (this.x > width + 20) this.x = -20;
                if (this.y < -20) this.y = height + 20;
                if (this.y > height + 20) this.y = -20;

                this.currentAlpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;
                if (this.currentAlpha < 0.05) this.currentAlpha = 0.05;
            }

            draw() {
                const drawX = this.x + this.dx;
                const drawY = this.y + this.dy;

                ctx.beginPath();
                ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.currentAlpha})`;
                ctx.fill();

                // Near particles get soft luminous outer aura
                if (this.z > 1.2) {
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, this.radius * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.currentAlpha * 0.18})`;
                    ctx.fill();
                }
            }
        }

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(dpr, dpr);

            // Responsive particle count (fewer on mobile for 60fps)
            const targetCount = width < 768 ? 45 : (width < 1200 ? 75 : 110);
            particles = [];
            for (let i = 0; i < targetCount; i++) {
                particles.push(new Particle3D());
            }
        };

        // Pointer event listeners (Desktop Mouse & Mobile Touch)
        window.addEventListener('mousemove', (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.active = true;
            pointer.radius = 140;
            pointer.force = 6;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            pointer.active = false;
        });

        // Mobile touch responsiveness
        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                const t = e.touches[0];
                pointer.x = t.clientX;
                pointer.y = t.clientY;
                pointer.active = true;
                pointer.radius = 170;
                pointer.force = 8;
                spawnShockwave(t.clientX, t.clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                const t = e.touches[0];
                pointer.x = t.clientX;
                pointer.y = t.clientY;
                pointer.active = true;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            // Smoothly clear touch influence after short delay
            setTimeout(() => { pointer.active = false; }, 250);
        });

        // Shockwave ripple on click / tap
        const spawnShockwave = (x, y) => {
            shockwaves.push({
                x,
                y,
                radius: 0,
                maxRadius: Math.min(width, 240),
                speed: 7,
                alpha: 0.7,
                strength: 7
            });
            if (shockwaves.length > 6) shockwaves.shift();
        };

        window.addEventListener('click', (e) => {
            // Trigger shockwave unless clicking interactive form control
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
                spawnShockwave(e.clientX, e.clientY);
            }
        });

        let lastTime = 0;
        const animate = (timestamp) => {
            ctx.clearRect(0, 0, width, height);

            // Update & draw shockwaves
            for (let i = shockwaves.length - 1; i >= 0; i--) {
                const sw = shockwaves[i];
                sw.radius += sw.speed;
                sw.alpha *= 0.94;

                if (sw.radius > sw.maxRadius || sw.alpha < 0.02) {
                    shockwaves.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `${currentPalette.shockwaveColor}${sw.alpha * 0.4})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Update & draw particles
            const pLen = particles.length;
            for (let i = 0; i < pLen; i++) {
                particles[i].update(timestamp);
                particles[i].draw();
            }

            // Draw architectural connecting lines between neighboring particles
            const maxLineDist = width < 768 ? 75 : 100;
            ctx.lineWidth = 0.8;

            for (let i = 0; i < pLen; i++) {
                const p1 = particles[i];
                const x1 = p1.x + p1.dx;
                const y1 = p1.y + p1.dy;

                for (let j = i + 1; j < pLen; j++) {
                    const p2 = particles[j];
                    const x2 = p2.x + p2.dx;
                    const y2 = p2.y + p2.dy;

                    const dx = x1 - x2;
                    const dy = y1 - y2;
                    const dist = Math.hypot(dx, dy);

                    if (dist < maxLineDist) {
                        const lineAlpha = (1 - dist / maxLineDist) * 0.16 * ((p1.z + p2.z) / 2);
                        ctx.strokeStyle = `${currentPalette.lineColor}${lineAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                }

                // Connect particles near cursor to cursor point
                if (pointer.active) {
                    const dx = x1 - pointer.x;
                    const dy = y1 - pointer.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 110) {
                        const alpha = (1 - dist / 110) * 0.22 * p1.z;
                        ctx.strokeStyle = `${currentPalette.shockwaveColor}${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(pointer.x, pointer.y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animationFrameId = requestAnimationFrame(animate);
    };

    /* ==========================================================================
       3. Interactive 3D WebGL Three.js Hero Scene (Canvas #hero3dCanvas)
       ========================================================================== */
    const initHero3D = () => {
        const canvas = document.getElementById('hero3dCanvas');
        if (!canvas || typeof THREE === 'undefined') return;

        const container = canvas.parentElement;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 650;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 18);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // Materials
        const terracottaMat = new THREE.MeshStandardMaterial({
            color: 0xc84b2c,
            roughness: 0.45,
            metalness: 0.15,
            emissive: 0x2a0d05,
            emissiveIntensity: 0.2
        });

        const solidBlockMat = new THREE.MeshStandardMaterial({
            color: 0x223247,
            roughness: 0.5,
            metalness: 0.25,
            emissive: 0x091422,
            emissiveIntensity: 0.2
        });

        const flyAshMat = new THREE.MeshStandardMaterial({
            color: 0x3a4f66,
            roughness: 0.6,
            metalness: 0.1,
            emissive: 0x0a1624,
            emissiveIntensity: 0.2
        });

        const wireframeMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.25
        });

        const interactiveBlocks = [];

        // Helper: Create a Chamfered 3D Brick Mesh
        const createBrick = (w, h, d, mat, pos, rot) => {
            const geom = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geom, mat.clone());
            mesh.position.set(pos[0], pos[1], pos[2]);
            mesh.rotation.set(rot[0], rot[1], rot[2]);
            mesh.userData = {
                originPos: new THREE.Vector3(pos[0], pos[1], pos[2]),
                originRot: new THREE.Vector3(rot[0], rot[1], rot[2]),
                speed: 0.001 + Math.random() * 0.002,
                floatOffset: Math.random() * Math.PI * 2
            };

            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, wireframeMat);
            mesh.add(line);

            mainGroup.add(mesh);
            interactiveBlocks.push(mesh);
            return mesh;
        };

        const isMobile = width < 768;
        const isInnerPage = height < 500;
        camera.position.set(0, 0, isMobile ? 22 : (isInnerPage ? 14 : 18));

        // Construct 3D Architectural Foundation Assembly
        if (isInnerPage) {
            if (isMobile) {
                // On mobile inner pages, position blocks gracefully in the background so text in center stays completely legible
                createBrick(2.8, 1.4, 1.5, terracottaMat, [-3.2, 2.0, -3.5], [0.2, 0.4, -0.1]);
                createBrick(2.5, 1.2, 1.3, solidBlockMat, [3.2, -1.8, -3.5], [-0.1, 0.5, 0.15]);
            } else {
                // On desktop / PC, flanking architectural blocks on the left and right
                createBrick(3.4, 1.6, 1.8, terracottaMat, [-6.2, 0.5, -1], [0.2, 0.4, -0.1]);
                createBrick(3.0, 1.5, 1.6, solidBlockMat, [-4.8, -1.2, 1], [-0.1, 0.5, 0.15]);
                createBrick(3.6, 1.8, 1.8, flyAshMat, [6.0, -0.3, -1], [-0.2, -0.3, 0.1]);
                createBrick(2.8, 1.4, 1.5, terracottaMat, [4.5, 1.1, 1], [0.15, -0.4, -0.1]);
            }
        } else {
            if (isMobile) {
                // On mobile home hero, position blocks lower/background so the main title and CTA buttons pop
                createBrick(3.6, 1.7, 1.8, terracottaMat, [0, -1.2, -1], [0.15, 0.35, -0.05]);
                createBrick(3.0, 1.5, 1.6, solidBlockMat, [2.2, 1.6, -2], [-0.1, 0.5, 0.1]);
                createBrick(2.8, 1.4, 1.4, flyAshMat, [-2.2, 1.8, -2], [0.25, -0.2, 0.15]);
            } else {
                createBrick(4.2, 2.0, 2.2, terracottaMat, [0, 0, 0], [0.15, 0.35, -0.05]);
                createBrick(3.8, 1.8, 2.0, solidBlockMat, [2.8, -1.2, 1.2], [-0.1, 0.5, 0.1]);
                createBrick(3.5, 1.8, 1.8, flyAshMat, [-2.6, 1.1, -1.0], [0.25, -0.2, 0.15]);
                createBrick(3.0, 1.5, 1.5, terracottaMat, [1.5, 2.2, -1.5], [-0.2, 0.4, -0.1]);
                createBrick(2.8, 1.4, 1.4, solidBlockMat, [-2.2, -1.8, 0.8], [0.1, -0.4, 0.2]);
            }
        }

        // Orbiting particles
        const particleCount = 65;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const pVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 26;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
            pVelocities.push({
                x: (Math.random() - 0.5) * 0.008,
                y: (Math.random() - 0.5) * 0.008,
                z: (Math.random() - 0.5) * 0.008
            });
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const pMaterial = new THREE.PointsMaterial({
            color: 0xff5722,
            size: 0.18,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending
        });
        const particlesSystem = new THREE.Points(particleGeom, pMaterial);
        scene.add(particlesSystem);

        // Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(10, 15, 12);
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
        rimLight.position.set(-12, -8, -5);
        scene.add(rimLight);

        const warmLight = new THREE.PointLight(0xff5722, 2.0, 25);
        warmLight.position.set(5, 4, 6);
        scene.add(warmLight);

        // Interaction coordinates
        let mouseX = 0;
        let mouseY = 0;
        let targetRotX = 0;
        let targetRotY = 0;

        const onPointerMove = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = ((x - rect.left) / rect.width) * 2 - 1;
            mouseY = -(((y - rect.top) / rect.height) * 2 - 1);
            targetRotY = mouseX * 0.45;
            targetRotX = -mouseY * 0.35;
        };

        window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        // Animation Loop
        let clock = new THREE.Clock();
        const animate3D = () => {
            requestAnimationFrame(animate3D);
            const elapsedTime = clock.getElapsedTime();

            // Smooth damping
            mainGroup.rotation.y += (targetRotY - mainGroup.rotation.y) * 0.05;
            mainGroup.rotation.x += (targetRotX - mainGroup.rotation.x) * 0.05;

            // Gentle floating physics
            interactiveBlocks.forEach((block, idx) => {
                const u = block.userData;
                block.position.y = u.originPos.y + Math.sin(elapsedTime * 1.2 + u.floatOffset) * 0.25;
                block.rotation.y += u.speed * (idx % 2 === 0 ? 1 : -1);
            });

            // Slowly orbit particle system
            particlesSystem.rotation.y = elapsedTime * 0.03;
            particlesSystem.rotation.x = Math.sin(elapsedTime * 0.02) * 0.1;

            renderer.render(scene, camera);
        };

        animate3D();

        // Update 3D materials on theme change
        const update3DTheme = (theme) => {
            const isLight = theme === 'light';
            if (isLight) {
                terracottaMat.color.setHex(0xb03d20);
                solidBlockMat.color.setHex(0x334155);
                flyAshMat.color.setHex(0x475569);
                wireframeMat.color.setHex(0x0284c7);
                pMaterial.color.setHex(0xc84b2c);
                ambientLight.intensity = 1.2;
            } else {
                terracottaMat.color.setHex(0xc84b2c);
                solidBlockMat.color.setHex(0x223247);
                flyAshMat.color.setHex(0x3a4f66);
                wireframeMat.color.setHex(0x38bdf8);
                pMaterial.color.setHex(0xff5722);
                ambientLight.intensity = 0.9;
            }
        };

        const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        update3DTheme(activeTheme);

        window.addEventListener('themeChanged', (e) => {
            if (e.detail && e.detail.theme) {
                update3DTheme(e.detail.theme);
            }
        });

        // Responsive Resize
        const onResize = () => {
            const w = container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
            const h = container.clientHeight > 0 ? container.clientHeight : (isInnerPage ? 320 : 650);
            const mob = w < 768;
            camera.aspect = w / h;
            camera.position.z = mob ? 22 : (isInnerPage ? 14 : 18);
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };

        window.addEventListener('resize', onResize);
    };

    /* ==========================================================================
       4. Interactive 3D Card Tilt Physics (.tilt-card)
       ========================================================================== */
    const initTiltCards = () => {
        const cards = document.querySelectorAll('.tilt-card');
        if (!cards.length) return;

        // Skip 3D tilt on coarse pointers (pure touch devices) to preserve native scrolling
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) return;

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -7;
                const rotateY = ((x - centerX) / centerX) * 7;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
                card.style.setProperty('--glare-x', `${(x / rect.width * 100).toFixed(1)}%`);
                card.style.setProperty('--glare-y', `${(y / rect.height * 100).toFixed(1)}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
            });
        });
    };

    /* ==========================================================================
       5. Mobile Navigation Drawer & Hamburger Controller
       ========================================================================== */
    const initMobileNav = () => {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (!hamburgerBtn) return;

        let overlay = document.querySelector('.mobile-nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            overlay.innerHTML = `
                <div class="mobile-nav-drawer">
                    <div class="mobile-nav-header">
                        <div class="logo">
                            <div class="logo-icon-box"><i class="fas fa-cubes"></i></div>
                            <div class="logo-text">
                                <div class="logo-brand">Sri Balaji <span>Bricks</span></div>
                                <div class="logo-sub">Hollow & Fly Ash Blocks</div>
                            </div>
                        </div>
                        <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close navigation">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <ul class="mobile-nav-links">
                        <li><a href="index.html"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="products.html"><i class="fas fa-cubes"></i> Products</a></li>
                        <li><a href="about.html"><i class="fas fa-building"></i> About Us</a></li>
                        <li><a href="gallery.html"><i class="fas fa-images"></i> Gallery</a></li>
                        <li><a href="contact.html"><i class="fas fa-envelope"></i> Contact Us</a></li>
                    </ul>

                    <div class="mobile-nav-footer">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 600;">Theme Mode</span>
                            <button class="theme-toggle-btn" id="mobileThemeToggleBtn" aria-label="Toggle Theme">
                                <i class="fas fa-sun theme-icon-sun"></i>
                                <i class="fas fa-moon theme-icon-moon"></i>
                            </button>
                        </div>
                        <a href="contact.html" class="btn btn-primary" style="width: 100%; justify-content: center; margin-bottom: 10px;">
                            <i class="fas fa-paper-plane"></i> Contact Us
                        </a>
                        <a href="https://wa.me/919443188311?text=Hello%20Sri%20Balaji%20Bricks,%20I%20would%20like%20to%20inquire%20about%20your%20products." target="_blank" class="btn btn-whatsapp" style="width: 100%; justify-content: center;">
                            <i class="fab fa-whatsapp"></i> WhatsApp Dispatch
                        </a>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Hook up mobile theme toggle
            const mobileThemeToggle = overlay.querySelector('#mobileThemeToggleBtn');
            if (mobileThemeToggle) {
                mobileThemeToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const active = document.documentElement.getAttribute('data-theme') || 'dark';
                    applyTheme(active === 'dark' ? 'light' : 'dark');
                });
            }
        }

        const closeBtn = document.getElementById('mobileNavClose');

        const openMenu = () => {
            hamburgerBtn.classList.add('is-active');
            overlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            hamburgerBtn.classList.remove('is-active');
            overlay.classList.remove('is-open');
            document.body.style.overflow = '';
        };

        hamburgerBtn.addEventListener('click', () => {
            if (overlay.classList.contains('is-open')) closeMenu();
            else openMenu();
        });

        if (closeBtn) closeBtn.addEventListener('click', closeMenu);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu();
        });

        // Set active link in mobile drawer based on current URL
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const mobileLinks = overlay.querySelectorAll('.mobile-nav-links a');
        mobileLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    };

    /* ==========================================================================
       6. Gallery Filtering & Fullscreen Lightbox Modal (gallery.html)
       ========================================================================== */
    const initGallery = () => {
        const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
        const galleryItems = document.querySelectorAll('.gallery-grid .gallery-card');

        if (filterBtns.length && galleryItems.length) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filter = btn.dataset.filter;
                    galleryItems.forEach(item => {
                        const cat = item.dataset.category;
                        if (filter === 'all' || cat === filter) {
                            item.style.display = 'block';
                            item.style.animation = 'fadeInUp 0.4s ease forwards';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        }

        // Lightbox modal
        const lightbox = document.getElementById('lightboxModal') || document.getElementById('galleryLightbox');
        if (lightbox) {
            const lightboxImg = lightbox.querySelector('#lightboxImg, .lightbox-img');
            const lightboxTitle = lightbox.querySelector('#lightboxTitle, .lightbox-title');
            const closeBtn = lightbox.querySelector('#lightboxClose, .lightbox-close-btn, .lightbox-close');

            galleryItems.forEach(card => {
                card.addEventListener('click', () => {
                    const img = card.querySelector('img');
                    const title = card.querySelector('.gallery-card-title')?.textContent || 'Sri Balaji Bricks';

                    if (img && lightboxImg) {
                        lightboxImg.src = img.src;
                        lightboxImg.alt = img.alt;
                    }
                    if (lightboxTitle) lightboxTitle.textContent = title;

                    lightbox.classList.add('is-open');
                    document.body.style.overflow = 'hidden';
                });
            });

            const closeLightbox = () => {
                lightbox.classList.remove('is-open');
                document.body.style.overflow = '';
            };

            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightbox();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
            });
        }
    };

    /* ==========================================================================
       7. Feedback Toast & Contact Form Handling
       ========================================================================== */
    const showToast = (message, icon = 'fa-check-circle') => {
        let toast = document.querySelector('.toast-msg');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-msg';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    };

    const initForms = () => {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', () => {
                const name = document.getElementById('name')?.value || 'Customer';
                showToast(`Thank you ${name}! Sending inquiry to Sri Balaji factory desk...`);
            });
        }
    };

    /* ==========================================================================
       8. Scroll to Top Button
       ========================================================================== */
    const initScrollTop = () => {
        const scrollBtn = document.getElementById('scrollTopBtn');
        if (!scrollBtn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('is-visible');
            } else {
                scrollBtn.classList.remove('is-visible');
            }
        }, { passive: true });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    /* ==========================================================================
       9. Navbar Active Link Highlight & Scroll Shadow
       ========================================================================== */
    const initNavbarState = () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 20) {
                    navbar.classList.add('is-scrolled');
                } else {
                    navbar.classList.remove('is-scrolled');
                }
            }, { passive: true });
        }

        const path = window.location.pathname.split('/').pop() || 'index.html';
        const desktopLinks = document.querySelectorAll('.nav-links a');
        desktopLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === path || (path === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    };

    /* ==========================================================================
       10. Bootstrapping
       ========================================================================== */
    initTheme();
    initGlobalParticles();
    initHero3D();
    initTiltCards();
    initMobileNav();
    initGallery();
    initForms();
    initScrollTop();
    initNavbarState();

})();
