# nateemeyer-bot.github.io


<div style="padding: 1rem 0; text-align: center;">
  <canvas id="c" width="500" height="420" style="max-width: 100%; cursor: grab; touch-action: none; border-radius: var(--border-radius-lg); background: var(--color-background-secondary);"></canvas>
  <div style="display: flex; gap: 12px; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
    <button onclick="setShape('icosahedron')">Icosahedron</button>
    <button onclick="setShape('dodecahedron')">Dodecahedron</button>
    <button onclick="setShape('octahedron')">Octahedron</button>
    <button onclick="setShape('cube')">Cube</button>
  </div>
  <div style="display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 12px;">
    <label style="font-size: 13px; color: var(--color-text-secondary);">Spin speed</label>
    <input type="range" min="0" max="100" value="30" id="speed" style="width: 160px;">
  </div>
</div>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const speedEl = document.getElementById('speed');
const W = canvas.width, H = canvas.height;
const cx = W/2, cy = H/2;

const palette = ['#534AB7','#1D9E75','#D85A30','#378ADD','#D4537E','#639922','#BA7517','#E24B4A'];

let rotX = 0.3, rotY = 0.5, rotZ = 0;
let dragging = false, lastX, lastY;
let autoRotate = true;
let vertices = [], faces = [];

const phi = (1 + Math.sqrt(5)) / 2;

const shapes = {
  icosahedron: () => {
    const v = [];
    [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],
     [0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],
     [phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].forEach(p => v.push(p));
    const f = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];
    return {v, f};
  },
  dodecahedron: () => {
    const v = [];
    const ip = 1/phi;
    [[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],
     [1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],
     [0,-ip,-phi],[0,ip,-phi],[0,-ip,phi],[0,ip,phi],
     [-ip,-phi,0],[ip,-phi,0],[-ip,phi,0],[ip,phi,0],
     [-phi,0,-ip],[-phi,0,ip],[phi,0,-ip],[phi,0,ip]].forEach(p => v.push(p));
    const f = [
      [0,8,4,13,12],[0,12,1,17,16],[0,16,2,9,8],
      [1,10,5,13,12],[1,12,0,8,10].length?[2,14,3,17,16]:[],
      [2,16,0,8,9],[2,9,6,15,14],[3,11,7,15,14],
      [3,14,2,16,17],[3,17,1,10,11],[4,8,0,12,13],
      [4,13,5,19,18],[4,18,6,9,8],[5,10,1,12,13],
      [5,13,4,18,19],[5,19,7,11,10],[6,9,2,14,15],
      [6,15,7,19,18],[7,11,3,14,15],[7,15,6,18,19]
    ].filter(f => f.length === 5);
    return {v, f};
  },
  octahedron: () => {
    const v = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const f = [[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,4,2],[1,3,4],[1,5,3],[1,2,5]];
    return {v, f};
  },
  cube: () => {
    const v = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    const f = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]];
    return {v, f};
  }
};

function setShape(name) {
  const s = shapes[name]();
  vertices = s.v.map(v => {
    const len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    return [v[0]/len*150, v[1]/len*150, v[2]/len*150];
  });
  faces = s.f;
}

function project(v) {
  let [x,y,z] = v;
  let cosA=Math.cos(rotX), sinA=Math.sin(rotX);
  let y1=y*cosA-z*sinA, z1=y*sinA+z*cosA;
  y=y1; z=z1;
  let cosB=Math.cos(rotY), sinB=Math.sin(rotY);
  let x1=x*cosB+z*sinB; z1=-x*sinB+z*cosB;
  x=x1; z=z1;
  const scale = 600/(600+z);
  return [cx+x*scale, cy+y*scale, z];
}

function draw() {
  ctx.clearRect(0,0,W,H);
  const projected = vertices.map(v => project(v));
  const faceData = faces.map((f, i) => {
    const pts = f.map(idx => projected[idx]);
    const avgZ = pts.reduce((s,p) => s+p[2],0)/pts.length;
    return {pts, avgZ, idx: i};
  });
  faceData.sort((a,b) => b.avgZ - a.avgZ);

  faceData.forEach(fd => {
    const pts = fd.pts;
    const c = palette[fd.idx % palette.length];
    const brightness = 0.4 + 0.6 * ((fd.avgZ + 150) / 300);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = c + Math.round(brightness * 200).toString(16).padStart(2,'0');
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  projected.forEach(p => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 3, 0, Math.PI*2);
    ctx.fillStyle = 'var(--color-text-primary)';
    ctx.fill();
  });
}

function animate() {
  const spd = speedEl.value / 3000;
  if(autoRotate && !dragging) {
    rotY += spd;
    rotX += spd * 0.3;
  }
  draw();
  requestAnimationFrame(animate);
}

canvas.addEventListener('pointerdown', e => { dragging=true; autoRotate=false; lastX=e.clientX; lastY=e.clientY; canvas.style.cursor='grabbing'; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if(!dragging) return; rotY+=(e.clientX-lastX)*0.01; rotX+=(e.clientY-lastY)*0.01; lastX=e.clientX; lastY=e.clientY; });
canvas.addEventListener('pointerup', e => { dragging=false; autoRotate=true; canvas.style.cursor='grab'; });

setShape('icosahedron');
animate();
</script>
