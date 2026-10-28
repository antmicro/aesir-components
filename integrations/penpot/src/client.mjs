import transit from 'transit-js';

const joinUrl = (baseUrl, path) => `${baseUrl.replace(/\/+$/, '')}${path}`;

export const PENPOT_RPC_CONTRACT = 'fe85a5717e28e7c6f9362da10725a3ec885b673f';

const transitWriter = transit.writer('json-verbose');
const keyword = transit.keyword;

const toTransitStringMap = (value) => {
  if (Array.isArray(value)) return value.map(toTransitStringMap);
  if (!value || typeof value !== 'object') return value;
  return transit.map(Object.entries(value).flatMap(([key, child]) => [key, toTransitStringMap(child)]));
};

export const encodeUpdateBody = ({ fileId, file, sessionId, tokensLib }) =>
  transitWriter.write(
    transit.map([
      keyword('id'),
      fileId,
      keyword('revn'),
      file.revn,
      keyword('vern'),
      file.vern,
      keyword('session-id'),
      sessionId,
      keyword('changes'),
      [transit.map([keyword('type'), keyword('set-tokens-lib'), keyword('tokens-lib'), toTransitStringMap(tokensLib)])]
    ])
  );

const parseResponse = async (response) => {
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const error = new Error(`Penpot API request failed (${response.status} ${response.statusText})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
};

export class PenpotClient {
  constructor({ baseUrl, accessToken, fileId, fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    this.fileId = fileId;
    this.fetch = fetchImpl;
  }

  async request(method, command, { body, encodedBody, contentType = 'application/json', query = {} } = {}) {
    const url = new URL(joinUrl(this.baseUrl, `/api/main/methods/${command}`));
    url.searchParams.set('_fmt', 'json');
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const response = await this.fetch(url, {
      method,
      headers: {
        accept: 'application/json',
        authorization: `Token ${this.accessToken}`,
        'x-client': 'aesir-ci/1',
        ...(body || encodedBody ? { 'content-type': contentType } : {})
      },
      ...(body || encodedBody ? { body: encodedBody ?? JSON.stringify(body) } : {})
    });
    return parseResponse(response);
  }

  getFile() {
    return this.request('GET', 'get-file', { query: { id: this.fileId } });
  }

  updateTokens(file, tokensLib) {
    return this.request('POST', 'update-file', {
      query: { id: this.fileId },
      contentType: 'application/transit+json',
      encodedBody: encodeUpdateBody({
        fileId: this.fileId,
        file,
        sessionId: crypto.randomUUID(),
        tokensLib
      })
    });
  }
}
