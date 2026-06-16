export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const n8nBase = 'https://n8n.srv1711190.hstgr.cloud';
  const n8nPath = req.query.n8nPath || '';

  const url = new URL(req.url, 'http://localhost');
  url.searchParams.delete('n8nPath');
  const targetUrl = `${n8nBase}${n8nPath}${url.search}`;

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
    };

    if (rawBody.length > 0) {
      fetchOptions.body = rawBody;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        res.status(response.status).json(JSON.parse(data));
        return;
      } catch {}
    }

    res.status(response.status).send(data);
  } catch (error) {
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
}
