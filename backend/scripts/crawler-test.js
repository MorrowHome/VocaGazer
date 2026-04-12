/**
 * B站 API 采集原型脚本
 *
 * 目标：验证从 B站 API 获取 VOCALOID 相关视频的可行性
 *
 * 运行方式：node backend/scripts/crawler-test.js
 */

import axios from 'axios';

// 标签列表 - 用于搜索时限定范围
const TAGS = [
  // 核心标签
  'VOCALOID',
  '虚拟歌手',
  '术力口',
  'UTAU',
  'VOICEVOX',
  'CeVIO',
  'SynthesizerV',
  // 中文VOCALOID
  '中文VOCALOID',
  '中文术力口',
  '中文虚拟歌手',
  // 角色标签
  '洛天依',
  '言和',
  '乐正绫',
  '星尘',
  '镜音铃',
  '镜音连',
  '初音未来',
  '巡音流歌',
  'GUMI',
  '弱音',
  '墨清弦',
  '乐正龙牙',
  '徵羽摩柯',
  'KAITO',
  'MEIKO',
  // 作品类型
  'VOCALOID曲',
  'VOCALOID中文曲',
  'VOCALOID翻调',
  'VOCALOID原曲',
  '术力口曲',
  '术力口中文曲',
];

// 标题关键词列表 - 用于直接搜索原创曲
const TITLE_KEYWORDS = [
  // 原创相关
  'VOCALOID原创',
  'VOCALOID原曲',
  '术力口原创',
  '术力口原曲',
  '洛天依原创',
  '言和原创',
  '乐正绫原创',
  '星尘原创',
  '镜音铃原创',
  '镜音连原创',
  '初音未来原创',
  '巡音流歌原创',
  'GUMI原创',
  '虚拟歌手原创',
  // 作曲/编曲
  '作曲',
  '编曲',
  '作曲编曲',
  // 自制/本家
  '自制',
  '自制曲',
  '本家',
  '个人制作',
];

// 用于存储去重后的视频
const videoMap = new Map();

// 时间过滤：只保留最近几天发布的视频
const today = new Date();
today.setHours(0, 0, 0, 0); // 今天零点
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // 3天前
const filterTimestamp = Math.floor(threeDaysAgo.getTime() / 1000);
console.log(`📅 时间过滤: ${threeDaysAgo.toLocaleString('zh-CN')} ~ 今天`);

// 排除关键词（标题或描述中含有这些词的将被过滤）
const EXCLUDE_KEYWORDS = [
  // 榜单类
  '周榜', '月榜', '日榜', '年榜', '榜', '排行', '排名',
  '传说曲', '传说级', '人气曲', '热门曲', '殿堂曲', '金曲',
  // 教程/攻略类
  '教程', '教学', '攻略', '入门', '入坑', '指北', '指南', '介绍',
  '新手', '零基础', '讲解', '解说', '解析',
  // 翻译/字幕类
  '翻译', '中译', '日文', '日语', '罗马音', '字幕', '中文词',
  // 翻唱/翻调类 (注意：保留原创曲)
  '翻唱', '翻填', '翻作',
  // 音乐类型类
  'remix', 'remaster', 'edit', 'cover',
  // 演唱会/活动类
  '演唱会', ' Festival', '祭',
  // 盘点/合集类
  '盘点', '合集', '集合', '合辑', '精选', '专辑',
  '10首', '20首', '30首', 'TOP', 'BEST',
  // 其他非原创类
  '手办', 'MAD', 'MMD', '3D', '建模',
  '刮画', '沙画', 'PV', '动画', '手书',
];

// 原创关键词（必须包含这些词才认为是原创曲）
const ORIGINAL_KEYWORDS = [
  '原创', '作曲', '编曲', '作词', 'VOCALOID原曲', '术力口原曲',
  '自制', '自制曲', '本家', '个人制作',
];

