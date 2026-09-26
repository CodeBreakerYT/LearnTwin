"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildBlocks, SPAN, type Block } from "@/lib/visuals";

type Live = {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  sprite: THREE.Sprite | null;
  labelText: string;
  cur: { x: number; y: number; z: number; w: number; h: number; d: number; o: number; glow: number; c: THREE.Color };
  tgt: Block | null;
};

function labelTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const g = c.getContext("2d")!;
  let px = 96;
  g.font = `700 ${px}px system-ui, sans-serif`;
  while (g.measureText(text).width > 470 && px > 28) {
    px -= 4;
    g.font = `700 ${px}px system-ui, sans-serif`;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 14;
  g.strokeStyle = "rgba(6,7,11,0.85)";
  g.strokeText(text, 256, 100);
  g.fillStyle = "#ffffff";
  g.fillText(text, 256, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A small self-contained three.js scene that animates the blocks for a concept step. */
export default function BlockStage({ conceptId, step, className = "" }: { conceptId: string; step: number; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef<Block[]>([]);
  const span = useRef(4.4);

  useEffect(() => {
    target.current = buildBlocks(conceptId, step);
    span.current = SPAN[conceptId] ?? 4.4;
  }, [conceptId, step]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.z = 12;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f55, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 7, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8b9cff, 1.6);
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.66, 96), new THREE.MeshBasicMaterial({ color: 0x8b9cff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.3;
    scene.add(ring);

    const geo = new RoundedBoxGeometry(1, 1, 1, 3, 0.09);
    const live = new Map<string, Live>();
    const disposeLive = (l: Live) => {
      scene.remove(l.mesh);
      l.mat.dispose();
      if (l.sprite) {
        scene.remove(l.sprite);
        l.sprite.material.map?.dispose();
        l.sprite.material.dispose();
      }
    };

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(el);

    let last = performance.now();
    let t = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      if (!visible) return;

      // Sync live meshes with the target blocks for the current step.
      const seen = new Set<string>();
      for (const b of target.current) {
        seen.add(b.id);
        let l = live.get(b.id);
        if (!l) {
          const mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.35, metalness: 0.08, transparent: true, opacity: 0 });
          const mesh = new THREE.Mesh(geo, mat);
          scene.add(mesh);
          l = { mesh, mat, sprite: null, labelText: "", cur: { x: b.x, y: b.y - 0.6, z: b.z, w: 0.01, h: 0.01, d: 0.01, o: 0, glow: 0, c: new THREE.Color(b.color) }, tgt: b };
          live.set(b.id, l);
        }
        l.tgt = b;
      }
      for (const [id, l] of live) if (!seen.has(id)) l.tgt = null;

      const k = 1 - Math.exp(-dt * 6.5);
      for (const [id, l] of live) {
        const b = l.tgt;
        const c = l.cur;
        const goal = b ? { x: b.x, y: b.y, z: b.z, w: b.ghost ? 0.01 : b.w, h: b.ghost ? 0.01 : b.h, d: b.ghost ? 0.01 : b.d, o: b.ghost ? 0 : (b.opacity ?? 1), glow: b.glow ?? 0 } : { x: c.x, y: c.y - 0.5, z: c.z, w: 0.01, h: 0.01, d: 0.01, o: 0, glow: 0 };
        c.x += (goal.x - c.x) * k;
        c.y += (goal.y - c.y) * k;
        c.z += (goal.z - c.z) * k;
        c.w += (goal.w - c.w) * k;
        c.h += (goal.h - c.h) * k;
        c.d += (goal.d - c.d) * k;
        c.o += (goal.o - c.o) * k;
        c.glow += (goal.glow - c.glow) * k;
        if (b) c.c.lerp(new THREE.Color(b.color), k);
        l.mesh.position.set(c.x, c.y, c.z);
        l.mesh.scale.set(c.w, c.h, c.d);
        l.mesh.visible = c.o > 0.02 && c.w > 0.02;
        l.mat.opacity = c.o;
        l.mat.color.copy(c.c);
        l.mat.emissive.copy(c.c);
        l.mat.emissiveIntensity = c.glow;

        // Labels
        const text = b?.label ?? "";
        if (text !== l.labelText) {
          l.labelText = text;
          if (l.sprite) {
            scene.remove(l.sprite);
            l.sprite.material.map?.dispose();
            l.sprite.material.dispose();
            l.sprite = null;
          }
          if (text) {
            l.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text), transparent: true, depthTest: false }));
            l.sprite.renderOrder = 10;
            scene.add(l.sprite);
          }
        }
        if (l.sprite) {
          const ghost = b?.ghost;
          l.sprite.position.set(c.x, c.y + (ghost ? 0 : c.h / 2 + 0.5), c.z);
          const s = (ghost ? 1.6 : 1.0) * (b?.size ?? 1);
          l.sprite.scale.set(s * 1.7 * (0.55 + 0.45 * Math.min(1, c.o + (ghost ? 1 : 0))), s * 0.64, 1);
          l.sprite.material.opacity = b ? (ghost ? 1 : Math.min(1, c.o * 1.2)) : 0;
        }
        if (!b && c.o < 0.02 && !l.sprite) {
          disposeLive(l);
          live.delete(id);
        }
      }

      // Slow camera drift so the scene always feels 3D.
      const zGoal = Math.min(17, Math.max(6.5, (span.current + 1.0) / (camera.aspect * 0.3057)));
      camera.position.z += (zGoal - camera.position.z) * k;
      camera.position.x = Math.sin(t * 0.32) * 1.6;
      camera.position.y = 3.2 + Math.sin(t * 0.21) * 0.3;
      camera.lookAt(0, 0.25, 0);
      ring.rotation.z = t * 0.05;
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      live.forEach(disposeLive);
      live.clear();
      geo.dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={className} />;
}
