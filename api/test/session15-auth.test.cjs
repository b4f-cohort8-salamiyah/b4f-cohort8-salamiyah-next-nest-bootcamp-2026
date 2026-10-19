// Real HTTP and MongoDB audit. Uses a unique disposable local database only.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { getConnectionToken } = require('@nestjs/mongoose');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

const rejection = {
  message: 'Invalid or missing authentication token.',
  error: 'Unauthorized',
  statusCode: 401,
};

test('Session 15: real JWT authorization on every write route', async (t) => {
  const names = ['MONGODB_URI', 'JWT_SECRET', 'INTERNAL_TOOL_KEY'];
  const saved = Object.fromEntries(names.map((key) => [key, process.env[key]]));
  const database = `b4f-board-session15-test-${randomUUID()}`;
  const secret = randomUUID();
  const key = randomUUID();
  process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/${database}`;
  process.env.JWT_SECRET = secret;
  process.env.INTERNAL_TOOL_KEY = key;
  // Load after setting test configuration; never connect to the user's app DB.
  const { AppModule } = require('../dist/app.module');
  const {
    AllExceptionsFilter,
  } = require('../dist/common/filters/all-exceptions.filter');
  let app;
  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    const swagger = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    async function call(method, path, headers = {}, body) {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    }
    const account = {
      name: 'Session 15 Test',
      email: 'session15@example.com',
      password: 'session15-test-password',
    };
    const registered = await call('POST', '/auth/register', {}, account);
    assert.equal(registered.status, 201);
    assert.ok(!('passwordHash' in registered.body));
    const login = await call(
      'POST',
      '/auth/login',
      {},
      { email: account.email, password: account.password },
    );
    assert.equal(login.status, 200);
    assert.equal(typeof login.body.accessToken, 'string');
    assert.ok(!('passwordHash' in login.body.user));
    const bearer = { Authorization: `Bearer ${login.body.accessToken}` };
    const signer = new JwtService({ secret });
    const claims = { sub: registered.body.id, email: account.email };
    const failures = [
      ['no token', {}],
      ['old internal-tool key only', { 'x-internal-tool-key': key }],
      ['invalid token', { Authorization: 'Bearer invalid-token' }],
      [
        'expired token',
        { Authorization: `Bearer ${signer.sign(claims, { expiresIn: -1 })}` },
      ],
      [
        'wrong signing secret',
        {
          Authorization: `Bearer ${new JwtService({ secret: 'different-test-secret' }).sign(claims)}`,
        },
      ],
      [
        'wrong authentication scheme',
        { Authorization: `Basic ${login.body.accessToken}` },
      ],
    ];
    await t.test(
      'registration, login and /auth/me identify a real user',
      async () => {
        const me = await call('GET', '/auth/me', bearer);
        assert.equal(me.status, 200);
        assert.deepEqual(me.body, registered.body);
        const duplicate = await call('POST', '/auth/register', {}, account);
        assert.equal(duplicate.status, 409);
        const badLogin = await call(
          'POST',
          '/auth/login',
          {},
          { email: account.email, password: 'wrong-password' },
        );
        assert.equal(badLogin.status, 401);
      },
    );
    for (const [reason, headers] of failures) {
      await t.test(`/auth/me rejection baseline: ${reason}`, async () => {
        assert.deepEqual(await call('GET', '/auth/me', headers), {
          status: 401,
          body: rejection,
        });
      });
    }
    const fixtures = {};
    const payloads = {
      projects: {
        name: 'Teamwork Project',
        key: 'SESSION15',
        description: 'JWT audit',
      },
      workspaces: {
        name: 'Teamwork Workspace',
        slug: 'session15',
        description: 'JWT audit',
      },
      issues: {
        projectId: 1,
        title: 'Teamwork Issue',
        description: 'JWT audit',
      },
    };
    for (const resource of ['projects', 'workspaces', 'issues']) {
      for (const [method, path] of [
        ['POST', `/${resource}`],
        ['PATCH', `/${resource}/1`],
        ['DELETE', `/${resource}/1`],
      ]) {
        for (const [reason, headers] of failures) {
          await t.test(`${method} ${path} rejects ${reason}`, async () => {
            assert.deepEqual(
              await call(
                method,
                path,
                headers,
                method === 'DELETE' ? undefined : {},
              ),
              { status: 401, body: rejection },
            );
          });
        }
      }
      await t.test(
        `POST /${resource} accepts real login token without an internal-tool key`,
        async () => {
          if (resource === 'issues')
            payloads.issues.projectId = fixtures.projects.id;
          const created = await call(
            'POST',
            `/${resource}`,
            bearer,
            payloads[resource],
          );
          assert.equal(created.status, 201);
          assert.equal(typeof created.body.id, 'number');
          fixtures[resource] = created.body;
        },
      );
      await t.test(
        `PATCH /${resource}/:id accepts real login token`,
        async () => {
          const updated = await call(
            'PATCH',
            `/${resource}/${fixtures[resource].id}`,
            bearer,
            { description: 'Updated by signed-in user' },
          );
          assert.equal(updated.status, 200);
          assert.equal(updated.body.description, 'Updated by signed-in user');
        },
      );
      await t.test(
        `${resource} list and single-resource reads remain public`,
        async () => {
          const all = await call('GET', `/${resource}`);
          assert.equal(all.status, 200);
          assert.ok(all.body.some((item) => item.id === fixtures[resource].id));
          const one = await call(
            'GET',
            `/${resource}/${fixtures[resource].id}`,
          );
          assert.equal(one.status, 200);
          const malformed = await call('GET', `/${resource}/abc`);
          assert.equal(malformed.status, 400);
          const missing = await call('GET', `/${resource}/999999`);
          assert.equal(missing.status, 404);
        },
      );
      await t.test(
        `${resource} still validates authenticated writes`,
        async () => {
          assert.equal(
            (await call('POST', `/${resource}`, bearer, {})).status,
            400,
          );
          assert.equal(
            (await call('PATCH', `/${resource}/abc`, bearer, {})).status,
            400,
          );
          assert.equal(
            (await call('PATCH', `/${resource}/999999`, bearer, {})).status,
            404,
          );
          assert.equal(
            (await call('DELETE', `/${resource}/abc`, bearer)).status,
            400,
          );
          assert.equal(
            (await call('DELETE', `/${resource}/999999`, bearer)).status,
            404,
          );
        },
      );
    }
    await t.test(
      'public project key and workspace slug lookups remain open',
      async () => {
        assert.equal(
          (await call('GET', '/projects/key/SESSION15')).body.id,
          fixtures.projects.id,
        );
        assert.equal(
          (await call('GET', '/workspaces/slug/session15')).body.id,
          fixtures.workspaces.id,
        );
      },
    );
    await t.test('all existing public list filters still work', async () => {
      for (const [resource, query, id] of [
        ['projects', 'name=teamwork&key=SESSION15', fixtures.projects.id],
        ['workspaces', 'name=teamwork&slug=session15', fixtures.workspaces.id],
        [
          'issues',
          `projectId=${fixtures.projects.id}&status=todo&title=teamwork`,
          fixtures.issues.id,
        ],
      ]) {
        const response = await call('GET', `/${resource}?${query}`);
        assert.equal(response.status, 200);
        assert.deepEqual(
          response.body.map((item) => item.id),
          [id],
        );
        assert.deepEqual(
          (
            await call(
              'GET',
              `/${resource}?${resource === 'issues' ? 'title' : 'name'}=no-such-record-session15`,
            )
          ).body,
          [],
        );
      }
      assert.equal((await call('GET', '/issues?status=invalid')).status, 400);
    });
    await t.test(
      'duplicate project keys and workspace slugs still return 409',
      async () => {
        for (const resource of ['projects', 'workspaces'])
          assert.equal(
            (await call('POST', `/${resource}`, bearer, payloads[resource]))
              .status,
            409,
          );
      },
    );
    await t.test(
      'stats keeps its original key-only access contract and response',
      async () => {
        for (const headers of [
          {},
          bearer,
          { 'x-internal-tool-key': 'wrong-key' },
        ]) {
          const result = await call('GET', '/projects/stats', headers);
          assert.equal(result.status, 403);
          assert.deepEqual(result.body, {
            message:
              "This operation is restricted to B4F Board's own internal tooling.",
            error: 'Forbidden',
            statusCode: 403,
          });
        }
        const stats = await call('GET', '/projects/stats', {
          'x-internal-tool-key': key,
        });
        assert.equal(stats.status, 200);
        assert.equal(
          stats.body.total,
          (await call('GET', '/projects')).body.length,
        );
      },
    );
    await t.test(
      'Swagger documents all nine writes as Bearer/401; reads and stats retain their contracts',
      () => {
        for (const resource of ['projects', 'workspaces', 'issues']) {
          for (const [path, method] of [
            [`/${resource}`, 'post'],
            [`/${resource}/{id}`, 'patch'],
            [`/${resource}/{id}`, 'delete'],
          ]) {
            const op = swagger.paths[path][method];
            assert.deepEqual(op.security, [{ bearer: [] }]);
            assert.ok(op.responses['401']);
            assert.ok(!op.responses['403']);
            assert.ok(
              !(op.parameters || []).some(
                (p) => p.name === 'x-internal-tool-key',
              ),
            );
          }
          for (const path of [`/${resource}`, `/${resource}/{id}`])
            assert.ok(!swagger.paths[path].get.security?.length);
        }
        assert.equal(
          swagger.components.securitySchemes.bearer.scheme,
          'bearer',
        );
        const stats = swagger.paths['/projects/stats'].get;
        assert.ok(!stats.security?.length);
        assert.ok(
          stats.parameters.some(
            (p) => p.name === 'x-internal-tool-key' && p.required,
          ),
        );
        assert.ok(stats.responses['403']);
      },
    );
    for (const resource of ['issues', 'projects', 'workspaces']) {
      await t.test(
        `DELETE /${resource}/:id accepts real login token and returns the removed record`,
        async () => {
          const id = fixtures[resource].id;
          const deleted = await call('DELETE', `/${resource}/${id}`, bearer);
          assert.equal(deleted.status, 200);
          assert.equal(deleted.body.id, id);
          assert.equal(deleted.body.description, 'Updated by signed-in user');
          assert.equal((await call('GET', `/${resource}/${id}`)).status, 404);
        },
      );
    }
  } finally {
    try {
      if (app) {
        const connection = app.get(getConnectionToken());
        assert.equal(connection.name, database);
        await connection.dropDatabase();
      }
    } finally {
      if (app) await app.close();
      for (const name of names) {
        if (saved[name] === undefined) delete process.env[name];
        else process.env[name] = saved[name];
      }
    }
  }
});
