/**
 * 霓虹线条二次元人物头像
 * SVG 描边动画 + 霓虹发光效果
 */
export function NeonAvatar({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 20px rgba(6,210,240,0.3))' }}
    >
      {/* 外圈装饰光环 */}
      <circle
        cx="100" cy="100" r="95"
        stroke="url(#neonGrad)"
        strokeWidth="1.5"
        opacity="0.4"
        strokeDasharray="600"
        strokeDashoffset="600"
        className="neon-svg-stroke"
        style={{ animationDelay: '3.5s', animationDuration: '2s' }}
      />

      {/* 头发 - 主体 */}
      <path
        d="M70 30 C40 40, 20 70, 20 100
           C20 130, 30 155, 40 170
           C38 150, 35 130, 38 110
           C40 95, 45 80, 55 70
           L60 55 L65 45 L70 30Z"
        stroke="rgb(6, 210, 240)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        className="neon-svg-stroke"
        style={{ animationDelay: '0s' }}
      />

      {/* 头发 - 刘海 */}
      <path
        d="M65 45 C70 35, 80 28, 95 25
           C105 23, 115 25, 125 30
           C135 35, 140 45, 145 55"
        stroke="rgb(160, 50, 220)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
        className="neon-svg-stroke"
        style={{ animationDelay: '0.3s' }}
      />

      {/* 头发 - 侧发 */}
      <path
        d="M50 55 C42 55, 35 65, 30 80
           C28 90, 28 100, 30 110"
        stroke="rgb(6, 210, 240)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
        className="neon-svg-stroke"
        style={{ animationDelay: '0.6s' }}
      />

      {/* 脸型轮廓 */}
      <path
        d="M55 50 C55 50, 60 45, 70 42
           C80 39, 90 38, 100 38
           C115 38, 130 42, 140 52
           C150 62, 155 78, 155 95
           C155 112, 150 128, 140 140
           C130 152, 115 158, 100 160
           C85 158, 70 152, 60 140
           C50 128, 45 112, 45 95
           C45 78, 48 62, 55 50Z"
        stroke="rgb(255, 255, 255)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.6"
        className="neon-svg-stroke"
        style={{ animationDelay: '0.8s' }}
      />

      {/* 发饰 - 蝴蝶结 */}
      <path
        d="M130 30 C135 22, 145 20, 148 28
           C151 36, 142 40, 142 40
           C142 40, 148 32, 144 28
           C140 24, 133 26, 130 30Z"
        stroke="rgb(255, 50, 150)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
        className="neon-svg-stroke"
        style={{ animationDelay: '1.2s' }}
      />

      {/* 发饰飘带 */}
      <path
        d="M145 35 C150 42, 155 50, 152 58"
        stroke="rgb(255, 50, 150)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        className="neon-svg-stroke"
        style={{ animationDelay: '1.4s' }}
      />

      {/* 眼睛 - 左 */}
      <path
        d="M80 80 C85 75, 95 75, 100 80"
        stroke="rgb(6, 210, 240)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className="neon-svg-stroke"
        style={{ animationDelay: '1.8s' }}
      />

      {/* 眼睛 - 右 */}
      <path
        d="M115 78 C120 73, 130 73, 135 78"
        stroke="rgb(255, 50, 150)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className="neon-svg-stroke"
        style={{ animationDelay: '2s' }}
      />

      {/* 眼睛瞳孔 - 左 */}
      <circle
        cx="90" cy="80" r="3"
        fill="rgb(6, 210, 240)"
        opacity="0"
        style={{ animation: 'glow-breathe 2s ease-in-out infinite 3s', animationFillMode: 'forwards' }}
      />

      {/* 眼睛瞳孔 - 右 */}
      <circle
        cx="125" cy="78" r="3"
        fill="rgb(255, 50, 150)"
        opacity="0"
        style={{ animation: 'glow-breathe 2s ease-in-out infinite 3.2s', animationFillMode: 'forwards' }}
      />

      {/* 嘴巴 - 微笑 */}
      <path
        d="M90 120 C95 128, 105 128, 110 120"
        stroke="rgb(255, 200, 50)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
        className="neon-svg-stroke"
        style={{ animationDelay: '2.3s' }}
      />

      {/* 腮红 - 左 */}
      <circle
        cx="70" cy="105" r="8"
        stroke="rgb(255, 50, 150)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        strokeDasharray="50"
        strokeDashoffset="50"
        className="neon-svg-stroke"
        style={{ animationDelay: '2.6s', animationDuration: '1.5s' }}
      />

      {/* 腮红 - 右 */}
      <circle
        cx="135" cy="103" r="8"
        stroke="rgb(255, 50, 150)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        strokeDasharray="50"
        strokeDashoffset="50"
        className="neon-svg-stroke"
        style={{ animationDelay: '2.8s', animationDuration: '1.5s' }}
      />

      {/* 领口 / 服装 */}
      <path
        d="M75 158 C80 165, 90 170, 100 170
           C110 170, 120 165, 125 158"
        stroke="rgb(160, 50, 220)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        className="neon-svg-stroke"
        style={{ animationDelay: '3s' }}
      />

      {/* 渐变定义 */}
      <defs>
        <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(6, 210, 240)" />
          <stop offset="50%" stopColor="rgb(255, 50, 150)" />
          <stop offset="100%" stopColor="rgb(160, 50, 220)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