// 可选：包含以下关键词也认为是原创（即使标题没有原创字样）
const LIKELY_ORIGINAL_KEYWORDS = [
  'feat.', 'feat ', 'ft.', 'ft ',
  '/ ', ' - ', '　', // 通常歌曲标题格式
];

// B站 API 配置
const BILIBILI_API_BASE = 'https://api.bilibili.com';

// 尝试多个可能的搜索 API 端点
const SEARCH_ENDPOINTS = [
  '/x/web-interface/search/all',
  '/x/search/type',
  '/v2/search/searchwords',
  '/x/search/esugarc',
];

/**
 * 延时函数，避免请求过快被限制
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 测试 B站 搜索 API
 * @param {string} keyword - 搜索关键词
 */
async function searchByKeyword(keyword) {
  console.log(`\n🔍 搜索关键词: "${keyword}"`);

  // 尝试每个端点，直到找到一个有效的
  for (const endpoint of SEARCH_ENDPOINTS) {
    try {
      const url = `${BILIBILI_API_BASE}${endpoint}`;
      console.log(`  尝试: ${url}`);

      const response = await axios.get(url, {
        params: {
          keyword,
          search_type: 'video',
          page: 1,
          page_size: 20,
          order: 'pubdate', // 按最新发布时间排序
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.bilibili.com',
        },
        timeout: 10000,
      });

      const data = response.data;

      if (data.code === 0) {
        // 调试：打印返回数据结构
        console.log(`  📝 返回数据键: ${Object.keys(data.data || {}).join(', ')}`);

        // 检查 result 字段
        const result = data.data?.result;
        if (result) {
          console.log(`  📝 result 类型: ${Array.isArray(result) ? '数组' : typeof result}`);
          if (typeof result === 'object' && !Array.isArray(result)) {
            console.log(`  📝 result 键: ${Object.keys(result).join(', ')}`);
          }
          // 如果是数组，打印长度和第一个元素
          if (Array.isArray(result)) {
            console.log(`  📝 result 长度: ${result.length}`);
            if (result[0]) {
              console.log(`  📝 第一个元素键: ${Object.keys(result[0]).join(', ')}`);
              console.log(`  📝 第一个元素内容: ${JSON.stringify(result[0]).slice(0, 200)}...`);
            }
          }
        }

        // 尝试多种可能的数据结构
        let videos = [];
        if (result?.video && Array.isArray(result.video)) {
          videos = result.video;
        }

        if (videos.length > 0) {
          console.log(`  ✅ 端点有效，获取到 ${videos.length} 个视频`);
          // 调试：打印第一个视频的键
          if (videos[0]) {
            console.log(`  📝 视频数据结构: ${Object.keys(videos[0]).join(', ')}`);
          }

          return videos.map(v => ({
            bvid: v.bvid,
            title: v.title,
            author: v.author,
            pubdate: v.pubdate,
            description: v.description,
            tag: keyword,
          }));
        }
      }

    } catch (error) {
      // 这个端点失败了，尝试下一个
      continue;
    }
  }

  console.log(`  ❌ 所有搜索端点均失败`);
  return [];
}

/**
 * 测试 B站 标签相关视频 API
 * @param {string} tagName - 标签名
 */
async function getVideosByTag(tagName) {
  console.log(`\n🏷️  获取标签下的视频: "${tagName}"`);

  try {
    // 尝试搜索标签
    const searchResponse = await axios.get('https://api.bilibili.com/x/search/tag', {
      params: {
        keyword: tagName,
        type: 'tag',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
      },
      timeout: 10000,
    });

    if (searchResponse.data.code !== 0) {
      console.log(`  ❌ 标签搜索失败: ${searchResponse.data.message}`);
      return [];
    }

    const tags = searchResponse.data.data || [];
    if (tags.length === 0) {
      console.log(`  ⚠️ 未找到标签: ${tagName}`);
      return [];
    }

    const tagInfo = tags[0];
    console.log(`  📌 找到标签: ${tagInfo.tag_name}, tid=${tagInfo.tag_id}`);

    // 通过标签ID获取视频列表
    const videoResponse = await axios.get('https://api.bilibili.com/x/tag/archive/tags', {
      params: {
        tid: tagInfo.tag_id,
        pn: 1,
        ps: 20,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
      },
      timeout: 10000,
    });

    const videos = videoResponse.data.data || [];
    console.log(`  ✅ 获取到 ${videos.length} 个视频`);

    return videos.map(v => ({
      bvid: v.aid ? `BV${v.aid.toString().padStart(10, '0').replace(/^(\d{4})(\d{6})$/, '$1$2')}` : v.bvid,
      title: v.title,
      author: v.owner?.name || v.author,
      pubdate: v.pubdate,
      tag: tagName,
    }));

  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    return [];
  }
}

