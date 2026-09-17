import React, { useEffect, useRef, useCallback } from 'react';
import { Bean, StickyThread, FoamBubble, ToppingParticle, ToppingType } from '../types';
import { playStirSound, playChopstickClick } from '../audio';

interface NattoCanvasProps {
  stirCount: number;
  onStir: (increment: number, isRapid: boolean) => void;
  liftRatio: number; // 0 (in bowl) .. 1 (lifted high)
  activeToppings: Set<ToppingType>;
  resetCount?: number;
}

export const NattoCanvas: React.FC<NattoCanvasProps> = ({
  stirCount,
  onStir,
  liftRatio,
  activeToppings,
  resetCount = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics & Animation state refs
  const beansRef = useRef<Bean[]>([]);
  const threadsRef = useRef<StickyThread[]>([]);
  const bubblesRef = useRef<FoamBubble[]>([]);
  const toppingsRef = useRef<ToppingParticle[]>([]);

  // Chopsticks coordinate & dynamics state
  const chopsticksRef = useRef({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    angle: 0.28, // slight diagonal tilt
    stirPhase: 0,
    isStirring: false,
    stirSpeed: 0,
    depth: 0, // 0..1 plunge depth
    lastAngle: 0,
    accumulatedAngle: 0,
    angularVelocity: 0, // rotational speed of chopsticks
  });

  const liftDurationRef = useRef(0);

  // Touch tracking for drag & tap detection
  const touchStateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    hasMoved: false,
    totalMoveDist: 0,
  });

  // Helper to construct initial toppings
  const createInitialToppings = useCallback((toppingsSet: Set<ToppingType>): ToppingParticle[] => {
    const list: ToppingParticle[] = [];
    toppingsSet.forEach((type) => {
      if (type === 'negi') {
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 85;
          list.push({
            id: Math.random(),
            type: 'negi',
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * (dist * 0.75),
            vx: 0,
            vy: 0,
            angle: Math.random() * Math.PI * 2,
            size: 4 + Math.random() * 3,
          });
        }
      } else if (type === 'karashi') {
        list.push({
          id: Math.random(),
          type: 'karashi',
          x: 32 + Math.random() * 12,
          y: -22 + Math.random() * 10,
          vx: 0,
          vy: 0,
          angle: 0,
          size: 14,
        });
      } else if (type === 'egg') {
        list.push({
          id: Math.random(),
          type: 'egg',
          x: 0,
          y: -4,
          vx: 0,
          vy: 0,
          angle: 0,
          size: 25,
        });
      } else if (type === 'tare') {
        for (let i = 0; i < 16; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 75;
          list.push({
            id: Math.random(),
            type: 'tare',
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * (dist * 0.75),
            vx: 0,
            vy: 0,
            angle: 0,
            size: 7 + Math.random() * 6,
          });
        }
      }
    });
    return list;
  }, []);

  // Initialize Beans once
  useEffect(() => {
    const beans: Bean[] = [];
    const count = 390; // 5x beans (78 * 5 = 390)
    for (let i = 0; i < count; i++) {
      // Golden spiral distribution inside bowl cavity
      const theta = i * 2.39996;
      const r = Math.sqrt(i / count) * 98;
      const x = Math.cos(theta) * r + (Math.random() * 8 - 4);
      const y = Math.sin(theta) * (r * 0.76) + (Math.random() * 8 - 4);

      // Select beans to cling to chopstick tips when lifted
      const isClinger = i < 35;
      const clingTip: 0 | 1 = i % 2 === 0 ? 0 : 1;

      beans.push({
        id: i,
        x,
        y,
        z: (i / count) * 20 + Math.random() * 4,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        vAngle: 0,
        sizeX: 8.6 + Math.random() * 2.4,
        sizeY: 5.6 + Math.random() * 1.6,
        shade: Math.random(),
        liftedCling: isClinger ? 0.35 + Math.random() * 0.65 : 0,
        clingTipIndex: clingTip,
        clingOffsetX: (Math.random() - 0.5) * 16,
        clingOffsetY: Math.random() * 22,
        fallProgress: 0,
        // Staggered fall delays: some slide down after 0.6s, others hold on up to 3.5s
        fallDelay: 0.6 + Math.random() * 2.8,
        // Viscous sliding speed (takes approx 1.5 - 3 seconds to slowly slide down)
        fallSpeed: 0.35 + Math.random() * 0.35,
        isFallen: false,
        stickTimer: 0,
        stickCooldown: 0,
        stickTip: clingTip,
      });
    }
    beansRef.current = beans;
    toppingsRef.current = createInitialToppings(activeToppings);
  }, [createInitialToppings]);

  // Handle "Another Bowl" (もう一杯) reset trigger
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // 1. Reset all beans to exact initial center coordinates & zero velocities
    beansRef.current.forEach((b) => {
      b.x = b.baseX;
      b.y = b.baseY;
      b.vx = 0;
      b.vy = 0;
      b.vAngle = 0;
      b.fallProgress = 0;
      b.isFallen = false;
      b.stickTimer = 0;
      b.stickCooldown = 0;
    });

    // 2. Clear threads, bubbles, and splash particles
    threadsRef.current = [];
    bubblesRef.current = [];

    // 3. Reset chopsticks to center
    const cs = chopsticksRef.current;
    cs.x = 0;
    cs.y = 0;
    cs.prevX = 0;
    cs.prevY = 0;
    cs.vx = 0;
    cs.vy = 0;
    cs.targetX = 0;
    cs.targetY = 0;
    cs.isStirring = false;
    cs.stirSpeed = 0;
    cs.angularVelocity = 0;
    cs.depth = 0;

    // 4. Reset toppings to fresh center placements
    toppingsRef.current = createInitialToppings(activeToppings);
  }, [resetCount, createInitialToppings]);

  // Sync Toppings with activeToppings prop
  useEffect(() => {
    const existing = toppingsRef.current;
    const nextToppings: ToppingParticle[] = [];

    existing.forEach((p) => {
      if (activeToppings.has(p.type)) {
        nextToppings.push(p);
      }
    });

    activeToppings.forEach((type) => {
      const alreadyHas = nextToppings.some((p) => p.type === type);
      if (!alreadyHas) {
        if (type === 'negi') {
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 85;
            nextToppings.push({
              id: Math.random(),
              type: 'negi',
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * (dist * 0.75),
              vx: 0,
              vy: 0,
              angle: Math.random() * Math.PI * 2,
              size: 4 + Math.random() * 3,
            });
          }
        } else if (type === 'karashi') {
          nextToppings.push({
            id: Math.random(),
            type: 'karashi',
            x: 32 + Math.random() * 12,
            y: -22 + Math.random() * 10,
            vx: 0,
            vy: 0,
            angle: 0,
            size: 14,
          });
        } else if (type === 'egg') {
          nextToppings.push({
            id: Math.random(),
            type: 'egg',
            x: 0,
            y: -4,
            vx: 0,
            vy: 0,
            angle: 0,
            size: 25,
          });
        } else if (type === 'tare') {
          for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 75;
            nextToppings.push({
              id: Math.random(),
              type: 'tare',
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * (dist * 0.75),
              vx: 0,
              vy: 0,
              angle: 0,
              size: 7 + Math.random() * 6,
            });
          }
        }
      }
    });

    toppingsRef.current = nextToppings;
  }, [activeToppings]);

  // Handle tap / stir trigger
  const triggerTapStir = useCallback(
    (canvasX: number, canvasY: number, bowlCenterX: number, bowlCenterY: number, innerRadius: number) => {
      const cs = chopsticksRef.current;
      cs.isStirring = false;
      cs.stirSpeed = 0;
      cs.depth = 1.0;

      // Animate target toward tap location, strictly bounded within bowl
      const relX = canvasX - bowlCenterX;
      const relY = canvasY - bowlCenterY;
      const distFromCenter = Math.hypot(relX, relY);
      const maxReach = innerRadius * 0.68;

      if (distFromCenter <= maxReach) {
        cs.targetX = relX;
        cs.targetY = relY;
      } else {
        cs.targetX = (relX / distFromCenter) * maxReach;
        cs.targetY = (relY / distFromCenter) * maxReach;
      }

      // Add stir count
      onStir(1, false);
      playStirSound(Math.min(1, 0.4 + stirCount * 0.005));
      if (Math.random() < 0.25) {
        playChopstickClick();
      }

      // Gentle push only on beans directly under the chopstick placement
      const beans = beansRef.current;
      const impactRadius = 24;
      beans.forEach((b) => {
        const dx = b.x - cs.targetX;
        const dy = b.y - cs.targetY;
        const d = Math.hypot(dx, dy);
        if (d < impactRadius && d > 0.001) {
          const push = (impactRadius - d) * 0.5;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
          b.vAngle += (Math.random() - 0.5) * 0.5;
        }
      });

      // Subtle contact with toppings
      toppingsRef.current.forEach((t) => {
        const dx = t.x - cs.targetX;
        const dy = t.y - cs.targetY;
        const d = Math.hypot(dx, dy);
        if (d < impactRadius && d > 0.001) {
          const push = (impactRadius - d) * 0.4;
          t.x += (dx / d) * push;
          t.y += (dy / d) * push;
        }
      });

      // Spawn bubbles proportional to stir count
      const bubbleCount = Math.min(6, Math.floor(1 + stirCount * 0.03));
      for (let i = 0; i < bubbleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 40;
        bubblesRef.current.push({
          x: cs.targetX + Math.cos(angle) * r,
          y: cs.targetY + Math.sin(angle) * r,
          radius: 2 + Math.random() * (4 + Math.min(14, stirCount * 0.05)),
          opacity: 0.8 + Math.random() * 0.2,
          age: 0,
          maxAge: 180 + Math.random() * 240,
        });
      }
    },
    [onStir, stirCount]
  );

  // Main Render & Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      // Handle high DPI retina display sizing
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Bowl center placement: shifts smoothly to the right when lifted to make room on the left
      const liftOffset = liftRatio * Math.min(80, displayHeight * 0.15);
      const rightShift = liftRatio * Math.min(220, displayWidth * 0.22);
      const bowlCenterX = displayWidth * 0.5 + rightShift;
      const bowlCenterY = displayHeight * 0.62 + liftOffset;
      const bowlRadius = Math.min(140, displayWidth * 0.4);
      const innerRadius = bowlRadius * 0.88;

      const cs = chopsticksRef.current;

      // Track chopstick velocity for physics transfer
      cs.prevX = cs.x;
      cs.prevY = cs.y;

      // Update chopsticks physics: chopsticks follow user's finger cleanly without synthetic swirling
      const isTouchActive = touchStateRef.current.isDown;

      if (!isTouchActive) {
        cs.isStirring = false;
        cs.stirSpeed = 0;
        cs.angularVelocity = 0;
      } else if (cs.isStirring) {
        cs.stirSpeed = Math.max(0, cs.stirSpeed - dt * 6.0);
        if (cs.stirSpeed <= 0.05) {
          cs.isStirring = false;
        }
      }

      // Constrain target strictly within bowl interior
      const distTarget = Math.hypot(cs.targetX, cs.targetY);
      const maxChopstickRadius = innerRadius * 0.68;
      if (distTarget > maxChopstickRadius) {
        cs.targetX = (cs.targetX / distTarget) * maxChopstickRadius;
        cs.targetY = (cs.targetY / distTarget) * maxChopstickRadius;
      }

      // Smooth chopstick follow
      const followRate = 22 * dt;
      cs.x += (cs.targetX - cs.x) * Math.min(1, followRate);
      cs.y += (cs.targetY - cs.y) * Math.min(1, followRate);

      cs.vx = (cs.x - cs.prevX) / (dt || 0.016);
      cs.vy = (cs.y - cs.prevY) / (dt || 0.016);

      // Rotational speed of chopsticks around bowl center
      const currentAngleFromCenter = Math.atan2(cs.y, cs.x);
      let angleDelta = currentAngleFromCenter - cs.lastAngle;
      if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      cs.angularVelocity = angleDelta / (dt || 0.016);
      cs.lastAngle = currentAngleFromCenter;

      // Calculate Chopstick Tip positions
      const maxLiftPixels = Math.max(220, displayHeight * 0.48);
      const currentLiftPixels = liftRatio * maxLiftPixels;
      const chopstickDepthOffset = (1 - cs.depth) * 20;

      const tip1X = bowlCenterX + cs.x - 4;
      const tip1Y = bowlCenterY + cs.y - currentLiftPixels + chopstickDepthOffset;
      const tip2X = bowlCenterX + cs.x + 8;
      const tip2Y = bowlCenterY + cs.y - currentLiftPixels + chopstickDepthOffset - 3;

      const beans = beansRef.current;
      const threads = threadsRef.current;
      const toppings = toppingsRef.current;

      // -------------------------------------------------------------
      // 0. LIFTED BEANS FALLING DYNAMICS (お箸にくっついている納豆がゆっくりと落ちていく)
      // -------------------------------------------------------------
      if (liftRatio > 0.12) {
        liftDurationRef.current += dt;
        const liftTime = liftDurationRef.current;

        for (let i = 0; i < beans.length; i++) {
          const b = beans[i];
          if (b.liftedCling > 0 && !b.isFallen) {
            if (liftTime > b.fallDelay) {
              b.fallProgress += dt * b.fallSpeed;
              if (b.fallProgress >= 1) {
                b.fallProgress = 1;
                b.isFallen = true;
                // Settle directly straight down in bowl
                b.x = (b.clingTipIndex === 0 ? cs.x - 4 : cs.x + 8) + b.clingOffsetX;
                b.y = cs.y * 0.5 + b.baseY * 0.3;
                b.vx = 0;
                b.vy = 0.3;
              }
            }
          }
        }
      } else if (liftRatio < 0.08) {
        // Lowered back to bowl: reset falling state so they can cling fresh next lift
        liftDurationRef.current = 0;
        for (let i = 0; i < beans.length; i++) {
          const b = beans[i];
          if (b.liftedCling > 0) {
            b.fallProgress = 0;
            b.isFallen = false;
          }
        }
      }

      // -------------------------------------------------------------
      // 1. BEAN PHYSICS UPDATE (お箸が当たった納豆がその分だけ移動する直接接触物理)
      // -------------------------------------------------------------
      const isChopstickInBowl = liftRatio < 0.25;
      const stickinessFactor = Math.min(1, stirCount / 100);

      const csDeltaX = cs.x - cs.prevX;
      const csDeltaY = cs.y - cs.prevY;
      const csMoving = Math.hypot(csDeltaX, csDeltaY) > 0.001;

      // The two chopstick tips relative to bowl center
      const tips = [
        { x: cs.x - 4, y: cs.y },
        { x: cs.x + 8, y: cs.y - 3 },
      ];
      const tipRadius = 9;

      for (let i = 0; i < beans.length; i++) {
        const b = beans[i];

        if (b.stickCooldown > 0) {
          b.stickCooldown -= dt;
        }

        if (isChopstickInBowl) {
          // If this bean is currently in a momentary cling (一瞬お箸にくっついている状態)
          if (b.stickTimer > 0) {
            b.stickTimer -= dt;
            const tip = tips[b.stickTip];

            // Bean moves closely along with the chopstick (くっついて一緒に移動)
            b.x += csDeltaX * 0.95;
            b.y += csDeltaY * 0.95;
            b.vx = cs.vx * 0.8;
            b.vy = cs.vy * 0.8;

            const distFromTip = Math.hypot(b.x - tip.x, b.y - tip.y);
            // Once timer expires (or pulled too far), it snaps off cleanly (すぐ離れる)
            if (b.stickTimer <= 0 || distFromTip > 24) {
              b.stickTimer = 0;
              b.stickCooldown = 0.28 + Math.random() * 0.16; // Cooldown before it can cling again
              // Subtle flick outward as it releases
              b.vx += (b.x - tip.x) * 1.8;
              b.vy += (b.y - tip.y) * 1.8;
            }
          } else {
            // Direct physical contact resolution with chopsticks
            for (let t = 0; t < tips.length; t++) {
              const tip = tips[t];
              const dx = b.x - tip.x;
              const dy = b.y - tip.y;
              const dist = Math.hypot(dx, dy);
              const contactDist = tipRadius + b.sizeX * 0.95; // Contact distance (approx 18px)

              if (dist < contactDist && dist > 0.001) {
                const overlap = contactDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                // 1. Solid push: push bean out of chopstick volume so they never overlap
                b.x += nx * overlap;
                b.y += ny * overlap;

                // 2. Direct displacement: bean moves forward by the exact displacement of the chopstick
                if (csMoving) {
                  const dot = csDeltaX * nx + csDeltaY * ny;
                  if (dot > 0) {
                    // Chopsticks moving directly against the bean
                    b.x += nx * dot;
                    b.y += ny * dot;
                  } else {
                    // Sticky friction dragging along the moving chopstick surface
                    b.x += csDeltaX * (0.4 + stickinessFactor * 0.35);
                    b.y += csDeltaY * (0.4 + stickinessFactor * 0.35);
                  }

                  // 💡 一瞬お箸にくっついてすぐ離れるトリガー
                  if (b.stickCooldown <= 0 && b.stickTimer <= 0) {
                    // Momentary cling: latches for ~0.10 - 0.16 seconds then snaps free
                    b.stickTimer = 0.10 + Math.random() * 0.06;
                    b.stickTip = t as 0 | 1;
                  }
                }

                // Impart subtle rotational slip and velocity directly from chopstick
                b.vx = cs.vx * 0.6;
                b.vy = cs.vy * 0.6;
                b.vAngle += (Math.random() - 0.5) * 0.3;
              }
            }
          }
        }

        // Gentle cohesive pull to keep natto cluster together without running away
        const pullCoeff = (1.8 + stickinessFactor * 1.2) * dt;
        b.vx += (b.baseX - b.x) * pullCoeff;
        b.vy += (b.baseY - b.y) * pullCoeff;

        // Bean-Bean Soft Contact: Beans pushed by chopsticks gently nudge their immediate neighbors
        const neighborIdx = (i + 1) % beans.length;
        const nb = beans[neighborIdx];
        const ndx = nb.x - b.x;
        const ndy = nb.y - b.y;
        const ndist = Math.hypot(ndx, ndy);
        if (ndist < 16 && ndist > 0.1) {
          const overlap = 16 - ndist;
          if (overlap > 0) {
            const repX = (ndx / ndist) * overlap * 0.10;
            const repY = (ndy / ndist) * overlap * 0.10;
            b.x -= repX;
            b.y -= repY;
            nb.x += repX;
            nb.y += repY;
          }
        }

        // Bowl boundary containment
        const distCenter = Math.hypot(b.x, b.y);
        const maxRadius = innerRadius * 0.84;
        if (distCenter > maxRadius) {
          const pushBack = (distCenter - maxRadius) * 4;
          b.vx -= (b.x / distCenter) * pushBack;
          b.vy -= (b.y / distCenter) * pushBack;
        }

        // Viscous damping: stops cleanly when chopsticks stop
        const isStirringActive = isTouchActive && (cs.isStirring || cs.stirSpeed > 0.3);
        const nattoDamping = isStirringActive
          ? (0.80 - stickinessFactor * 0.05)
          : 0.45;

        b.vx *= nattoDamping;
        b.vy *= nattoDamping;
        b.vAngle *= isStirringActive ? 0.75 : 0.35;

        // Speed limit
        const curSpeed = Math.hypot(b.vx, b.vy);
        const maxBeanSpeed = 22;
        if (curSpeed > maxBeanSpeed) {
          b.vx = (b.vx / curSpeed) * maxBeanSpeed;
          b.vy = (b.vy / curSpeed) * maxBeanSpeed;
        }

        if (!isStirringActive && curSpeed < 1.5) {
          b.vx = 0;
          b.vy = 0;
          b.vAngle = 0;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.angle += b.vAngle * dt;
      }

      // -------------------------------------------------------------
      // 2. TOPPINGS PHYSICS UPDATE (Direct Contact with Chopsticks)
      // -------------------------------------------------------------
      const isStirringActive = isTouchActive && (cs.isStirring || cs.stirSpeed > 0.3);
      toppings.forEach((t) => {
        if (isChopstickInBowl) {
          for (let p = 0; p < tips.length; p++) {
            const tip = tips[p];
            const dx = t.x - tip.x;
            const dy = t.y - tip.y;
            const dist = Math.hypot(dx, dy);
            const contactDist = tipRadius + (t.type === 'egg' ? 24 : 10);

            if (dist < contactDist && dist > 0.001) {
              const overlap = contactDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              t.x += nx * overlap * 0.8;
              t.y += ny * overlap * 0.8;

              if (csMoving) {
                t.x += csDeltaX * 0.5;
                t.y += csDeltaY * 0.5;
              }

              t.vx = cs.vx * 0.4;
              t.vy = cs.vy * 0.4;
              t.angle += (Math.random() - 0.5) * 0.05;
            }
          }
        }

        // Keep egg yolk anchored near center
        if (t.type === 'egg') {
          t.vx += -t.x * 2.5 * dt;
          t.vy += (-4 - t.y) * 2.5 * dt;
        }

        const distCenter = Math.hypot(t.x, t.y);
        const maxRadius = innerRadius * 0.82;
        if (distCenter > maxRadius) {
          t.vx -= (t.x / distCenter) * (distCenter - maxRadius) * 3;
          t.vy -= (t.y / distCenter) * (distCenter - maxRadius) * 3;
        }

        const toppingDamping = isStirringActive ? 0.82 : 0.48;
        t.vx *= toppingDamping;
        t.vy *= toppingDamping;

        const topSpeed = Math.hypot(t.vx, t.vy);
        if (topSpeed > 20) {
          t.vx = (t.vx / topSpeed) * 20;
          t.vy = (t.vy / topSpeed) * 20;
        }

        if (!isStirringActive && topSpeed < 2.0) {
          t.vx = 0;
          t.vy = 0;
        }

        t.x += t.vx * dt;
        t.y += t.vy * dt;
      });

      // -------------------------------------------------------------
      // 3. THREADS UPDATE & BOUNDARY CLAMP
      // -------------------------------------------------------------
      const targetThreadCount = Math.min(
        54,
        stirCount === 0 ? 0 : Math.floor(4 + Math.pow(stirCount, 0.6) * 1.5)
      );
      const maxThreadStretch = 60 + Math.pow(stirCount, 0.78) * 15;

      while (threads.length < targetThreadCount && beans.length > 0) {
        const randBean = beans[Math.floor(Math.random() * beans.length)];
        const tipIdx = Math.random() > 0.5 ? 1 : 0;
        const pointsCount = 6;
        const pts = [];
        for (let p = 0; p < pointsCount; p++) {
          pts.push({
            x: bowlCenterX + randBean.x,
            y: bowlCenterY + randBean.y,
            vx: 0,
            vy: 0,
          });
        }

        threads.push({
          id: Math.random(),
          beanId: randBean.id,
          chopstickTipIndex: tipIdx,
          points: pts,
          thickness: 0.8 + Math.random() * (1.2 + Math.min(2.5, stirCount * 0.01)),
          dropletT: Math.random(),
          dropletSpeed: 0.15 + Math.random() * 0.25,
          hasDroplet: Math.random() < 0.6,
          opacity: 0.6 + Math.random() * 0.35,
          wobblePhase: Math.random() * Math.PI * 2,
        });
      }

      if (threads.length > targetThreadCount) {
        threads.splice(targetThreadCount);
      }

      // Update points positions with strict boundary clamping
      threads.forEach((th, idx) => {
        const bean = beans.find((b) => b.id === th.beanId) || beans[0];
        if (!bean) return;

        const anchorX = bowlCenterX + bean.x;
        const anchorY = bowlCenterY + bean.y;

        const tipX = th.chopstickTipIndex === 0 ? tip1X : tip2X;
        const tipY = th.chopstickTipIndex === 0 ? tip1Y : tip2Y;

        const totalDist = Math.hypot(tipX - anchorX, tipY - anchorY);

        if (totalDist > maxThreadStretch * 1.5) {
          th.beanId = beans[Math.floor(Math.random() * beans.length)].id;
        }

        th.wobblePhase += dt * (3 + cs.stirSpeed * 1.2);
        // Tame wobble amount so fast stirring never explodes threads outside the bowl
        const wobbleAmount = Math.sin(th.wobblePhase + idx) * Math.min(6.5, 1.2 + totalDist * 0.012);

        const numPts = th.points.length;
        for (let p = 0; p < numPts; p++) {
          const t = p / (numPts - 1);
          let ptX = anchorX + (tipX - anchorX) * t;
          let ptY = anchorY + (tipY - anchorY) * t;

          // Natural sag and gentle lateral wobble
          const sag = Math.sin(t * Math.PI) * Math.min(12, 2 + totalDist * 0.025);
          const lateralWobble = Math.sin(t * Math.PI * 2 + th.wobblePhase) * wobbleAmount * (1 - t);

          ptX += lateralWobble;
          ptY += sag;

          // Strict Bowl Interior Clamping
          const relPtX = ptX - bowlCenterX;
          const relPtY = ptY - bowlCenterY;

          if (liftRatio < 0.1) {
            // Inside bowl: strictly clamped inside inner ellipse (rx = innerRadius * 0.85, ry = innerRadius * 0.75)
            const radX = innerRadius * 0.85;
            const radY = innerRadius * 0.74;
            const distRatio = (relPtX * relPtX) / (radX * radX) + (relPtY * relPtY) / (radY * radY);
            if (distRatio > 1.0) {
              const scale = 1.0 / Math.sqrt(distRatio);
              ptX = bowlCenterX + relPtX * scale;
              ptY = bowlCenterY + relPtY * scale;
            }
          } else {
            // Lifted state: taper towards chopstick tips, bowl level remains clamped
            if (ptY >= bowlCenterY - 10) {
              const radX = innerRadius * 0.85;
              const radY = innerRadius * 0.74;
              const distRatio = (relPtX * relPtX) / (radX * radX) + (relPtY * relPtY) / (radY * radY);
              if (distRatio > 1.0) {
                const scale = 1.0 / Math.sqrt(distRatio);
                ptX = bowlCenterX + relPtX * scale;
                ptY = bowlCenterY + relPtY * scale;
              }
            } else {
              // Up in the air: constrain within conical frustum towards chopstick tip
              const liftDistTotal = Math.max(10, bowlCenterY - Math.min(tip1Y, tip2Y));
              const heightFrac = Math.max(0, Math.min(1, (bowlCenterY - ptY) / liftDistTotal));
              const maxAllowedR = (1 - heightFrac) * (innerRadius * 0.82) + heightFrac * 18;
              const currentAxisX = bowlCenterX + (cs.x * heightFrac);
              const dxFromAxis = ptX - currentAxisX;
              if (Math.abs(dxFromAxis) > maxAllowedR) {
                ptX = currentAxisX + Math.sign(dxFromAxis) * maxAllowedR;
              }
            }
          }

          th.points[p].x = ptX;
          th.points[p].y = ptY;
        }
      });

      // -------------------------------------------------------------
      // 4. DRAW BOWL & SHADOW
      // -------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        bowlCenterX,
        bowlCenterY + bowlRadius * 0.72,
        bowlRadius * 1.05,
        bowlRadius * 0.45,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.filter = 'blur(16px)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

      // Outer Bowl Body
      const bowlGrad = ctx.createRadialGradient(
        bowlCenterX - bowlRadius * 0.3,
        bowlCenterY - bowlRadius * 0.2,
        bowlRadius * 0.2,
        bowlCenterX,
        bowlCenterY,
        bowlRadius * 1.12
      );
      bowlGrad.addColorStop(0, '#332f2c');
      bowlGrad.addColorStop(0.5, '#201d1b');
      bowlGrad.addColorStop(0.9, '#141210');
      bowlGrad.addColorStop(1, '#0a0908');

      ctx.beginPath();
      ctx.arc(bowlCenterX, bowlCenterY, bowlRadius, 0, Math.PI * 2);
      ctx.fillStyle = bowlGrad;
      ctx.fill();

      // Ceramic Rim Ring
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#4a433e';
      ctx.stroke();

      // Rim top highlight
      ctx.beginPath();
      ctx.arc(bowlCenterX, bowlCenterY, bowlRadius - 1, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();

      // Interior Bowl Cavity
      const innerGrad = ctx.createRadialGradient(
        bowlCenterX,
        bowlCenterY - 15,
        innerRadius * 0.1,
        bowlCenterX,
        bowlCenterY,
        innerRadius
      );
      innerGrad.addColorStop(0, '#2b231d');
      innerGrad.addColorStop(0.7, '#1d1713');
      innerGrad.addColorStop(1, '#110d0a');

      ctx.beginPath();
      ctx.arc(bowlCenterX, bowlCenterY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Helper to draw threads
      const drawThreads = () => {
        threads.forEach((th, idx) => {
          const numPts = th.points.length;
          if (numPts < 2) return;

          ctx.beginPath();
          ctx.moveTo(th.points[0].x, th.points[0].y);
          for (let p = 1; p < numPts - 1; p++) {
            const xc = (th.points[p].x + th.points[p + 1].x) * 0.5;
            const yc = (th.points[p].y + th.points[p + 1].y) * 0.5;
            ctx.quadraticCurveTo(th.points[p].x, th.points[p].y, xc, yc);
          }
          ctx.lineTo(th.points[numPts - 1].x, th.points[numPts - 1].y);

          const tipX = th.chopstickTipIndex === 0 ? tip1X : tip2X;
          const tipY = th.chopstickTipIndex === 0 ? tip1Y : tip2Y;
          const totalDist = Math.hypot(tipX - th.points[0].x, tipY - th.points[0].y);

          const stretchRatio = Math.min(3, totalDist / 120);
          const effectiveThickness = Math.max(0.6, th.thickness / (1 + stretchRatio * 0.4));
          const threadAlpha = Math.min(0.95, th.opacity * (1 + stirCount * 0.002));

          ctx.lineWidth = effectiveThickness + 1.2;
          ctx.strokeStyle = `rgba(255, 252, 235, ${threadAlpha * 0.55})`;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.lineWidth = effectiveThickness;
          ctx.strokeStyle = `rgba(255, 255, 255, ${threadAlpha * 0.92})`;
          ctx.stroke();

          // Droplet sliding down string from chopstick tip toward bean (gravity-driven downward)
          if (th.hasDroplet) {
            th.dropletT += dt * th.dropletSpeed * (1 + totalDist * 0.0015);
            if (th.dropletT > 1) {
              th.dropletT = 0;
            }

            // progress: 0 = at chopstick tip (top), 1 = at bean (bottom)
            const progress = th.dropletT;
            // th.points[0] is at bean (bottom) and th.points[numPts - 1] is at chopstick tip (top).
            // To slide downward from top to bottom, reverse the index mapping:
            const reversedFloat = (1 - progress) * (numPts - 1);
            const segIdx = Math.min(numPts - 2, Math.max(0, Math.floor(reversedFloat)));
            const segT = reversedFloat - segIdx;
            const p1 = th.points[segIdx];
            const p2 = th.points[segIdx + 1];

            if (p1 && p2) {
              const dropX = p1.x + (p2.x - p1.x) * segT;
              const dropY = p1.y + (p2.y - p1.y) * segT;
              const dropRadius = effectiveThickness * (1.3 + Math.sin(progress * Math.PI) * 1.6);

              ctx.beginPath();
              ctx.arc(dropX, dropY, Math.max(1.3, dropRadius), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 250, ${threadAlpha * 0.95})`;
              ctx.fill();
            }
          }

          // Bridge strings between chopstick tips
          if (idx === 0 && stirCount > 25) {
            ctx.beginPath();
            ctx.moveTo(tip1X, tip1Y);
            const midX = (tip1X + tip2X) * 0.5;
            const midY = (tip1Y + tip2Y) * 0.5 + 4;
            ctx.quadraticCurveTo(midX, midY, tip2X, tip2Y);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();
          }
        });
      };

      // Clip inside bowl for food contents
      ctx.save();
      ctx.beginPath();
      ctx.arc(bowlCenterX, bowlCenterY, innerRadius - 1, 0, Math.PI * 2);
      ctx.clip();

      // -------------------------------------------------------------
      // 5. DRAW BEANS (器の中の豆)
      // -------------------------------------------------------------
      beans.forEach((b) => {
        // If lifted up and still clinging / falling in mid-air, skip rendering inside bowl
        if (liftRatio > 0.05 && b.liftedCling > 0 && stirCount > 8 && !b.isFallen) {
          return;
        }

        ctx.save();
        ctx.translate(bowlCenterX + b.x, bowlCenterY + b.y);
        ctx.rotate(b.angle);

        // Bean shadow
        ctx.beginPath();
        ctx.ellipse(1.5, 2.5, b.sizeX * 0.95, b.sizeY * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 5, 2, 0.4)';
        ctx.fill();

        // Bean body gradient
        const beanGrad = ctx.createRadialGradient(
          -b.sizeX * 0.25,
          -b.sizeY * 0.3,
          1,
          0,
          0,
          b.sizeX
        );
        if (b.shade < 0.33) {
          beanGrad.addColorStop(0, '#b46d23');
          beanGrad.addColorStop(0.6, '#8b4b12');
          beanGrad.addColorStop(1, '#5a2e09');
        } else if (b.shade < 0.66) {
          beanGrad.addColorStop(0, '#c77d2c');
          beanGrad.addColorStop(0.55, '#9a5316');
          beanGrad.addColorStop(1, '#66340c');
        } else {
          beanGrad.addColorStop(0, '#a55e1c');
          beanGrad.addColorStop(0.65, '#7b3e0e');
          beanGrad.addColorStop(1, '#4f2508');
        }

        ctx.beginPath();
        ctx.ellipse(0, 0, b.sizeX, b.sizeY, 0, 0, Math.PI * 2);
        ctx.fillStyle = beanGrad;
        ctx.fill();

        // Bean hilum groove
        ctx.beginPath();
        ctx.ellipse(0, 0, b.sizeX * 0.42, 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 20, 5, 0.75)';
        ctx.fill();

        // Specular sticky shine
        ctx.beginPath();
        ctx.ellipse(-b.sizeX * 0.35, -b.sizeY * 0.35, b.sizeX * 0.35, b.sizeY * 0.25, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 245, 220, 0.45)';
        ctx.fill();

        ctx.restore();
      });

      // -------------------------------------------------------------
      // 6. DRAW TOPPINGS (薬味)
      // -------------------------------------------------------------
      toppings.forEach((t) => {
        ctx.save();
        ctx.translate(bowlCenterX + t.x, bowlCenterY + t.y);
        ctx.rotate(t.angle);

        if (t.type === 'negi') {
          ctx.beginPath();
          ctx.ellipse(0, 0, t.size, t.size * 0.65, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#15803d';
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(0, 0, t.size * 0.45, t.size * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#86efac';
          ctx.fill();
        } else if (t.type === 'karashi') {
          ctx.beginPath();
          ctx.arc(0, 0, t.size, 0, Math.PI * 2);
          const karashiGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, t.size);
          karashiGrad.addColorStop(0, '#fef08a');
          karashiGrad.addColorStop(0.5, '#eab308');
          karashiGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = karashiGrad;
          ctx.fill();
        } else if (t.type === 'egg') {
          ctx.beginPath();
          ctx.arc(0, 0, t.size, 0, Math.PI * 2);
          const eggGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, t.size);
          eggGrad.addColorStop(0, '#fed7aa');
          eggGrad.addColorStop(0.35, '#fb923c');
          eggGrad.addColorStop(0.85, '#ea580c');
          eggGrad.addColorStop(1, '#c2410c');
          ctx.fillStyle = eggGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(-t.size * 0.35, -t.size * 0.35, t.size * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        } else if (t.type === 'tare') {
          ctx.beginPath();
          ctx.arc(0, 0, t.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(67, 20, 7, 0.55)';
          ctx.fill();
        }

        ctx.restore();
      });

      // -------------------------------------------------------------
      // 7. DRAW FOAM & BUBBLES (ふわふわ白泡)
      // -------------------------------------------------------------
      if (stirCount > 10) {
        const foamOpacity = Math.min(0.75, (stirCount - 10) * 0.007);
        const foamRadius = Math.min(innerRadius * 0.85, 30 + stirCount * 0.5);

        const frothyGrad = ctx.createRadialGradient(
          bowlCenterX + cs.x * 0.5,
          bowlCenterY + cs.y * 0.5,
          5,
          bowlCenterX,
          bowlCenterY,
          foamRadius
        );
        frothyGrad.addColorStop(0, `rgba(255, 253, 240, ${foamOpacity * 0.95})`);
        frothyGrad.addColorStop(0.5, `rgba(255, 250, 232, ${foamOpacity * 0.65})`);
        frothyGrad.addColorStop(0.85, `rgba(255, 248, 220, ${foamOpacity * 0.3})`);
        frothyGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');

        ctx.beginPath();
        ctx.arc(bowlCenterX, bowlCenterY, foamRadius, 0, Math.PI * 2);
        ctx.fillStyle = frothyGrad;
        ctx.fill();
      }

      const bubbles = bubblesRef.current;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += dt * 60;
        if (b.age > b.maxAge) {
          bubbles.splice(i, 1);
          continue;
        }

        const lifeRatio = 1 - b.age / b.maxAge;
        const currentAlpha = Math.sin(lifeRatio * Math.PI) * b.opacity * 0.85;

        ctx.beginPath();
        ctx.arc(bowlCenterX + b.x, bowlCenterY + b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 254, 245, ${currentAlpha * 0.7})`;
        ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          bowlCenterX + b.x - b.radius * 0.3,
          bowlCenterY + b.y - b.radius * 0.3,
          Math.max(0.6, b.radius * 0.25),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      }

      // If in bowl stirring mode (liftRatio < 0.08), draw threads strictly INSIDE bowl clip!
      if (liftRatio < 0.08) {
        drawThreads();

        // Draw momentary clinging micro-threads (一瞬お箸にくっついている時のネバネバ引き糸)
        if (stirCount > 4) {
          ctx.beginPath();
          let hasClingThreads = false;
          beans.forEach((b) => {
            if (b.stickTimer > 0) {
              const tipX = b.stickTip === 0 ? tip1X : tip2X;
              const tipY = b.stickTip === 0 ? tip1Y : tip2Y;
              const beanCanvasX = bowlCenterX + b.x;
              const beanCanvasY = bowlCenterY + b.y;
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(beanCanvasX, beanCanvasY);
              hasClingThreads = true;
            }
          });
          if (hasClingThreads) {
            ctx.lineWidth = 1.3;
            ctx.strokeStyle = 'rgba(255, 255, 245, 0.8)';
            ctx.stroke();
          }
        }
      }

      ctx.restore(); // End bowl clip

      // If lifted high (liftRatio >= 0.08), draw threads extending up into the air
      if (liftRatio >= 0.08) {
        drawThreads();
      }

      // -------------------------------------------------------------
      // 8. DRAW LIFTED BEANS (お箸に連れ立って持ち上がり、ゆっくり落ちていく豆)
      // -------------------------------------------------------------
      if (liftRatio > 0.05 && stirCount > 8) {
        beans.forEach((b) => {
          if (b.liftedCling <= 0 || b.isFallen) return;

          const tipX = b.clingTipIndex === 0 ? tip1X : tip2X;
          const tipY = b.clingTipIndex === 0 ? tip1Y : tip2Y;

          // Dropping strictly straight down (真下)
          const startLx = tipX + b.clingOffsetX;
          const startLy = tipY + b.clingOffsetY + (1 - b.liftedCling) * (bowlCenterY - tipY) * 0.10;
          // Target landing point directly below the chopstick tip in bowl
          const targetLandingY = bowlCenterY + cs.y * 0.5 + b.baseY * 0.3;

          // Viscous vertical gravity fall: initial stretch then drops straight down
          const p = Math.max(0, Math.min(1, b.fallProgress));
          const easedP = p < 0.35
            ? 1.3 * p * p
            : 0.159 + 0.841 * Math.pow((p - 0.35) / 0.65, 1.8);

          // X coordinate is locked directly below chopstick tip (真下に落下)
          const lx = startLx;
          const ly = startLy + easedP * (targetLandingY - startLy);

          // If bean is actively sliding down, draw a straight vertical trailing string
          if (p > 0.02 && p < 0.98) {
            ctx.beginPath();
            ctx.moveTo(startLx, tipY);
            ctx.lineTo(lx, ly);
            const stretchThick = Math.max(0.6, (1 - p) * 1.6);
            ctx.lineWidth = stretchThick;
            ctx.strokeStyle = `rgba(255, 255, 250, ${Math.max(0.35, 1 - p * 0.55)})`;
            ctx.stroke();
          }

          ctx.save();
          ctx.translate(lx, ly);
          // Subtle vertical elongation when dripping down
          const stretchY = 1 + Math.sin(p * Math.PI) * 0.25;
          const squishX = 1 - Math.sin(p * Math.PI) * 0.12;
          ctx.rotate(b.angle);
          ctx.scale(squishX, stretchY);

          ctx.beginPath();
          ctx.ellipse(1.5, 2.5, b.sizeX * 0.95, b.sizeY * 0.9, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(10, 5, 2, 0.35)';
          ctx.fill();

          const beanGrad = ctx.createRadialGradient(-b.sizeX * 0.25, -b.sizeY * 0.3, 1, 0, 0, b.sizeX);
          beanGrad.addColorStop(0, '#c77d2c');
          beanGrad.addColorStop(0.55, '#9a5316');
          beanGrad.addColorStop(1, '#66340c');

          ctx.beginPath();
          ctx.ellipse(0, 0, b.sizeX, b.sizeY, 0, 0, Math.PI * 2);
          ctx.fillStyle = beanGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(0, 0, b.sizeX * 0.42, 1.2, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(50, 20, 5, 0.75)';
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(-b.sizeX * 0.35, -b.sizeY * 0.35, b.sizeX * 0.35, b.sizeY * 0.25, -0.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 245, 220, 0.55)';
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(0, 0, b.sizeX * 1.15, b.sizeY * 1.2, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();

          // String trailing from lifted bean down towards bowl (drops straight down)
          if (p < 0.85) {
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx, targetLandingY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.stroke();
          }
        });
      }

      // -------------------------------------------------------------
      // 9. DRAW CHOPSTICKS (お箸)
      // -------------------------------------------------------------
      const chopstickLength = Math.max(180, displayHeight * 0.38);
      const angle = cs.angle;

      const drawSingleChopstick = (tipX: number, tipY: number, tipWidth: number, baseWidth: number) => {
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(-angle);

        // Soft drop shadow
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(chopstickLength, 4);
        ctx.lineWidth = baseWidth * 1.2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.filter = 'blur(4px)';
        ctx.stroke();
        ctx.filter = 'none';

        // Tapered chopstick body
        ctx.beginPath();
        ctx.moveTo(0, -tipWidth * 0.5);
        ctx.lineTo(chopstickLength, -baseWidth * 0.5);
        ctx.lineTo(chopstickLength, baseWidth * 0.5);
        ctx.lineTo(0, tipWidth * 0.5);
        ctx.closePath();

        const woodGrad = ctx.createLinearGradient(0, -baseWidth * 0.5, 0, baseWidth * 0.5);
        woodGrad.addColorStop(0, '#fef08a');
        woodGrad.addColorStop(0.3, '#d97706');
        woodGrad.addColorStop(0.7, '#b45309');
        woodGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = woodGrad;
        ctx.fill();

        // Lacquer band
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(chopstickLength * 0.72, -baseWidth * 0.5, chopstickLength * 0.22, baseWidth);

        // Gold lines
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(chopstickLength * 0.71, -baseWidth * 0.5, 2, baseWidth);
        ctx.fillRect(chopstickLength * 0.94, -baseWidth * 0.5, 2, baseWidth);

        // Sticky natto clump on chopstick tip
        if (stirCount > 5) {
          ctx.beginPath();
          ctx.ellipse(2, 0, 8, tipWidth * 1.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 253, 238, 0.85)';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.stroke();
        }

        ctx.restore();
      };

      drawSingleChopstick(tip2X, tip2Y, 3.8, 8.5);
      drawSingleChopstick(tip1X, tip1Y, 3.8, 8.5);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [liftRatio, stirCount]);

  // Touch & Mouse Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // When lifted, disable stirring to prevent unintended taps/stirs while viewing stretch
    if (liftRatio > 0.3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    touchStateRef.current = {
      isDown: true,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      lastTime: performance.now(),
      hasMoved: false,
      totalMoveDist: 0,
    };

    const rightShift = liftRatio * Math.min(220, rect.width * 0.22);
    const bowlCenterX = rect.width * 0.5 + rightShift;
    const bowlCenterY = rect.height * 0.62 + liftRatio * Math.min(80, rect.height * 0.15);
    const bowlRadius = Math.min(140, rect.width * 0.4);
    const innerRadius = bowlRadius * 0.88;

    triggerTapStir(x, y, bowlCenterX, bowlCenterY, innerRadius);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ts = touchStateRef.current;
    if (!ts.isDown) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - ts.lastX;
    const dy = y - ts.lastY;
    const dist = Math.hypot(dx, dy);
    ts.totalMoveDist += dist;

    const rightShift = liftRatio * Math.min(220, rect.width * 0.22);
    const bowlCenterX = rect.width * 0.5 + rightShift;
    const bowlCenterY = rect.height * 0.62 + liftRatio * Math.min(80, rect.height * 0.15);
    const bowlRadius = Math.min(140, rect.width * 0.4);
    const innerRadius = bowlRadius * 0.88;
    const maxReach = innerRadius * 0.68;

    // Swirling / dragging finger in circles
    if (dist > 3) {
      ts.hasMoved = true;
      const cs = chopsticksRef.current;
      cs.isStirring = true;
      cs.stirSpeed = Math.min(cs.stirSpeed + dist * 0.05, 4.2);

      const relX = x - bowlCenterX;
      const relY = y - bowlCenterY;
      const distFromCenter = Math.hypot(relX, relY);

      if (distFromCenter <= maxReach) {
        cs.targetX = relX;
        cs.targetY = relY;
      } else {
        cs.targetX = (relX / distFromCenter) * maxReach;
        cs.targetY = (relY / distFromCenter) * maxReach;
      }

      // Angular stir calculation
      const angleNow = Math.atan2(y - bowlCenterY, x - bowlCenterX);
      let angleDiff = angleNow - cs.lastAngle;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      cs.accumulatedAngle += Math.abs(angleDiff);

      // Trigger stir on continuous rotation
      if (cs.accumulatedAngle >= Math.PI * 0.65) {
        cs.accumulatedAngle = 0;
        onStir(1, cs.stirSpeed > 4.5);
        playStirSound(Math.min(1, 0.45 + stirCount * 0.006));
      }
    }

    ts.lastX = x;
    ts.lastY = y;
  };

  const handlePointerUp = () => {
    touchStateRef.current.isDown = false;
    const cs = chopsticksRef.current;
    cs.isStirring = false;
    cs.stirSpeed = 0;
    cs.vx = 0;
    cs.vy = 0;
    cs.angularVelocity = 0;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        id="natto-interactive-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-pointer active:scale-[0.998] transition-transform duration-75"
        style={{ touchAction: 'none' }}
      />

      {/* Floating Prompt Hint for First Time Players */}
      {stirCount === 0 && (
        <div className="absolute top-[28%] pointer-events-none px-4 py-2 bg-black/65 backdrop-blur-md rounded-full border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium animate-pulse shadow-lg flex items-center gap-2">
          <span>🥢</span>
          <span>お椀をタップまたはグルグルなぞってかき混ぜよう！</span>
        </div>
      )}
    </div>
  );
};
