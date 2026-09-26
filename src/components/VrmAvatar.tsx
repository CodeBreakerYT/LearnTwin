"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { voiceBus } from "@/lib/speech";
import { FallbackAvatar } from "./FallbackAvatar";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";

export type Mood = "neutral" | "happy" | "thinking" | "concerned";

type Props = {
  src: string;
  mood?: Mood;
  speaking?: boolean;
  accent?: string;
  framing?: "bust" | "upper";
  className?: string;
};

const MOOD_EXPR: Record<Mood, Partial<Record<"happy" | "relaxed" | "sad" | "surprised", number>>> = {
  neutral: { relaxed: 0.25 },
  happy: { happy: 0.75 },
  thinking: { relaxed: 0.4 },
  concerned: { sad: 0.35, relaxed: 0.1 },
};

export default function VrmAvatar({ src, mood = "neutral", speaking = false, accent = "#8b9cff", framing = "bust", className = "" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ mood, speaking });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    live.current = { mood, speaking };
  }, [mood, speaking]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    let vrm: VRM | null = null;
    let baseYaw = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    setReady(false);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the CSS fallback stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;opacity:0;transition:opacity .6s ease";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(framing === "bust" ? 24 : 28, 1, 0.1, 20);
    const key = new THREE.DirectionalLight(0xffffff, Math.PI * 0.95);
    key.position.set(0.8, 1.4, 2);
    const rim = new THREE.DirectionalLight(new THREE.Color(accent), Math.PI * 0.7);
    rim.position.set(-1.5, 1.2, -1);
    scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x2a2f55, Math.PI * 0.55));

    const lookTarget = new THREE.Object3D();
    scene.add(lookTarget);
    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp(((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2.4, -1, 1);
      pointer.y = THREE.MathUtils.clamp(((e.clientY - (r.top + r.height / 3)) / window.innerHeight) * 2.4, -1, 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer!.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(el);

    const loader = new GLTFLoader();
    loader.register((p) => new VRMLoaderPlugin(p));
    loader
      .loadAsync(src)
      .then((gltf) => {
        if (disposed) return;
        vrm = gltf.userData.vrm as VRM;
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.rotateVRM0(vrm);
        baseYaw = vrm.scene.rotation.y;
        vrm.scene.traverse((o) => (o.frustumCulled = false));
        scene.add(vrm.scene);

        const h = vrm.humanoid;
        const bone = (n: Parameters<typeof h.getNormalizedBoneNode>[0]) => h.getNormalizedBoneNode(n);
        // Relax the default T-pose: lower the arms and bend the elbows slightly.
        const set = (n: Parameters<typeof h.getNormalizedBoneNode>[0], x: number, y: number, z: number) => bone(n)?.rotation.set(x, y, z);
        set("leftUpperArm", 0, 0, 1.25);
        set("rightUpperArm", 0, 0, -1.25);
        set("leftLowerArm", 0, 0, 0.12);
        set("rightLowerArm", 0, 0, -0.12);
        vrm.update(0);

        const head = new THREE.Vector3();
        bone("head")?.getWorldPosition(head);
        const headY = head.y || 1.4;
        const targetY = framing === "bust" ? headY - 0.17 : headY - 0.28;
        const dist = framing === "bust" ? 1.75 : 2.12;
        camera.position.set(0, targetY + 0.02, dist);
        camera.lookAt(0, targetY, 0);
        lookTarget.position.set(0, headY, dist);
        if (vrm.lookAt) vrm.lookAt.target = lookTarget;

        setReady(true);
        renderer!.domElement.style.opacity = "1";
      })
      .catch(() => {
        /* keep the CSS fallback */
      });

    let last = performance.now();
    let t = 0;
    const expr = { happy: 0, relaxed: 0, sad: 0, surprised: 0, aa: 0, blink: 0 };
    let nextBlink = 1.5;
    let blinkT = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      if (!vrm || !visible) return;
      const { mood: m, speaking: talk } = live.current;

      // Expressions ease toward their targets.
      const goal = { happy: 0, relaxed: 0, sad: 0, surprised: 0, ...MOOD_EXPR[m] };
      const k = 1 - Math.exp(-dt * 6);
      for (const n of ["happy", "relaxed", "sad", "surprised"] as const) expr[n] += (goal[n] - expr[n]) * k;
      const mouthGoal = !talk ? 0 : voiceBus.speaking ? Math.min(0.8, 0.04 + voiceBus.level * 1.3) : 0.15 + 0.3 * Math.abs(Math.sin(t * 9.5) * Math.sin(t * 3.7));
      expr.aa += (mouthGoal - expr.aa) * (1 - Math.exp(-dt * 18));
      if (t > nextBlink && blinkT < 0) blinkT = 0;
      if (blinkT >= 0) {
        blinkT += dt;
        expr.blink = Math.max(0, Math.sin((blinkT / 0.22) * Math.PI));
        if (blinkT > 0.22) {
          blinkT = -1;
          expr.blink = 0;
          nextBlink = t + 2.4 + Math.random() * 3;
        }
      }
      const em = vrm.expressionManager;
      if (em) for (const [n, v] of Object.entries(expr)) em.setValue(n, v);

      // Idle life: breathing, sway and a soft head follow.
      const h = vrm.humanoid;
      const breath = Math.sin(t * 1.6);
      const spine = h.getNormalizedBoneNode("spine");
      if (spine) spine.rotation.x = breath * 0.012;
      const chest = h.getNormalizedBoneNode("chest");
      if (chest) chest.rotation.x = breath * 0.01;
      const neck = h.getNormalizedBoneNode("neck");
      if (neck) {
        const tilt = m === "thinking" ? 0.12 : m === "concerned" ? 0.06 : 0;
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, pointer.x * 0.25 + Math.sin(t * 0.5) * 0.03, k);
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, pointer.y * 0.1 + (talk ? Math.sin(t * 5) * 0.015 : 0), k);
        neck.rotation.z = THREE.MathUtils.lerp(neck.rotation.z, tilt, k);
      }
      vrm.scene.rotation.y = baseYaw + Math.sin(t * 0.35) * 0.05;
      lookTarget.position.x = pointer.x * 0.6;
      lookTarget.position.y = camera.position.y + 0.05 - pointer.y * 0.3;
      vrm.update(dt);
      renderer!.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      if (vrm) {
        scene.remove(vrm.scene);
        VRMUtils.deepDispose(vrm.scene);
      }
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [src, accent, framing]);

  return (
    <div className={className || "relative h-full w-full"}>
      {!ready && <FallbackAvatar accent={accent} />}
      <div ref={host} className="absolute inset-0" />
    </div>
  );
}
