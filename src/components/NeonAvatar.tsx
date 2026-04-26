'use client';

/**
 * 日系二次元少女线条风头像
 * 极简轮廓线描风格，霓虹发光
 */

function MikuLineArt({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外圈装饰环 */}
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1.2" opacity="0.3"
        strokeDasharray="4 4" />

      {/* 头发 - 双马尾左侧 */}
      <path d="M55 35 C30 25, 15 45, 20 70 C22 82, 30 85, 35 75 C40 65, 38 50, 50 42"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* 头发 - 双马尾右侧 */}
      <path d="M145 35 C168 22, 182 42, 178 68 C176 80, 170 83, 165 73 C162 65, 164 52, 155 44"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* 头发 - 顶部 */}
      <path d="M60 30 C70 18, 90 15, 100 15 C110 15, 130 18, 140 30"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

      {/* 头发 - 刘海 */}
      <path d="M55 38 C58 32, 70 28, 85 30 C90 31, 95 35, 100 35 C105 35, 110 31, 115 30 C130 28, 142 32, 145 38"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />

      {/* 头发 - 侧发左 */}
      <path d="M52 45 C45 55, 42 70, 44 90 C45 100, 48 105, 50 100"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* 头发 - 侧发右 */}
      <path d="M148 45 C155 55, 158 70, 156 90 C155 100, 152 105, 150 100"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* 脸型 */}
      <path d="M58 50 C55 65, 52 85, 58 105 C64 125, 78 140, 100 145 C122 140, 136 125, 142 105 C148 85, 145 65, 142 50"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

      {/* 眼睛 - 左 */}
      <path d="M78 78 C82 72, 92 72, 96 78"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="87" cy="78" r="3" fill="currentColor" opacity="0.7" />

      {/* 眼睛 - 右 */}
      <path d="M104 78 C108 72, 118 72, 122 78"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="113" cy="78" r="3" fill="currentColor" opacity="0.7" />

      {/* 眉毛 - 左 */}
      <path d="M80 68 C84 64, 92 64, 95 67"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* 眉毛 - 右 */}
      <path d="M105 67 C108 64, 116 64, 120 68"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* 嘴巴 */}
      <path d="M93 108 C96 113, 104 113, 107 108"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* 腮红 - 左 */}
      <circle cx="72" cy="98" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />

      {/* 腮红 - 右 */}
      <circle cx="128" cy="98" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />

      {/* 发饰 - 花朵左 */}
      <circle cx="56" cy="36" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="56" cy="36" r="2" fill="currentColor" opacity="0.3" />

      {/* 发饰 - 花朵右 */}
      <circle cx="144" cy="36" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="144" cy="36" r="2" fill="currentColor" opacity="0.3" />

      {/* 领口 */}
      <path d="M80 148 C85 155, 95 160, 100 160 C105 160, 115 155, 120 148"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SakuraMikoLineArt({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1.2" opacity="0.3"
        strokeDasharray="4 4" />

      {/* 长发 */}
      <path d="M60 25 C40 30, 25 55, 22 85 C20 110, 25 130, 30 145 C33 155, 38 152, 36 140 C32 120, 30 95, 35 75 C40 58, 50 42, 62 32"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      <path d="M140 25 C160 30, 175 55, 178 85 C180 110, 175 130, 170 145 C167 155, 162 152, 164 140 C168 120, 170 95, 165 75 C160 58, 150 42, 138 32"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* 顶部头发 */}
      <path d="M65 28 C75 18, 95 15, 105 15 C115 15, 130 20, 138 28"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

      {/* 刘海 */}
      <path d="M58 38 C60 32, 70 28, 82 30 C88 31, 94 36, 100 38 C106 36, 112 31, 118 30 C130 28, 140 32, 142 38"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

      {/* 脸 */}
      <path d="M62 48 C56 68, 55 88, 62 108 C70 128, 82 142, 100 146 C118 142, 130 128, 138 108 C145 88, 144 68, 138 48"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

      {/* 眼睛 */}
      <path d="M78 78 C82 72, 92 72, 96 78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="87" cy="78" r="3.5" fill="currentColor" opacity="0.75" />

      <path d="M104 78 C108 72, 118 72, 122 78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="113" cy="78" r="3.5" fill="currentColor" opacity="0.75" />

      {/* 微笑 */}
      <path d="M92 110 C96 115, 104 115, 108 110" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

      {/* 腮红 */}
      <circle cx="72" cy="100" r="8" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />
      <circle cx="128" cy="100" r="8" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />

      {/* 发饰 - 樱花 */}
      <path d="M52 32 C48 28, 52 24, 56 28 C58 26, 62 28, 58 32"
        stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M148 32 C152 28, 148 24, 144 28 C142 26, 138 28, 142 32"
        stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function GenericVocaloidLineArt({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1.2" opacity="0.25"
        strokeDasharray="3 5" />

      {/* 头发 */}
      <path d="M70 25 C90 15, 110 15, 130 25 C142 32, 155 50, 160 70 C165 90, 162 115, 155 135"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M45 55 C40 70, 38 88, 42 105 C45 118, 50 125, 48 120"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

      {/* 刘海 */}
      <path d="M60 35 C62 28, 72 24, 85 26 C92 27, 97 32, 100 35 C103 32, 108 27, 115 26 C128 24, 138 28, 140 35"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

      {/* 脸 */}
      <path d="M62 48 C55 68, 54 90, 62 110 C70 128, 82 140, 100 145 C118 140, 130 128, 138 110 C146 90, 145 68, 138 48"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

      {/* 眼睛 */}
      <path d="M78 75 C82 69, 92 69, 96 75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="87" cy="75" r="3" fill="currentColor" opacity="0.7" />
      <path d="M104 75 C108 69, 118 69, 122 75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="113" cy="75" r="3" fill="currentColor" opacity="0.7" />

      {/* 嘴巴 */}
      <path d="M94 106 C97 110, 103 110, 106 106" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />

      {/* 音符装饰 */}
      <path d="M38 50 L38 35 L42 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <circle cx="40" cy="52" r="4" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
      <path d="M158 45 L158 30 L162 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <circle cx="160" cy="47" r="4" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
    </svg>
  );
}

interface Props {
  size?: number;
  seed?: string;
  style?: 'miku' | 'sakura' | 'vocaloid';
}

export function NeonAvatar({
  size = 120,
  seed = 'VOCALOID',
  style = 'vocaloid',
}: Props) {
  const getColor = () => {
    switch (style) {
      case 'miku': return '#06D6D4';   // 初音青
      case 'sakura': return '#FF3399';  // 樱粉色
      case 'vocaloid': return '#A032DC'; // 紫
    }
  };

  const color = getColor();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${color}44`,
        boxShadow: `0 0 20px ${color}22, 0 0 40px ${color}11, inset 0 0 20px ${color}11`,
        animation: 'glow-pulse 3s ease-in-out infinite',
        color,
        overflow: 'hidden',
      }}
    >
      {style === 'miku' && <MikuLineArt size={size * 0.85} />}
      {style === 'sakura' && <SakuraMikoLineArt size={size * 0.85} />}
      {style === 'vocaloid' && <GenericVocaloidLineArt size={size * 0.85} />}
    </div>
  );
}

export function NeonAvatarGroup({ size = 70 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap opacity-60 hover:opacity-90 transition-all">
      <NeonAvatar size={size} seed="初音未来" style="miku" />
      <NeonAvatar size={size} seed="洛天依" style="sakura" />
      <NeonAvatar size={size} seed="星尘" style="vocaloid" />
      <NeonAvatar size={size * 0.9} seed="镜音铃" style="sakura" />
      <NeonAvatar size={size * 0.9} seed="GUMI" style="miku" />
      <NeonAvatar size={size * 0.9} seed="乐正绫" style="vocaloid" />
    </div>
  );
}
