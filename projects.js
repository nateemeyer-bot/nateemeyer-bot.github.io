// ============================================================
// PROJECT SHOWCASE — Widget-based project display
//
// HOW TO EDIT YOUR PROJECTS:
// Scroll down to the "projects" object below and change the
// titles, descriptions, tags, and thumbnails.
// Replace emoji thumbs with image paths when ready, e.g.:
//   thumb: '<img src="images/dashboard.jpg" alt="Dashboard">'
// ============================================================

// --- PROJECT DATA ---
const projects = {
    work: [
        {
            title: 'Dashboard UI',
            desc: 'Analytics dashboard for monitoring real-time data.',
            tags: ['React', 'D3.js', 'CSS'],
            thumb: '📊'
        },
        {
            title: 'API Integration Tool',
            desc: 'REST API testing and documentation platform.',
            tags: ['Node.js', 'Express'],
            thumb: '🔌'
        },
        {
            title: 'Client Portal',
            desc: 'Secure file sharing and messaging system.',
            tags: ['HTML', 'CSS', 'Auth'],
            thumb: '🔐'
        },
        {
            title: 'E-Commerce Site',
            desc: 'Full-stack online store with cart and checkout.',
            tags: ['JavaScript', 'Stripe'],
            thumb: '🛒'
        }
    ],
    personal: [
        {
            title: '3D Portfolio Logo',
            desc: 'Interactive Three.js logo with bloom effects.',
            tags: ['Three.js', 'WebGL', 'Blender'],
            thumb: '🎨'
        },
        {
            title: 'Retro Game',
            desc: 'Browser-based arcade game with pixel art.',
            tags: ['Canvas', 'JavaScript'],
            thumb: '🕹️'
        },
        {
            title: 'Arduino Weather Station',
            desc: 'IoT weather monitor with web dashboard.',
            tags: ['Arduino', 'C++', 'HTML'],
            thumb: '🌡️'
        }
    ]
};

// --- STATE ---
let activeCategory = null;
const treeArea = document.getElementById('tree-area');
const treeProjects = document.getElementById('tree-projects');
const treeCanvas = document.getElementById('tree-canvas');
const treeCtx = treeCanvas.getContext('2d');

let noodleProgress = 0;
let noodleAnimating = false;
const revealedCards = new Set();
const sparkParticles = [];

