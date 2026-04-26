/**
 * Bilibili API 调试脚本
 */
import axios from 'axios';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testEndpoint(endpoint: string, keyword: string) {
  try {
    const res = await axios.get(`https://api.bilibili.com${endpoint}`, {
      params: { keyword, search_type: 'video', page: 1, order: 'pubdate' },
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com' },
      timeout: 10000,
    });

    console.log(`\n=== ${endpoint} (keyword=${keyword}) ===`);
    console.log(`code: ${res.data.code}, message: ${res.data.message}`);

    if (res.data.code !== 0) return;

    const data = res.data.data;
    if (!data) {
      console.log('data is null');
      return;
    }

    console.log(`data keys: ${Object.keys(data).join(', ')}`);

    // Check for result
    if (data.result) {
      console.log(`result type: ${typeof data.result}, isArray: ${Array.isArray(data.result)}`);
      if (typeof data.result === 'object' && !Array.isArray(data.result)) {
        console.log(`result keys: ${Object.keys(data.result).join(', ')}`);
        for (const key of Object.keys(data.result)) {
          const val = data.result[key];
          if (Array.isArray(val)) {
            console.log(`  result.${key}: array[${val.length}]`);
            if (val[0]) console.log(`    [0] keys: ${Object.keys(val[0]).slice(0, 10).join(', ')}`);
          } else {
            console.log(`  result.${key}: ${typeof val}`);
          }
        }
      }
    }

    // Check for video array at other paths
    if (data.videos) console.log(`videos: array[${data.videos.length}]`);
    if (data.items) console.log(`items: array[${data.items.length}]`);
    if (data.list) console.log(`list: array[${data.list.length}]`);

    // Try getting all videos
    let videoCount = 0;
    if (data.result?.video) videoCount += data.result.video.length;
    if (Array.isArray(data.result)) videoCount += data.result.length;
    console.log(`total videos found: ${videoCount}`);

  } catch (err: any) {
    console.log(`\n=== ${endpoint} === FAILED: ${err.message}`);
  }
}

async function main() {
  console.log('Bilibili API 调试');
  console.log('='.repeat(50));

  await testEndpoint('/x/web-interface/search/all/v2', 'VOCALOID');
  await testEndpoint('/x/web-interface/search/all', 'VOCALOID');
  await testEndpoint('/x/search/type', 'VOCALOID');
  await testEndpoint('/x/web-interface/search/all', '初音未来');
}

main().catch(console.error);
