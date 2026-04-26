'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">关于</h1>
      <div className="space-y-4 text-gray-300">
        <p>
          VOCALOID Music Hub 是一个专注于 VOCALOID 原创曲目的数据收集、分析与展示平台。
        </p>
        <p>
          平台每日自动从 B 站 API 抓取新发布的 VOCALOID 音乐，通过科学的评分系统生成排行榜，
          并设有 AI 辅助数据分析和用户社区论坛。
        </p>
        <h2 className="text-xl font-semibold text-white mt-8">技术栈</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Next.js 14 + React 18</li>
          <li>tRPC 类型安全 API</li>
          <li>Prisma + PostgreSQL</li>
          <li>Tailwind CSS</li>
        </ul>
      </div>
    </main>
  );
}
