const endpoint = 'http://127.0.0.1:9400/wp-json/tungphat/v1/preview/';

// Never follow Playground's auto-login redirect or forward unrelated cookies.
export async function getPreview(id, cookieHeader, fetcher = fetch) {
  if (!/^[1-9]\d{0,9}$/.test(id)) return null;
  const matches = (cookieHeader || '').split(';').map(part => part.trim()).filter(part => /^wordpress_logged_in_[a-f0-9]+=[^;\s]+$/i.test(part));
  if (matches.length !== 1) return null;
  try {
    const response = await fetcher(endpoint + id, { headers: { Cookie: `${matches[0]}; playground_auto_login_already_happened=1` }, cache: 'no-store', redirect: 'manual' });
    if (!response.ok) return null;
    const post = await response.json();
    if (post.id !== Number(id) || typeof post.title !== 'string' || typeof post.content !== 'string') return null;
    return post;
  } catch { return null; }
}
