'use client';

/**
 * 二次元风格头像（来自 DiceBear 开源 API）
 * 用霓虹光效边框包裹，风格为 notionists / big-smile / adventurer
 */

const AVATAR_STYLES = [
  { name: 'big-smile', label: '动漫风' },
  { name: 'notionists', label: '现代风' },
  { name: 'adventurer', label: '冒险风' },
  { name: 'lorelei', label: '可爱风' },
  { name: 'fun-emoji', label: '卡通风' },
] as const;

type AvatarStyle = (typeof AVATAR_STYLES)[number]['name'];

interface Props {
  size?: number;
  seed?: string;
  style?: AvatarStyle;
}

export function NeonAvatar({
  size = 120,
  seed = '初音未来',
  style = 'big-smile',
}: Props) {
  const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

  return (
    <div
      className="neon-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size > 80 ? '2rem' : '1rem',
        overflow: 'hidden',
      }}
      title={`${seed} (${AVATAR_STYLES.find(s => s.name === style)?.label})`}
    >
      <img
        src={avatarUrl}
        alt={`${seed} avatar`}
        className="w-full h-full object-cover"
        style={{ filter: 'brightness(1.1) contrast(1.1)' }}
        loading="lazy"
        onError={(e) => {
          // Fallback: 如果图片加载失败，显示音乐符号
          const target = e.currentTarget;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.textContent = '♪';
          }
        }}
      />
    </div>
  );
}

/**
 * 多个风格随机展示的头像组（适合大区域装饰）
 */
export function NeonAvatarGroup({ size = 80 }: { size?: number }) {
  const seeds = ['初音未来', '洛天依', '星尘', '镜音铃', 'GUMI', '乐正绫'];
  const styles: AvatarStyle[] = ['big-smile', 'notionists', 'lorelei', 'adventurer', 'fun-emoji', 'big-smile'];

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap opacity-60 hover:opacity-90 transition-all">
      {seeds.map((seed, i) => (
        <div key={seed} className="relative group">
          <NeonAvatar
            size={size}
            seed={seed}
            style={styles[i]}
          />
          <p className="text-[8px] text-gray-600 text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {seed}
          </p>
        </div>
      ))}
    </div>
  );
}
