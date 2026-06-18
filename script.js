// --- CONFIGURATION ---
const CONFIG = {
    itemCount: 20,
    starCount: 150,
    zGap: 800,
    loopSize: 0, // Calculated
    camSpeed: 2.5,
    colors: ['#ff2d75', '#00e5ff', '#ffb300', '#f0eaff'] // Cyber Funk palette
};
CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

const TEXTS = ["@_WEB___BUILDER_", "CYBER", "FULL SYSTEM", " TO SYSTEM", "FUTURE", "DESIGN", "PIXEL", "HYPER", " A TECH", "VOID"];

// --- STATE ---
const state = {
    scroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0
};

const world = document.getElementById('world');
const viewport = document.getElementById('viewport');
const items = [];

// --- INIT ---
function init() {
    // Create Items
    for (let i = 0; i < CONFIG.itemCount; i++) {
        const el = document.createElement('div');
        el.className = 'item';

        const isHeading = i % 4 === 0;

        if (isHeading) {
            const txt = document.createElement('div');
            txt.className = 'big-text';
            txt.innerText = TEXTS[i % TEXTS.length];
            el.appendChild(txt);
            items.push({
                el, type: 'text',
                x: 0, y: 0, rot: 0,
                baseZ: -i * CONFIG.zGap
            });
        } else {
            const card = document.createElement('div');
            card.className = 'card';
            const randId = Math.floor(Math.random() * 9999);
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-id">ID-${randId}</span>
                    <div style="width: 10px; height: 10px; background: var(--accent-2); border-radius:50%; box-shadow:0 0 16px var(--accent-2);"></div>
                </div>
                <h2>${TEXTS[i % TEXTS.length]}</h2>
                <div class="card-footer">
                    <span>GRID: ${Math.floor(Math.random() * 10)}x${Math.floor(Math.random() * 10)}</span>
                    <span>DATA_SIZE: ${(Math.random() * 100).toFixed(1)}MB</span>
                </div>
                <div style="position:absolute; bottom:2rem; right:2rem; font-size:4rem; opacity:0.08; font-weight:900; color:var(--accent-3);">0${i}</div>
            `;
            el.appendChild(card);

            const angle = (i / CONFIG.itemCount) * Math.PI * 6;
            const radius = 400 + Math.random() * 200;
            const x = Math.cos(angle) * (window.innerWidth * 0.3);
            const y = Math.sin(angle) * (window.innerHeight * 0.3);
            const rot = (Math.random() - 0.5) * 30;

            items.push({
                el, type: 'card',
                x, y, rot,
                baseZ: -i * CONFIG.zGap
            });
        }
        world.appendChild(el);
    }

    // Create Stars
    for (let i = 0; i < CONFIG.starCount; i++) {
        const el = document.createElement('div');
        el.className = 'star';
        world.appendChild(el);
        items.push({
            el, type: 'star',
            x: (Math.random() - 0.5) * 3000,
            y: (Math.random() - 0.5) * 3000,
            baseZ: -Math.random() * CONFIG.loopSize
        });
    }

    // Events
    window.addEventListener('mousemove', (e) => {
        state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
}
init();

// --- LENIS ---
const lenis = new Lenis({
    smooth: true,
    lerp: 0.08,
    direction: 'vertical',
    gestureDirection: 'vertical',
    smoothTouch: true
});

lenis.on('scroll', ({ scroll, velocity }) => {
    state.scroll = scroll;
    state.targetSpeed = velocity;
});

// --- RAF LOOP ---
const feedbackVel = document.getElementById('vel-readout');
const feedbackFPS = document.getElementById('fps');
let lastTime = 0;

function raf(time) {
    lenis.raf(time);

    const delta = time - lastTime;
    lastTime = time;
    if (time % 10 < 1) feedbackFPS.innerText = Math.round(1000 / delta);

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    feedbackVel.innerText = Math.abs(state.velocity).toFixed(2);
    document.getElementById('coord').innerText = `${state.scroll.toFixed(0)}`;

    // --- RENDER ---
    const tiltX = state.mouseY * 5 - state.velocity * 0.5;
    const tiltY = state.mouseX * 5;

    world.style.transform = `
        rotateX(${tiltX}deg) 
        rotateY(${tiltY}deg)
    `;

    const baseFov = 1000;
    const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
    viewport.style.perspective = `${fov}px`;

    const cameraZ = state.scroll * CONFIG.camSpeed;

    items.forEach(item => {
        let relZ = item.baseZ + cameraZ;
        const modC = CONFIG.loopSize;
        let vizZ = ((relZ % modC) + modC) % modC;
        if (vizZ > 500) vizZ -= modC;

        let alpha = 1;
        if (vizZ < -3000) alpha = 0;
        else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;
        if (vizZ > 100 && item.type !== 'star') alpha = 1 - ((vizZ - 100) / 400);
        if (alpha < 0) alpha = 0;
        item.el.style.opacity = alpha;

        if (alpha > 0) {
            let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

            if (item.type === 'star') {
                const stretch = Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.1, 10));
                trans += ` scale3d(1, 1, ${stretch})`;
            } else if (item.type === 'text') {
                trans += ` rotateZ(${item.rot}deg)`;
                if (Math.abs(state.velocity) > 1) {
                    const offset = state.velocity * 2;
                    item.el.style.textShadow = `${offset}px 0 var(--accent), ${-offset}px 0 var(--accent-2)`;
                } else {
                    item.el.style.textShadow = 'none';
                }
            } else {
                const t = time * 0.001;
                const float = Math.sin(t + item.x) * 10;
                trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
            }

            item.el.style.transform = trans;
        }
    });

    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
