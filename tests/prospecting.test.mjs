import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDomain, parseSearch, csvCell, createHandoff } from '../lib/prospecting.ts';
import { searchBuyers } from '../lib/apollo.ts';
import { authorized } from '../lib/integration-auth.ts';

test('normalizes target accounts and rejects malformed domains', () => {
  assert.equal(normalizeDomain('https://www.Example.com/about'), 'example.com');
  for (const value of ['', 'localhost', '127.0.0.1', 'https://user:pass@example.com', 'https://example.com:8080', 'foo.local', 'bad domain.com']) assert.throws(() => normalizeDomain(value));
  assert.deepEqual(parseSearch({ domains: ['example.com', 'https://www.example.com'], titles: [' VP of Sales '] }), { domains: ['example.com'], titles: ['VP of Sales'] });
  assert.throws(() => parseSearch({ domains: ['example.com'], titles: [] }));
  assert.throws(() => parseSearch({ domains: Array(11).fill('example.com'), titles: ['CEO'] }));
});

test('CSV export escapes formulas, commas, quotes and newlines', () => {
  assert.equal(csvCell(' =HYPERLINK("bad")'), '"\' =HYPERLINK(""bad"")"');
  assert.equal(csvCell('Hello, "buyer"\nnext'), '"Hello, ""buyer""\nnext"');
});

test('Apollo uses account/title filters, deduplicates records and does not enrich emails', async () => {
  const mockFetch = async (url, options) => {
    assert.equal(url, 'https://api.apollo.io/api/v1/mixed_people/api_search');
    assert.equal(options.headers['X-Api-Key'], 'test-key');
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.q_organization_domains_list, ['example.com']);
    assert.equal(payload.include_similar_titles, false);
    return Response.json({ total_entries: 2, people: [
      { id: 'p1', first_name: 'A', last_name_obfuscated: 'B***', title: 'VP of Sales', organization: { name: 'Example', primary_domain: 'example.com' } },
      { id: 'p1', first_name: 'Duplicate' },
    ] });
  };
  const result = await searchBuyers(['example.com'], ['VP of Sales'], 'test-key', mockFetch);
  assert.equal(result.buyers.length, 1);
  assert.equal(result.buyers[0].name, 'A B***');
  assert.equal('email' in result.buyers[0], false);
  assert.equal(createHandoff(result.buyers, {}).status, 'research_review_required');
});

test('Apollo errors are actionable and do not leak provider payloads', async () => {
  await assert.rejects(searchBuyers(['example.com'], ['CEO'], 'test-key', async () => new Response('secret-provider-details', { status: 403 })), /does not have People Search access/);
  await assert.rejects(searchBuyers(['example.com'], ['CEO'], 'test-key', async () => Response.json({ error: 'unexpected' })), /unexpected search response/);
});

test('integration authentication fails closed', () => {
  const original = process.env.GTM_OPERATOR_TOKEN;
  try {
    delete process.env.GTM_OPERATOR_TOKEN;
    assert.equal(authorized(new Request('http://localhost')), false);
    process.env.GTM_OPERATOR_TOKEN = 'test-operator-code';
    assert.equal(authorized(new Request('http://localhost', { headers: { authorization: 'Bearer wrong' } })), false);
    assert.equal(authorized(new Request('http://localhost', { headers: { authorization: 'Bearer test-operator-code' } })), true);
  } finally {
    if (original === undefined) delete process.env.GTM_OPERATOR_TOKEN;
    else process.env.GTM_OPERATOR_TOKEN = original;
  }
});
