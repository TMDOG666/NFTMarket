import fetch from 'node-fetch';

export async function GET(req: Request): Promise<Response> {
  try {
    // 解析请求 URL 并获取查询参数
    const requestUrl = new URL(req.url);
    const imageUrl = requestUrl.searchParams.get('url');

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing image URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching image from URL: ${imageUrl}`);

    // 发起请求获取外部图片资源
    const response = await fetch(imageUrl);

    // 检查请求是否成功
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取图片内容并设置适当的 Content-Type
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response(JSON.stringify({ error: 'Error fetching image', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}