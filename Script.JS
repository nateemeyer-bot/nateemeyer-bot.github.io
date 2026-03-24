// ============================================================
// SITE FUNCTIONALITY
// This file handles: scroll animations, smooth scrolling,
// auto year in footer, and the firework easter egg.
// ============================================================


// --- AUTO YEAR ---
// Sets the current year in the footer so you never have to update it
document.getElementById('year').textContent = new Date().getFullYear();


// --- FADE-IN ANIMATION ---
// Uses IntersectionObserver to watch elements with class "fade-in".
// When they scroll into view (at least 10% visible), the "visible"
// class is added, which triggers the CSS transition.
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


// --- SMOOTH SCROLLING ---
// When you click a nav link like href="#projects", instead of
// jumping instantly, the page scrolls there smoothly.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


// ============================================================
// EASTER EGG — Hold "F" to charge, release to launch!
// The longer you hold, the higher it goes (up to a max).
// ============================================================

// We wrap everything in an IIFE (Immediately Invoked Function
// Expression) so that all our variables are private and don't
// clash with anything else on the page.
(function() {

    // --- CANVAS SETUP ---
    // We create a <canvas> element in JavaScript and layer it
    // over the entire page. "pointer-events: none" means you
    // can still click things underneath it — the canvas is
    // invisible to mouse clicks. z-index: 9999 keeps it on top.
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    // Get the 2D drawing context — this is what we use to
    // draw shapes, set colors, etc. Think of it as our paintbrush.
    const ctx = canvas.getContext('2d');

    // The canvas needs to match the window size in actual pixels.
    // CSS makes it fill the screen visually, but we also need the
    // internal resolution to match so things aren't blurry.
    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
    resize();
    // Re-run whenever the window is resized
    addEventListener('resize', resize);


    // --- MOUSE TRACKING ---
    // We constantly track where the mouse is so we know where
    // to launch the firework from.
    let mx = 0, my = 0;
    addEventListener('mousemove', e => {
        mx = e.clientX;  // horizontal position (pixels from left)
        my = e.clientY;  // vertical position (pixels from top)
    });


    // --- COLORS ---
    // Each firework picks a random color from this array.
    // These are hex color codes — you can swap them for any
    // colors you like. Google "hex color picker" to find codes.
    const colors = [
        '#c8f542',  // lime (matches your accent)
        '#ff6b6b',  // coral red
        '#4ecdc4',  // teal
        '#ffe66d',  // golden yellow
        '#a855f7',  // purple
        '#f97316',  // orange
        '#38bdf8'   // sky blue
    ];


    // --- DATA ARRAYS ---
    // These hold all the active objects being animated.
    // The tick() function loops through them every frame.
    const sparks = [];   // explosion particles (the burst)
    const rockets = [];  // rising trails (before they explode)


    // --- CHARGE SYSTEM ---
    // When the user holds "F", we track how long they've held it.
    // charge:     goes from 0 to 1 (0 = just tapped, 1 = full power)
    // charging:   true while "F" is held down
    // chargeStart: timestamp (ms) when they started holding
    // launchX/Y:  where the mouse was when they started holding
    //             (so the firework launches from where you aimed)
    // maxChargeMs: how long (in milliseconds) to reach full charge.
    //              1500ms = 1.5 seconds to fully charge.
    let charge = 0;
    let charging = false;
    let chargeStart = 0;
    let launchX = 0, launchY = 0;
    const maxChargeMs = 1500;

    // --- HEIGHT SETTINGS ---
    // These control how high the firework goes.
    // minHeight: the shortest distance it flies (quick tap)
    // maxHeight: the tallest distance it flies (full charge)
    // Both are in pixels measured upward from the cursor.
    const minHeight = 80;
    const maxHeight = 500;

    // When "F" is pressed down, start charging
    addEventListener('keydown', e => {
        if ((e.key === 'f' || e.key === 'F')
            && e.target.tagName !== 'INPUT'      // don't trigger in text fields
            && e.target.tagName !== 'TEXTAREA'
            && !charging) {                       // don't restart if already held

            charging = true;
            chargeStart = performance.now();  // high-precision timestamp
            launchX = mx;   // lock in the launch position
            launchY = my;
        }
    });

    // When "F" is released, launch the firework
    addEventListener('keyup', e => {
        if ((e.key === 'f' || e.key === 'F') && charging) {
            charging = false;

            // Calculate how far up the firework should go.
            // "charge" is 0-1, so we lerp (blend) between min and max height.
            // lerp formula: min + (max - min) * t
            const height = minHeight + (maxHeight - minHeight) * charge;

            // Create the rocket object and add it to the array
            rockets.push({
                x: launchX,                  // starting X position
                y: launchY,                  // starting Y position
                targetY: launchY - height,   // Y position where it explodes
                speed: 8 + charge * 8,       // faster rocket for bigger charge
                color: colors[Math.floor(Math.random() * colors.length)],
                trail: [],                   // will hold spark positions
                arc: (Math.random() - 0.5) * 4,  // sideways curve
                power: charge                // remember charge for explosion size
            });

            charge = 0;  // reset for next firework
        }
    });


    // --- MAIN ANIMATION LOOP ---
    // This function runs ~60 times per second (every frame).
    // Each frame it: clears the screen, updates all objects,
    // draws them in their new positions.
    function tick() {
        // Schedule the next frame immediately. This creates
        // the continuous loop. The browser calls tick() again
        // right before the next screen refresh (~16ms later).
        requestAnimationFrame(tick);

        // Wipe the entire canvas clean. Without this, every
        // frame would draw ON TOP of the last one.
        ctx.clearRect(0, 0, canvas.width, canvas.height);


        // --- DRAW CHARGE INDICATOR ---
        // While holding "F", show a growing ring around the cursor
        // so the user can see how charged their firework is.
        if (charging) {
            // Calculate current charge: time held / max time, capped at 1
            const elapsed = performance.now() - chargeStart;
            charge = Math.min(elapsed / maxChargeMs, 1);

            // Draw an arc (partial circle) that fills up as you charge.
            // A full circle is 2π radians. We draw charge * 2π of it.
            ctx.save();  // save current drawing state

            ctx.strokeStyle = colors[0];       // use the accent color
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + charge * 0.5;  // gets more visible as you charge
            ctx.shadowBlur = 10 + charge * 10;
            ctx.shadowColor = colors[0];

            ctx.beginPath();
            // arc(centerX, centerY, radius, startAngle, endAngle)
            // We start at -π/2 (top of circle) so it fills clockwise from 12 o'clock
            ctx.arc(mx, my, 20 + charge * 15, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
            ctx.stroke();

            ctx.restore();  // restore state (resets alpha, shadow, etc.)
        }


        // --- UPDATE & DRAW ROCKETS ---
        // Loop backward so we can safely remove items mid-loop
        // (removing shifts later indices, but we've already passed them)
        for (let i = rockets.length - 1; i >= 0; i--) {
            const r = rockets[i];

            // Save the current position as a trail spark before moving
            r.trail.push({ x: r.x, y: r.y, life: 1 });

            // Move the rocket upward and sideways (the arc)
            r.y -= r.speed;
            r.x += r.arc + (Math.random() - 0.5) * 0.5;
            // The (Math.random() - 0.5) * 0.5 adds a tiny jitter
            // so the path isn't perfectly smooth — more natural

            // Draw the bright dot at the rocket's head
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 14;           // glow effect
            ctx.shadowColor = r.color;
            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);  // small circle
            ctx.fill();
            ctx.restore();

            // Draw each spark in the trail behind the rocket
            for (let j = r.trail.length - 1; j >= 0; j--) {
                const s = r.trail[j];
                s.life -= 0.06;  // fade out over ~17 frames (1/0.06)
                if (s.life <= 0) {
                    r.trail.splice(j, 1);  // remove dead spark
                    continue;
                }
                ctx.globalAlpha = s.life * 0.5;
                ctx.fillStyle = r.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.5 * s.life, 0, Math.PI * 2);
                ctx.fill();
            }

            // Check if the rocket has reached its target height
            if (r.y <= r.targetY) {
                // EXPLODE! Create a burst of spark particles.
                // More charge = more sparks (bigger explosion).
                const num = 50 + Math.floor(r.power * 80);

                for (let k = 0; k < num; k++) {
                    // Each spark flies outward at a random angle
                    const angle = Math.random() * Math.PI * 2;
                    // Speed is also scaled by charge — bigger = wider burst
                    const speed = (Math.random() * 5 + 1.5) * (1 + r.power * 0.8);

                    sparks.push({
                        x: r.x,
                        y: r.y,
                        // vx/vy = velocity (speed in x and y directions)
                        // cos gives the x component, sin gives the y component
                        // of a direction defined by "angle"
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1,    // starts fully alive
                        // decay = how fast it fades. Random range means
                        // some sparks last longer than others
                        decay: 0.01 + Math.random() * 0.018,
                        size: Math.random() * 3 + 1,
                        color: r.color
                    });
                }

                // Remove the rocket — it's done its job
                rockets.splice(i, 1);
            }
        }


        // --- UPDATE & DRAW EXPLOSION SPARKS ---
        for (let i = sparks.length - 1; i >= 0; i--) {
            const p = sparks[i];

            // Physics update:
            p.x += p.vx;       // move horizontally
            p.y += p.vy;       // move vertically
            p.vy += 0.05;      // gravity — slowly pulls sparks downward
            p.vx *= 0.98;      // friction — slows horizontal movement
            p.vy *= 0.98;      // friction — slows vertical movement
            p.life -= p.decay; // fade toward death

            // Remove dead sparks
            if (p.life <= 0) {
                sparks.splice(i, 1);
                continue;
            }

            // Draw outer glow (bigger, dimmer circle)
            ctx.save();
            ctx.globalAlpha = p.life * 0.4;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw bright core (smaller, brighter circle on top)
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Reset drawing state for safety
        ctx.globalAlpha = 1;
    }

    // Start the loop!
    tick();

})();  // <-- The () at the end immediately runs the function