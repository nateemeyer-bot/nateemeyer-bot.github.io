

        (function() {
 
            // --- CANVAS SETUP ---
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
            document.body.appendChild(canvas);
 
            const ctx = canvas.getContext('2d');
 
            function resize() {
                canvas.width = innerWidth;
                canvas.height = innerHeight;
            }
            resize();
            // Re-run whenever the window is resized
            addEventListener('resize', resize);
 
 
            // --- MOUSE TRACKING ---
     
            let mx = 0, my = 0;
            addEventListener('mousemove', e => {
                mx = e.clientX;  // horizontal position (pixels from left)
                my = e.clientY;  // vertical position (pixels from top)
            });
 
 
            // --- COLORS ---
   
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

            const sparks = [];  
            const rockets = []; 

            let charge = 0;
            let charging = false;
            let chargeStart = 0;
            let launchX = 0, launchY = 0;
            const maxChargeMs = 2000;
            const minHeight = 40;
            const maxHeight = 600;
 
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
 
                  
                    const height = minHeight + (maxHeight - minHeight) * charge;
 
                    // Create the rocket object and add it to the array
                    console.log('Launching rocket with charge:', charge.toFixed(2), 'and height:', height.toFixed(2));
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
 
            function tick() {
              
                requestAnimationFrame(tick);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

//cap max sparks to prevent slowdown
if (sparks.length >= 200) {
    sparks.length = 200;  
}
                if (charging) {
                    // Calculate current charge: time held / max time, capped at 1
                    //console.log('Charging...');  // Debug log to confirm charging is working
                    
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
 if(charge == 1.0) {
    // At full charge blink the arc to indicate max power
    ctx.shadowBlur = 20;
    console.log(elapsed);
    // Pulse the arc by adjusting its visibility every 100
ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 50) * 0.3;    

    

 }               


    ctx.lineWidth = 4 + (charge - 0.5) * 6;  // thicker line for bigger charge
                    
                    ctx.beginPath();
                   
                    ctx.arc(mx, my, 20 + charge * 15, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
                    ctx.stroke();
 
                    ctx.restore();  // restore state (resets alpha, shadow, etc.)
                }
 
 
                // --- UPDATE & DRAW ROCKETS ---
                for (let i = rockets.length - 1; i >= 0; i--) {
                    const r = rockets[i];
 
                    // Save the current position as a trail spark before moving
                    r.trail.push({ x: r.x, y: r.y, life: 1 });
 
                    // Move the rocket upward and sideways (the arc)
                    r.y -= r.speed;
                    r.x += r.arc + (Math.random() - 0.5) * 0.5;
                    ctx.save();
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 40;           // glow effect
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
                        const num = Math.floor(r.power * 200);
                        for (let k = 0; k < num; k++) {
                            // Each spark flies outward at a random angle
                            const angle = Math.random() * Math.PI * 2;
                            // Speed is also scaled by charge — bigger = wider burst
                            const speed = (Math.random() *  6.5) * (1 + r.power * 0.8);
 
                            sparks.push({
                                x: r.x,
                                y: r.y,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                life: 1,  
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
                    ctx.shadowBlur = 12 * p.life;  // glow gets smaller as it fades
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
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 4);
                    ctx.fill();
                    ctx.restore();
                }
 
                // Reset drawing state for safety
                ctx.globalAlpha = 1;
            }
 
            // Start the loop!
            tick();
 
        })();  // <-- The () at the end immediately runs the function
 
 