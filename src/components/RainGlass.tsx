'use client';

/**
 * Rain-on-glass overlay.
 * Drop field adapted from "Heartfelt" by Martijn Steinrucken (BigWings), 2017
 * CC BY-NC-SA 3.0 — https://www.shadertoy.com/view/ltffzl
 * (no heart story, no scene texture; fog + sliding drops + trails only)
 */

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/components/motion/usePrefersReducedMotion';

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_rain;
uniform float u_light;

vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float N(float t) {
  return fract(sin(t * 12345.564) * 7658.76);
}

float Saw(float b, float t) {
  return smoothstep(0.0, b, t) * smoothstep(1.0, b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
  vec2 UV = uv;
  uv.y += t * 0.75;
  vec2 a = vec2(6.0, 1.0);
  vec2 grid = a * 2.0;
  vec2 id = floor(uv * grid);

  float colShift = N(id.x);
  uv.y += colShift;

  id = floor(uv * grid);
  vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
  vec2 st = fract(uv * grid) - vec2(0.5, 0.0);

  float x = n.x - 0.5;
  float y = UV.y * 20.0;
  float wiggle = sin(y + sin(y));
  x += wiggle * (0.5 - abs(x)) * (n.z - 0.5);
  x *= 0.7;
  float ti = fract(t + n.z);
  y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
  vec2 p = vec2(x, y);

  float d = length((st - p) * a.yx);
  float mainDrop = smoothstep(0.4, 0.0, d);

  float r = sqrt(smoothstep(1.0, y, st.y));
  float cd = abs(st.x - x);
  float trail = smoothstep(0.23 * r, 0.15 * r * r, cd);
  float trailFront = smoothstep(-0.02, 0.02, st.y - y);
  trail *= trailFront * r * r;

  float trail2 = smoothstep(0.2 * r, 0.0, cd);
  y = fract(UV.y * 10.0) + (st.y - 0.5);
  float dd = length(st - vec2(x, y));
  float droplets = smoothstep(0.3, 0.0, dd);
  float m = mainDrop + droplets * r * trailFront * trail2;

  return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
  uv *= 40.0;
  vec2 id = floor(uv);
  uv = fract(uv) - 0.5;
  vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - 0.5) * 0.7;
  float d = length(uv - p);
  float fade = Saw(0.025, fract(t + n.z));
  return smoothstep(0.3, 0.0, d) * fract(n.z * 10.0) * fade;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
  float s = StaticDrops(uv, t) * l0;
  vec2 m1 = DropLayer2(uv, t) * l1;
  vec2 m2 = DropLayer2(uv * 1.85, t) * l2;
  float c = s + m1.x + m2.x;
  c = smoothstep(0.3, 1.0, c);
  return vec2(c, max(m1.y * l0, m2.y * l1));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * u_res) / u_res.y;
  float T = u_time;
  float t = T * 0.2;
  float rainAmount = u_rain;

  float staticDrops = smoothstep(-0.5, 1.0, rainAmount) * 2.0;
  float layer1 = smoothstep(0.25, 0.75, rainAmount);
  float layer2 = smoothstep(0.0, 0.5, rainAmount);

  vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
  vec2 e = vec2(0.001, 0.0);
  float cx = Drops(uv + e, t, staticDrops, layer1, layer2).x;
  float cy = Drops(uv + e.yx, t, staticDrops, layer1, layer2).x;
  vec2 n = vec2(cx - c.x, cy - c.x);

  float drop = smoothstep(0.15, 1.0, c.x);
  float trail = clamp(c.y, 0.0, 1.0);

  vec3 N = normalize(vec3(n * 60.0, 0.12));
  vec3 L = normalize(vec3(-0.25, 0.55, 0.8));
  float spec = pow(max(0.0, dot(N, L)), 42.0);
  float rim = pow(1.0 - max(0.0, N.z), 3.0) * drop;

  float fog = mix(0.10, 0.018, trail);
  fog *= mix(1.0, 0.55, u_light);

  vec3 glass = mix(vec3(0.62, 0.82, 1.0), vec3(0.95, 0.97, 1.0), u_light);
  vec3 col = glass * (fog * 0.9 + drop * 0.22 + spec * 1.8 + rim * 0.35);

  float alpha = fog + drop * 0.16 + spec * 0.55 + trail * 0.04;
  alpha = clamp(alpha, 0.0, 0.42);

  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function RainGlass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRain = gl.getUniformLocation(prog, 'u_rain');
    const uLight = gl.getUniformLocation(prog, 'u_light');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let running = true;
    const t0 = performance.now();

    const resize = () => {
      const scale = 0.55;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(2, Math.floor(window.innerWidth * scale * dpr));
      const h = Math.max(2, Math.floor(window.innerHeight * scale * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      if (!running) return;
      resize();
      const light = document.documentElement.dataset.theme === 'light' ? 1 : 0;
      const time = reduce ? 12.4 : (performance.now() - t0) * 0.001;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uRain, reduce ? 0.35 : 0.62);
      gl.uniform1f(uLight, light);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [reduce]);

  return (
    <div className="rain-glass" aria-hidden="true">
      <canvas ref={canvasRef} className="rain-glass-drops" />
    </div>
  );
}
