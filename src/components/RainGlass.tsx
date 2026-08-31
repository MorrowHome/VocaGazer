'use client';

/**
 * Background rain-on-glass.
 * Drop field + fog/trails from "Heartfelt" by Martijn Steinrucken (BigWings),
 * CC BY-NC-SA 3.0 — https://www.shadertoy.com/view/ltffzl
 *
 * Uses textureLod like the original: drops refract the sky, trails wipe fog.
 * No HAS_HEART story, no zoom pulse, no fade-to-black, no lightning.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePrefersReducedMotion } from '@/components/motion/usePrefersReducedMotion';
import { getRainTune, rainTargetFromScroll, RainTunePanel, setLiveRainAmount, spawnSecondsNow } from '@/components/RainTune';
import { rainTextureSrc } from '@/lib/scene';

const VERT = `#version 300 es
in vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_time;
uniform float u_rain;
uniform float u_spawn;

out vec4 fragColor;

#define S(a, b, t) smoothstep(a, b, t)

vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float N(float t) {
  return fract(sin(t * 12345.564) * 7658.76);
}

float Saw(float b, float t) {
  return S(0., b, t) * S(1., b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
  vec2 UV = uv;

  uv.y += t * 0.75;
  vec2 a = vec2(6., 1.);
  vec2 grid = a * 2.;
  vec2 id = floor(uv * grid);

  float colShift = N(id.x);
  uv.y += colShift;

  id = floor(uv * grid);
  vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
  vec2 st = fract(uv * grid) - vec2(.5, 0);

  float x = n.x - .5;

  float y = UV.y * 20.;
  float wiggle = sin(y + sin(y));
  x += wiggle * (.5 - abs(x)) * (n.z - .5);
  x *= .7;
  float ti = mix(t, fract(t + n.z), S(0.0, max(0.35, u_spawn), u_time));
  y = (Saw(.85, ti) - .5) * .9 + .5;
  vec2 p = vec2(x, y);

  float d = length((st - p) * a.yx);

  float mainDrop = S(.4, .0, d);

  float r = sqrt(S(1., y, st.y));
  float cd = abs(st.x - x);
  float trail = S(.23 * r, .15 * r * r, cd);
  float trailFront = S(-.02, .02, st.y - y);
  trail *= trailFront * r * r;

  y = UV.y;
  float trail2 = S(.2 * r, .0, cd);
  float droplets = max(0., (sin(y * (1. - y) * 120.) - st.y)) * trail2 * trailFront * n.z;
  y = fract(y * 10.) + (st.y - .5);
  float dd = length(st - vec2(x, y));
  droplets = S(.3, 0., dd);
  float m = mainDrop + droplets * r * trailFront;

  return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
  uv *= 40.;

  vec2 id = floor(uv);
  uv = fract(uv) - .5;
  vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - .5) * .7;
  float d = length(uv - p);

  float fade = Saw(.025, fract(t + n.z));
  float c = S(.3, 0., d) * fract(n.z * 10.) * fade;
  return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
  float s = StaticDrops(uv, t) * l0;
  vec2 m1 = DropLayer2(uv, t) * l1;
  vec2 m2 = DropLayer2(uv * 1.85, t) * l2;

  float c = s + m1.x + m2.x;
  c = S(.3, 1., c);

  return vec2(c, max(m1.y * l0, m2.y * l1));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = (fragCoord - .5 * u_res) / u_res.y;
  vec2 UV = fragCoord / u_res;

  float t = u_time * .2;
  float rainAmount = u_rain * S(0.0, max(0.4, u_spawn), u_time);

  float maxBlur = mix(0.0, 6.2, rainAmount);
  float minBlur = mix(0.0, 2.1, rainAmount);

  float staticDrops = S(-.5, 1., rainAmount) * 2. * rainAmount;
  float layer1 = S(.25, .75, rainAmount);
  float layer2 = S(.0, .5, rainAmount);

  vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
  vec2 e = vec2(.001, 0.);
  float cx = Drops(uv + e, t, staticDrops, layer1, layer2).x;
  float cy = Drops(uv + e.yx, t, staticDrops, layer1, layer2).x;
  vec2 n = vec2(cx - c.x, cy - c.x);

  float focus = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x));
  vec3 col = textureLod(u_tex, UV + n, focus).rgb;

  fragColor = vec4(col, 1.);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
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

function rnd(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function paintSky(ctx: CanvasRenderingContext2D, w: number, h: number, light: boolean) {
  const base = ctx.createLinearGradient(0, 0, 0, h);
  if (light) {
    base.addColorStop(0, '#fff8fb');
    base.addColorStop(0.46, '#f7eef6');
    base.addColorStop(1, '#f3eaf4');
  } else {
    base.addColorStop(0, '#0c0a1c');
    base.addColorStop(0.42, '#07060f');
    base.addColorStop(1, '#0a0818');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const bloom = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  if (light) {
    bloom(w * 0.82, h * 0.02, w * 0.72, 'rgba(255,107,157,0.32)');
    bloom(w * 0.08, h * 0.96, w * 0.58, 'rgba(184,160,255,0.2)');
    bloom(w * 0.58, h * 0.78, w * 0.48, 'rgba(255,176,198,0.26)');
    bloom(w * 0.5, h * 0.12, w * 0.62, 'rgba(255,214,226,0.45)');
    bloom(w * 0.28, h * 0.38, w * 0.34, 'rgba(255,186,210,0.18)');
  } else {
    bloom(w * 0.84, h * 0.0, w * 0.78, 'rgba(255,107,157,0.55)');
    bloom(w * 0.04, h * 1.0, w * 0.62, 'rgba(184,160,255,0.38)');
    bloom(w * 0.52, h * 0.78, w * 0.5, 'rgba(255,107,157,0.28)');
    bloom(w * 0.7, h * 0.22, w * 0.4, 'rgba(255,160,190,0.22)');
    bloom(w * 0.3, h * 0.4, w * 0.32, 'rgba(184,160,255,0.16)');
  }

  ctx.globalCompositeOperation = 'lighter';
  const lights = light ? 36 : 52;
  for (let i = 0; i < lights; i++) {
    const x = rnd(i + 1.7) * w;
    const y = rnd(i + 9.3) * h;
    const r = (light ? 18 : 14) + rnd(i + 21.1) * (light ? 70 : 90);
    const pink = rnd(i + 4.2) > 0.45;
    const a = (light ? 0.07 : 0.14) * (0.45 + rnd(i + 6.6) * 0.55);
    const color = pink
      ? `rgba(255, ${light ? 140 : 107}, ${light ? 180 : 157}, ${a})`
      : `rgba(${light ? 196 : 184}, ${light ? 176 : 160}, 255, ${a * 0.85})`;
    bloom(x, y, r, color);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;
  if (ir > cr) {
    dh = h;
    dw = h * ir;
    dx = (w - dw) / 2;
    dy = 0;
  } else {
    dw = w;
    dh = w / ir;
    dx = 0;
    dy = (h - dh) / 2;
  }
  ctx.fillStyle = '#07060f';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function uploadCanvas(
  gl: WebGL2RenderingContext,
  tex: WebGLTexture,
  source: HTMLCanvasElement,
) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);
}

function uploadSky(
  gl: WebGL2RenderingContext,
  tex: WebGLTexture,
  sky: HTMLCanvasElement,
  light: boolean,
) {
  const ctx = sky.getContext('2d');
  if (!ctx) return;
  paintSky(ctx, sky.width, sky.height, light);
  uploadCanvas(gl, tex, sky);
}

function readSceneUrl() {
  const live = document.documentElement.dataset.scene;
  if (live) return live;
  try {
    return sessionStorage.getItem('vg-scene') || '';
  } catch {
    return '';
  }
}

function uploadSceneImage(
  gl: WebGL2RenderingContext,
  tex: WebGLTexture,
  sky: HTMLCanvasElement,
  src: string,
  token: number,
  current: { token: number },
) {
  const img = new Image();
  img.onload = () => {
    if (token !== current.token) return;
    const ctx = sky.getContext('2d');
    if (!ctx) return;
    drawCover(ctx, img, sky.width, sky.height);
    uploadCanvas(gl, tex, sky);
  };
  img.onerror = () => {
    /* keep current texture */
  };
  img.src = rainTextureSrc(src);
}