/**
 * 尝试获取视频详情
 * @param {string} bvid - 视频BV号
 */
async function getVideoDetail(bvid) {
  try {
    const response = await axios.get(`${BILIBILI_API_BASE}/x/web-interface/view`, {
      params: { bvid },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
      },
      timeout: 10000,
    });

    if (response.data.code !== 0) {
      return null;
    }

    const data = response.data.data;
    return {
      bvid: data.bvid,
      title: data.title,
      author: data.owner?.name,
      pubdate: data.pubdate,
      description: data.desc,
      statistics: {
        view: data.stat?.view,
        like: data.stat?.like,
        coin: data.stat?.coin,
        favorite: data.stat?.favorite,
        share: data.stat?.share,
        comment: data.stat?.reply,
      },
      duration: data.duration,
      tags: data.tags?.map(t => t.tag_name) || [],
      pic: data.pic,
    };

  } catch (error) {
    console.log(`  ❌ 获取视频详情失败: ${error.message}`);
    return null;
  }
}

/**
 * 检查视频标题/描述是否应该被排除
 */
function shouldExclude(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

/**
 * 检查视频是否可能是原创曲
 */
function isOriginalVideo(title, description) {
  const text = `${title} ${description}`;

  // 先检查是否应该被排除
  if (shouldExclude(title, description)) {
    return false;
  }

  // 检查是否包含原创关键词
  const hasOriginalKeyword = ORIGINAL_KEYWORDS.some(kw => text.includes(kw));

  // 检查是否包含可能是原创的关键词
  const hasLikelyOriginal = LIKELY_ORIGINAL_KEYWORDS.some(kw => text.includes(kw));

  return hasOriginalKeyword || hasLikelyOriginal;
}

/**
 * 获取原创判定原因（用于调试）
 */
function getOriginalReason(title, description) {
  if (shouldExclude(title, description)) {
    return '❌ 被排除关键词匹配';
  }

  const text = `${title} ${description}`;
  const matchedOriginal = ORIGINAL_KEYWORDS.filter(kw => text.includes(kw));
  const matchedLikely = LIKELY_ORIGINAL_KEYWORDS.filter(kw => text.includes(kw));

  if (matchedOriginal.length > 0) {
    return `✅ 原创关键词: ${matchedOriginal.join(', ')}`;
  }
  if (matchedLikely.length > 0) {
    return `✅ 可能原创 (${matchedLikely.join(', ')})`;
  }
  return '⚠️ 未匹配到原创关键词';
}

/**
 * 添加视频到去重集合
 */
function addVideo(video) {
  if (!video.bvid) return false;

  // 时间过滤：只保留最近几天发布的视频
  if (video.pubdate < filterTimestamp) {
    return false;
  }

  if (videoMap.has(video.bvid)) {
    // 已存在，追加匹配标签
    const existing = videoMap.get(video.bvid);
    if (!existing.matchedTags.includes(video.tag)) {
      existing.matchedTags.push(video.tag);
    }
    return false;
  }

  const title = video.title || '';
  const description = video.description || '';

  videoMap.set(video.bvid, {
    ...video,
    title,
    description,
    matchedTags: [video.tag],
    isOriginal: isOriginalVideo(title, description),
  });
  return true;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('   VOCALOID 歌曲采集原型验证脚本');
  console.log('========================================');
  console.log(`\n📋 标签数量: ${TAGS.length}`);
  console.log(`📋 标题关键词数量: ${TITLE_KEYWORDS.length}`);
  console.log('----------------------------------------');

  // 1. 标签搜索
  console.log('\n\n=== 阶段1: 标签搜索 ===');

  for (const tag of TAGS) {
    const videos = await searchByKeyword(tag);
    videos.forEach(v => addVideo(v));
    await delay(500); // 避免请求过快
  }

  // 2. 标题关键词搜索
  console.log('\n\n=== 阶段2: 标题关键词搜索 ===');

  for (const keyword of TITLE_KEYWORDS) {
    const videos = await searchByKeyword(keyword);
    videos.forEach(v => addVideo(v));
    await delay(500);
  }

  // 2. 打印去重后的结果统计
  console.log('\n\n=== 阶段2: 结果统计 ===');
  console.log(`📊 去重后视频总数: ${videoMap.size}`);

  const originalVideos = [...videoMap.values()].filter(v => v.isOriginal);
  console.log(`📊 其中可能为原创的视频: ${originalVideos.length}`);

  // 显示被过滤掉的数量
  const excludedCount = videoMap.size - originalVideos.length;
  console.log(`📊 被过滤掉的可能非原创视频: ${excludedCount}`);

  // 3. 显示通过过滤的原创视频
  console.log('\n\n=== 阶段3: 今日原创视频预览 ===');
  const videoList = [...videoMap.values()].filter(v => v.isOriginal);

  // 也显示今日所有视频（方便调试）
  const todayAll = [...videoMap.values()];
  if (todayAll.length === 0) {
    console.log('📭 今日暂无新发布的视频');
  } else {
    console.log(`📊 今日视频总数: ${todayAll.length} (其中原创: ${videoList.length})`);
  }

  videoList.forEach((v, i) => {
    console.log(`\n${i + 1}. [${v.bvid}] ${v.title}`);
    console.log(`   作者: ${v.author}`);
    console.log(`   发布时间: ${new Date(v.pubdate * 1000).toLocaleString('zh-CN')}`);
    console.log(`   匹配标签: ${v.matchedTags.join(', ')}`);
    const reason = getOriginalReason(v.title || '', v.description || '');
    console.log(`   原创判定: ${reason}`);
  });

  // 4. 尝试获取一个原创视频的完整详情
  if (originalVideos.length > 0) {
    console.log('\n\n=== 阶段4: 获取原创视频完整详情 ===');
    const firstOriginal = originalVideos[0];
    console.log(`\n📺 获取 BV号: ${firstOriginal.bvid} 的完整详情...`);

    const detail = await getVideoDetail(firstOriginal.bvid);
    if (detail) {
      console.log('\n✅ 视频详情获取成功:');
      console.log(`   标题: ${detail.title}`);
      console.log(`   作者: ${detail.author}`);
      console.log(`   播放量: ${detail.statistics?.view}`);
      console.log(`   点赞: ${detail.statistics?.like}`);
      console.log(`   投币: ${detail.statistics?.coin}`);
      console.log(`   收藏: ${detail.statistics?.favorite}`);
      console.log(`   标签: ${detail.tags?.join(', ')}`);
    } else {
      console.log('❌ 视频详情获取失败');
    }
  }

  console.log('\n\n========================================');
  console.log('   原型验证完成');
  console.log('========================================');
  console.log('\n结论:');
  console.log('- 如果以上搜索获取到了视频数据，说明 API 调用正常');
  console.log('- 如果获取到 0 个视频，可能需要登录 Cookie 或使用其他接口');
  console.log('- 标签列表可根据实际返回情况进行优化');
  console.log('\n下一步:');
  console.log('1. 确认 API 调用是否正常');
  console.log('2. 优化标签列表');
  console.log('3. 确认后开始 Phase 1 基础架构搭建');
}

// 运行
main().catch(console.error);
