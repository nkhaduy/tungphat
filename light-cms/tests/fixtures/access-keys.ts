export const accessPrivateJwk: JsonWebKey = {
  key_ops: ["sign"], ext: true, alg: "RS256", kty: "RSA",
  n: "ppwMo4HukeitUgeEhMXpM3JBl0rcy_JZbk7Zgv7sRrx5vAMBQc67aX6JIm0u763idTexBt-lMPL8Q3q1gFrHJJPdWA3aPM4rzp7uuvgpyYUVU9pNOTgAemCltpeDwsB88mH9tQgTVtHjHrCgs8vkwZp2GYgFUhg4D7576_zALChQaan2kZsAmT48R9mG3YS9kD5ytkHIyrTTmPo_Klw8ATarj1D6SDlZ5FDNF81Tl4RykWUGAoqO_i9kImtSY8Atg-FJmV1jfWqqKhsKMIPxAXezTwxSW1wiPYW4jO6slOeeEHDZE5PaTeJqFdcu1DfT9Bf0w-KTrzZv4XpF80A-Mw",
  e: "AQAB",
  d: "CcSfume1bK6J7YOX_GTSEvxsO1-IlG3QBSHwVLgiHX-Sr42JjFR_iQ7XIW0_UY64oTYJAKXUvIryc_kEx9K1VuqoZoThZQE9cO7BK7W9qsf3rnk1CoQYWxRsLXQH-z9n0-900sv3aPat7IW0gPYU964uUGQ406MB3m0aPNq5CvL16TJwtKStDquqYV5dPFvIcQCoxu63RZA6JK5dlB-b4LecJf1b9TqfQyr9CF--zwGxgssiqfeE0Vw_v5EnQ3LbRj8o1N5fY3fpDbUYc52aLxMqrm25lcy5GjBorWu_Yg-4bt7uAZX-sf50vPUXtNl4wrERDjaE6Uzb4ewMWWr6kQ",
  p: "0Xknn2K2YxJ4Pd-e7TG0sC7P8gfZrP7K4bnBuYB6Fmj7gQnt3m7aKjTygiGQtxCmlpIek7lwKT5Nbd0I7-zz-McFy-8BuxkiJpUlGrPbxPy2-w0JCMOiGhqZ5Hw4aQbfeJLnUqREIj8QRTwHZDi0YLSS8RsFrTul4U_UFd3DXgk",
  q: "y52f_uXeFW408ffNmp9UhLjtZVM6rZm2ClRy75xvQtJirzNQdPpbiJQOneMm7G2apLtLre5vVoW8WvpH7FFj40qb5u7WDh5InMrDMz4ocNIMlCxmHYo_ZtccaGLx3Os2do6ofgcbpJqSADN6xtBKsD6e3CG06ozDwhA4qJRjiVs",
  dp: "mNn9bbKMQDLkBtI8l_xjSwR9vLC5yCCMTrZLhF8Zt2yXyYtDRcJB8_Z61zZC8TJ3PPwWz9jK3W2W9ooJ0XlodapUsoEPFEW8w8alMpz3ywBVTVAvvXNzv_SVQ0LZrtnTC5q2rXksNokqCDtLcXhnNwHND56WP9h8rLKhoesWenE",
  dq: "M4JNjksSUnONu0SH47y4wdaSX5adensvHQ_d_5WgY9QbGN0vVlhbPYLO68wh9Z-IhnHHJFn0Gnw8ePtlpHe2gDJInDQBPJMWpWt51AW-b0QD4JwWvRRTE64JRrL5InzySy2tnCwqJwrfMmPThGX-7vT4dRGl1cwEXZyC6MqZH48",
  qi: "ddyJSpCB3Lmqzabf4MONDX4glA8TtnURywCrttLHQcC1OdJsKjxa4ot-_8wa6T3G1m45u6BuznrzPl6SPfNjf998YtNtiqdmE0G0Qf2-3ArNGc5zNRjAAlxCc8smZfJveBIctzyn1EapTfSxPcVZAhJaWy2uwdlSAJmUkivhJR0",
};

export const accessPublicJwk: JsonWebKey & { kid: string } = {
  key_ops: ["verify"], ext: true, alg: "RS256", kty: "RSA",
  n: accessPrivateJwk.n, e: "AQAB", kid: "access-test-key", use: "sig",
};

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export async function signAccessToken(
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: "RS256", kid: accessPublicJwk.kid, typ: "JWT" },
) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedClaims = base64Url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey("jwk", accessPrivateJwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${base64Url(signature)}`;
}