// --- TOGGLE CATEGORY ---
// Called when you click a widget. Opens/closes the tree below it.
function toggleCategory(category) {
    const widgets = document.querySelectorAll('.category-widget');

    // If clicking the already active category, close it
    if (activeCategory === category) {
        activeCategory = null;
        widgets.forEach(w => w.classList.remove('active'));
        treeArea.classList.remove('expanded');
        noodleAnimating = false;
        revealedCards.clear();
        sparkParticles.length = 0;
        setTimeout(() => {
            treeProjects.innerHTML = '';
            treeCanvas.width = treeCanvas.width; // quick clear
        }, 500);
        return;
    }

    activeCategory = category;

    // Update active states on widgets
    widgets.forEach(w => {
        if (w.dataset.category === category) {
            w.classList.add('active');
        } else {
            w.classList.remove('active');
        }
    });

    // Populate project cards
    treeProjects.innerHTML = '';
    treeCanvas.width = treeCanvas.width; // clear

    projects[category].forEach(project => {
        const card = document.createElement('div');
        card.className = 'tree-project';
        card.innerHTML = `
            <div class="project-card-mini">
                <div class="project-thumb">${project.thumb}</div>
                <div class="info">
                    <h3>${project.title}</h3>
                    <p>${project.desc}</p>
                    <div class="project-tags-mini">
                        ${project.tags.map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
        treeProjects.appendChild(card);
    });

    // Expand the tree area and start noodle animation
    treeArea.classList.add('expanded');

    setTimeout(() => {
        noodleProgress = 0;
        noodleAnimating = true;
        revealedCards.clear();
        sparkParticles.length = 0;
        animateNoodles();
    }, 600);
}


// --- DRAW FINAL STATIC CONNECTIONS ---
// Used after animation completes and on window resize
function drawConnections() {
    const canvasTop = 80;
    treeCanvas.width = treeArea.offsetWidth;
    treeCanvas.height = treeArea.offsetHeight + canvasTop;
    treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    const cards = document.querySelectorAll('.tree-project');
    if (cards.length === 0) return;

    const activeWidget = document.querySelector('.category-widget.active .widget-box');
    if (!activeWidget) return;

    const widgetRect = activeWidget.getBoundingClientRect();
    const areaRect = treeArea.getBoundingClientRect();

    const startX = widgetRect.left - areaRect.left + widgetRect.width / 2;
    const startY = widgetRect.bottom - areaRect.top + canvasTop;

    cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const endX = cardRect.left - areaRect.left + cardRect.width / 2;
        const endY = cardRect.top - areaRect.top + canvasTop;

        const midY = startY + (endY - startY) * 0.5;

        // Outer glow
        treeCtx.beginPath();
        treeCtx.moveTo(startX, startY);
        treeCtx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.08)';
        treeCtx.lineWidth = 8;
        treeCtx.lineCap = 'round';
        treeCtx.stroke();

        // Mid glow
        treeCtx.beginPath();
        treeCtx.moveTo(startX, startY);
        treeCtx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.15)';
        treeCtx.lineWidth = 4;
        treeCtx.stroke();

        // Core line
        treeCtx.beginPath();
        treeCtx.moveTo(startX, startY);
        treeCtx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.5)';
        treeCtx.lineWidth = 2;
        treeCtx.stroke();

        // Start dot
        treeCtx.beginPath();
        treeCtx.arc(startX, startY, 5, 0, Math.PI * 2);
        treeCtx.fillStyle = 'rgba(200, 245, 66, 0.7)';
        treeCtx.fill();

        // End dot
        treeCtx.beginPath();
        treeCtx.arc(endX, endY, 4, 0, Math.PI * 2);
        treeCtx.fillStyle = 'rgba(200, 245, 66, 0.6)';
        treeCtx.fill();
    });
}


// --- ANIMATED NOODLE DRAWING ---
// Draws the bezier curves progressively with spark bursts on arrival
function animateNoodles() {
    if (!noodleAnimating) return;
    noodleProgress += 0.02;

    if (noodleProgress >= 1.5 && sparkParticles.length === 0) {
        noodleAnimating = false;
        drawConnections();
        return;
    }

    const canvasTop = 80;
    treeCanvas.width = treeArea.offsetWidth;
    treeCanvas.height = treeArea.offsetHeight + canvasTop;
    treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    const cards = document.querySelectorAll('.tree-project');
    if (cards.length === 0) return;

    const activeWidget = document.querySelector('.category-widget.active .widget-box');
    if (!activeWidget) return;

    const widgetRect = activeWidget.getBoundingClientRect();
    const areaRect = treeArea.getBoundingClientRect();

    const startX = widgetRect.left - areaRect.left + widgetRect.width / 2;
    const startY = widgetRect.bottom - areaRect.top + canvasTop;

    cards.forEach((card, i) => {
        const cardRect = card.getBoundingClientRect();
        const endX = cardRect.left - areaRect.left + cardRect.width / 2;
        const endY = cardRect.top - areaRect.top + canvasTop;

        const midY = startY + (endY - startY) * 0.5;

        // Stagger each noodle
        const stagger = i * 0.15;
        const p = Math.max(0, Math.min(1, (noodleProgress - stagger) / (0.8 - stagger * 0.5)));
        if (p <= 0) return;

        // Get points along partial bezier
        const points = getPartialBezier(
            startX, startY,
            startX, midY,
            endX, midY,
            endX, endY,
            p
        );

        // Glow layer
        treeCtx.beginPath();
        treeCtx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) treeCtx.lineTo(points[j].x, points[j].y);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.08)';
        treeCtx.lineWidth = 8;
        treeCtx.lineCap = 'round';
        treeCtx.stroke();

        // Mid layer
        treeCtx.beginPath();
        treeCtx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) treeCtx.lineTo(points[j].x, points[j].y);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.15)';
        treeCtx.lineWidth = 4;
        treeCtx.stroke();

        // Core layer
        treeCtx.beginPath();
        treeCtx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) treeCtx.lineTo(points[j].x, points[j].y);
        treeCtx.strokeStyle = 'rgba(200, 245, 66, 0.5)';
        treeCtx.lineWidth = 2;
        treeCtx.stroke();

        // Bright tip at leading edge
        if (p < 1 && points.length > 0) {
            const tip = points[points.length - 1];
            treeCtx.beginPath();
            treeCtx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
            treeCtx.fillStyle = 'rgba(200, 245, 66, 0.9)';
            treeCtx.fill();
        }

        // Start dot
        treeCtx.beginPath();
        treeCtx.arc(startX, startY, 5, 0, Math.PI * 2);
        treeCtx.fillStyle = 'rgba(200, 245, 66, 0.7)';
        treeCtx.fill();

        // When noodle reaches the card — reveal with sparks!
        if (p >= 0.95 && !revealedCards.has(i)) {
            revealedCards.add(i);
            card.classList.add('revealed');

            // Spawn spark burst
            for (let s = 0; s < 16; s++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1.5;
                sparkParticles.push({
                    x: endX,
                    y: endY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    life: 1,
                    decay: 0.02 + Math.random() * 0.03,
                    size: Math.random() * 2.5 + 1
                });
            }
        }

        // End dot (only after card is revealed)
        if (revealedCards.has(i)) {
            treeCtx.beginPath();
            treeCtx.arc(endX, endY, 4, 0, Math.PI * 2);
            treeCtx.fillStyle = 'rgba(200, 245, 66, 0.6)';
            treeCtx.fill();
        }
    });

    // Draw spark particles
    drawSparks();

    requestAnimationFrame(animateNoodles);
}


// --- SPARK PARTICLES ---
function drawSparks() {
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
        const s = sparkParticles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.08;
        s.vx *= 0.97;
        s.vy *= 0.97;
        s.life -= s.decay;

        if (s.life <= 0) {
            sparkParticles.splice(i, 1);
            continue;
        }

        // Glow
        treeCtx.save();
        treeCtx.globalAlpha = s.life * 0.4;
        treeCtx.fillStyle = '#c8f542';
        treeCtx.shadowBlur = 8;
        treeCtx.shadowColor = '#c8f542';
        treeCtx.beginPath();
        treeCtx.arc(s.x, s.y, s.size * s.life * 2, 0, Math.PI * 2);
        treeCtx.fill();
        treeCtx.restore();

        // Core
        treeCtx.save();
        treeCtx.globalAlpha = s.life;
        treeCtx.fillStyle = '#e8ffaa';
        treeCtx.beginPath();
        treeCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        treeCtx.fill();
        treeCtx.restore();
    }
}


// --- BEZIER HELPER ---
// Sample points along a cubic bezier up to parameter t
function getPartialBezier(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
    const points = [];
    const steps = 40;
    for (let i = 0; i <= steps * t; i++) {
        const s = i / steps;
        const inv = 1 - s;
        const x = inv*inv*inv*x0 + 3*inv*inv*s*cx1 + 3*inv*s*s*cx2 + s*s*s*x1;
        const y = inv*inv*inv*y0 + 3*inv*inv*s*cy1 + 3*inv*s*s*cy2 + s*s*s*y1;
        points.push({ x, y });
    }
    return points;
}


// --- REDRAW ON RESIZE ---
window.addEventListener('resize', () => {
    if (activeCategory && !noodleAnimating) drawConnections();
});