export function RainGlass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = usePrefersReducedMotion();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const renderer = gl.getParameter(gl.RENDERER) || '';
    if (/SwiftShader|llvmpipe|Software/i.test(String(renderer))) return;

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

    const sky = document.createElement('canvas');
    sky.width = 1920;
    sky.height = 1080;
    const tex = gl.createTexture();
    if (!tex) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) {
      const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }

    const uTex = gl.getUniformLocation(prog, 'u_tex');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRain = gl.getUniformLocation(prog, 'u_rain');
    const uSpawn = gl.getUniformLocation(prog, 'u_spawn');
    gl.uniform1i(uTex, 0);

    let lastLight = document.documentElement.dataset.theme === 'light' ? 1 : 0;
    let lastScene = readSceneUrl();
    const loadGen = { token: 0 };
    uploadSky(gl, tex, sky, lastLight === 1);
    if (lastScene) {
      loadGen.token += 1;
      uploadSceneImage(gl, tex, sky, lastScene, loadGen.token, loadGen);
    }

    let raf = 0;
    let running = true;
    const t0 = performance.now();
    let lastTick = t0;
    let rain = 0;
    let rainAge = 0;
    let lastPath = pathRef.current;
    let clearing = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.floor(window.innerWidth * dpr));
      const h = Math.max(2, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const light = document.documentElement.dataset.theme === 'light' ? 1 : 0;
      const scene = readSceneUrl();
      if (scene !== lastScene) {
        lastScene = scene;
        loadGen.token += 1;
        if (scene) {
          uploadSceneImage(gl, tex, sky, scene, loadGen.token, loadGen);
        } else {
          uploadSky(gl, tex, sky, light === 1);
        }
      } else if (!scene && light !== lastLight) {
        lastLight = light;
        uploadSky(gl, tex, sky, light === 1);
      }
      lastLight = light;
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      const tune = getRainTune();
      if (pathRef.current !== lastPath) {
        lastPath = pathRef.current;
        clearing = rain > 0.015;
        if (!clearing) {
          rain = 0;
          rainAge = 0;
        }
      }
      let target = reduce ? Math.min(0.28, rainTargetFromScroll()) : rainTargetFromScroll();
      let follow = tune.followSeconds;
      if (clearing) {
        if (rain > 0.015) {
          target = 0;
          follow = 0.22;
        } else {
          rain = 0;
          rainAge = 0;
          clearing = false;
          target = reduce ? Math.min(0.28, rainTargetFromScroll()) : rainTargetFromScroll();
        }
      }
      rain += (target - rain) * (1 - Math.exp(-dt / follow));
      if (target <= 0 && rain < 0.008) rainAge = 0;
      else rainAge += dt;
      setLiveRainAmount(rain);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, rainAge);
      gl.uniform1f(uRain, rain);
      gl.uniform1f(uSpawn, spawnSecondsNow());
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduce) {
      tick(t0);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
    };
  }, [reduce]);

  return (
    <>
      <div className="rain-glass" aria-hidden="true">
        <canvas ref={canvasRef} className="rain-glass-drops" />
      </div>
      <RainTunePanel />
    </>
  );
}
