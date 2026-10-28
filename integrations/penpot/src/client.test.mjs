import assert from 'node:assert/strict';
import test from 'node:test';
import transit from 'transit-js';
import { encodeUpdateBody } from './client.mjs';

test('encodes the update envelope as Transit while preserving literal DTCG keys', () => {
  const encoded = encodeUpdateBody({
    fileId: 'file-id',
    file: { revn: 3, vern: 7 },
    sessionId: 'session-id',
    tokensLib: {
      global: {
        spacing: {
          small: { $value: '2px', $type: 'spacing' }
        }
      }
    }
  });
  const decoded = transit.reader('json').read(encoded);
  const change = decoded.get(transit.keyword('changes'))[0];
  const tokensLib = change.get(transit.keyword('tokens-lib'));
  const token = tokensLib.get('global').get('spacing').get('small');

  assert.equal(decoded.get(transit.keyword('id')), 'file-id');
  assert.equal(decoded.get(transit.keyword('session-id')), 'session-id');
  assert.equal(change.get(transit.keyword('type')).toString(), ':set-tokens-lib');
  assert.equal(token.get('$value'), '2px');
  assert.equal(token.get('$type'), 'spacing');
});
