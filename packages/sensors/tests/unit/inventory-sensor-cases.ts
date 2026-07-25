import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';
import {
  decoratorArgIdentifiers,
  decoratorFirstStringArg,
  decoratorName,
  findDecoratorByName,
  parseSource,
  walkFiles,
  walkTs,
  walkTsxJsx,
} from '../../src/inventory-walker.js';
import { senseInventoryApi } from '../../src/inventory-api.js';
import { senseInventoryRoutes } from '../../src/inventory-routes.js';
import { senseInventoryDataModel } from '../../src/inventory-data-model.js';
import { senseInventoryDepGraph } from '../../src/inventory-dep-graph.js';
import { senseInventoryDataHandling } from '../../src/inventory-data-handling.js';
import { senseInventoryRbac } from '../../src/inventory-rbac.js';
import { senseInventoryCoverage } from '../../src/inventory-coverage.js';

const roots: string[] = [];
const NOW = '2026-07-24T00:00:00.000Z';

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-inventory-sensors-'));
  roots.push(root);
  return root;
}

function write(root: string, rel: string, source: string): string {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
  return path;
}

function buildFixture(): string {
  const root = fixtureRoot();
  write(
    root,
    'apps/api/users.controller.ts',
    `
      @Controller('/users')
      @UseGuards(SessionGuard)
      export class UsersController {
        @Get(':id')
        @Roles(AdminRole, 'reader')
        getOne(@Param('id') id: string, @Query(\`expand\`) expand: string, @Headers('x-id') header: string) {}

        @Post()
        create(@Body() body: unknown) {}

        @Get('health')
        @Public()
        health() {}

        @Patch(':id')
        patch(@Param() id: string) {}

        notAnEndpoint() {}
      }

      class NotAController {
        @Get() ignored() {}
      }
    `,
  );
  write(
    root,
    'apps/web/routes.tsx',
    `
      const direct = <Route path="/users/:id" element={<UserPage />} />;
      const expression = <Route path={'/health'} element={lazyPage()} />;
      const empty = <Route path />;
      export const router = createBrowserRouter([
        { path: '/', element: <Home />, children: [
          { path: '/settings', element: <Settings /> },
          { path: \`/literal\`, element: Settings },
        ]},
      ]);
      export const routes = useRoutes([{ path: '/other', element: OtherPage }]);
    `,
  );
  write(
    root,
    'apps/angular/app.routes.ts',
    `
      export const routes: Routes = [
        { path: 'dashboard', component: DashboardComponent, children: [
          { path: 'child', loadComponent: () => import('./child').then(m => m.ChildComponent) },
          { path: 'lazy', loadChildren: () => import('./lazy') },
          { path: 'old', redirectTo: 'dashboard' },
        ]},
      ];
      provideRouter([{ path: 'provided', component: ProvidedComponent }]);
      RouterModule.forRoot([{ path: 'root', component: RootComponent }]);
      RouterModule.forChild([{ path: 'child-root', component: ChildRootComponent }]);
    `,
  );
  write(
    root,
    'database/001-schema.sql',
    `
      CREATE TABLE auth.roles (
        id uuid PRIMARY KEY,
        name varchar(100) NOT NULL,
        slug text UNIQUE
      );

      CREATE TABLE auth.permissions (
        id uuid,
        name text NOT NULL,
        CONSTRAINT permissions_pk PRIMARY KEY (id),
        UNIQUE (name)
      );

      CREATE TABLE auth.role_permissions (
        role_id uuid NOT NULL,
        permission_id uuid NOT NULL,
        CONSTRAINT role_fk FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON DELETE CASCADE,
        CONSTRAINT permission_fk FOREIGN KEY (permission_id) REFERENCES auth.permissions(id) ON UPDATE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

      CREATE TABLE app.users (
        id bigint GENERATED ALWAYS AS IDENTITY,
        email text NOT NULL, -- @pii_class: contact @legal_basis: contract @retention: P2Y
        password_hash varchar(255),
        full_name text,
        address text,
        ip_address inet,
        balance numeric(10, 2) DEFAULT 0,
        active boolean DEFAULT true,
        role_id uuid REFERENCES auth.roles(id),
        CONSTRAINT users_pk PRIMARY KEY (id)
      );

      CREATE TABLE core.pii_map (
        table_schema text,
        table_name text,
        column_name text,
        category text,
        strategy text,
        legal_basis text,
        retention text
      );

      INSERT INTO core.pii_map
        (table_schema, table_name, column_name, category, strategy, legal_basis, retention)
      VALUES
        ('app', 'users', 'full_name', 'personal', 'mask', 'consent', 'P1Y'),
        ('app', 'users', 'ip_address', 'ip', 'truncate', 'legitimate-interest', 'P90D')
      ON CONFLICT DO NOTHING;
    `,
  );
  write(root, 'packages/core/src/a.ts', `import { b } from './b.js'; export { c } from 'pkg-c';`);
  write(root, 'packages/core/src/b.ts', `import fs from 'node:fs'; export const b = fs;`);
  write(root, 'packages/core/src/ignored.d.ts', 'export type Ignored = string;');
  write(root, 'packages/core/src/view.jsx', 'export const View = <div />;');
  write(root, 'node_modules/ignored.ts', 'export const ignored = true;');
  return root;
}

describe('inventory walker behavior', () => {
  it('walks selected extensions, skips declarations and ignored directories, and parses sources', () => {
    const root = buildFixture();
    const all = walkFiles(root, {
      extensions: ['ts', 'tsx', 'jsx', 'sql'],
      skipDeclarations: false,
    });
    const ts = walkTs(root);
    const jsx = walkTsxJsx(root);

    expect(all.some((path) => path.endsWith('001-schema.sql'))).toBe(true);
    expect(all.some((path) => path.includes('node_modules'))).toBe(false);
    expect(ts.some((path) => path.endsWith('ignored.d.ts'))).toBe(false);
    expect(jsx.some((path) => path.endsWith('view.jsx'))).toBe(true);
    expect(walkFiles(join(root, 'missing'))).toEqual([]);
    expect(parseSource(join(root, 'missing.ts'))).toBeNull();
  });

  it('extracts decorator names, literals, identifiers, and lookup matches', () => {
    const root = buildFixture();
    const source = parseSource(join(root, 'apps/api/users.controller.ts'));
    expect(source).not.toBeNull();
    const decorators: ts.Decorator[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.canHaveDecorators(node)) decorators.push(...(ts.getDecorators(node) ?? []));
      ts.forEachChild(node, visit);
    };
    visit(source as ts.SourceFile);

    const controller = findDecoratorByName(decorators, 'Controller');
    const roles = findDecoratorByName(decorators, 'Roles');
    expect(controller).toBeDefined();
    expect(decoratorName(controller as ts.Decorator)).toBe('Controller');
    expect(decoratorFirstStringArg(controller as ts.Decorator)).toBe('/users');
    expect(decoratorArgIdentifiers(roles as ts.Decorator)).toEqual(['AdminRole', 'reader']);
    expect(findDecoratorByName(undefined, 'Missing')).toBeUndefined();
  });
});

describe('source inventory sensors', () => {
  it('extracts authenticated and explicitly public NestJS endpoints deterministically', () => {
    const root = buildFixture();
    const result = senseInventoryApi({
      repoRoot: root,
      scanDir: 'apps/api',
      scanDirs: ['apps/api', 'missing'],
      persistBody: false,
      publicMarkerDecorators: ['Public'],
      stack: { backend: 'nestjs', frontend: 'react', db: 'postgres' },
      now: NOW,
    });

    expect(result.reading.status).toBe('pass');
    expect(result.bodyPath).toBeNull();
    expect(result.body.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      'POST /users',
      'GET /users/:id',
      'PATCH /users/:id',
      'GET /users/health',
    ]);
    expect(
      result.body.endpoints.find(
        (endpoint) => endpoint.method === 'GET' && endpoint.path === '/users/:id',
      )?.auth,
    ).toMatchObject({
      required: true,
      guards: ['SessionGuard'],
      roles: ['AdminRole', 'reader'],
    });
    expect(
      result.body.endpoints.find((endpoint) => endpoint.path.endsWith('health'))?.auth,
    ).toEqual({
      guards: ['SessionGuard'],
      required: false,
    });
  });

  it('reports a clean empty API scan as review and persists an observed body', () => {
    const root = fixtureRoot();
    write(root, 'src/plain.ts', 'export const plain = true;');
    const empty = senseInventoryApi({
      repoRoot: root,
      scanDirs: ['missing'],
      persistBody: false,
      now: NOW,
    });
    expect(empty.reading).toMatchObject({ status: 'review' });
    expect(empty.reading.findings?.[0]?.code).toBe('API_INVENTORY_EMPTY');

    write(root, 'one.controller.ts', `@Controller() class One { @Get() index() {} }`);
    const persisted = senseInventoryApi({ repoRoot: root, now: NOW });
    expect(persisted.reading.status).toBe('error');
    expect(persisted.bodyPath).toBeNull();
    expect(persisted.reading.findings?.[0]?.code).toBe('API_INVENTORY_WRITE_FAILED');
  });

  it('extracts React route elements, object children, literals, and alternate scan directories', () => {
    const root = buildFixture();
    const result = senseInventoryRoutes({
      repoRoot: root,
      scanDir: 'apps/web',
      scanDirs: ['apps/web', 'missing'],
      persistBody: false,
      framework: 'react',
      now: NOW,
    });

    expect(result.reading.status).toBe('pass');
    expect(result.body.routes.map((route) => route.path)).toEqual([
      '',
      '/',
      '/health',
      '/literal',
      '/other',
      '/settings',
      '/users/:id',
    ]);
    expect(result.body.routes.find((route) => route.path === '/settings')?.parentId).toBeDefined();
    expect(result.body.routes.find((route) => route.path === '/users/:id')?.component?.name).toBe(
      'UserPage',
    );
  });

  it('extracts Angular typed, provided, root, child, redirect, and lazy routes', () => {
    const root = buildFixture();
    const result = senseInventoryRoutes({
      repoRoot: root,
      scanDir: 'apps/angular',
      framework: 'angular',
      persistBody: false,
      now: NOW,
    });

    expect(result.reading.status).toBe('pass');
    expect(result.body.routes.map((route) => route.path)).toEqual([
      'child',
      'child-root',
      'dashboard',
      'lazy',
      'old',
      'provided',
      'root',
    ]);
    expect(result.body.routes.find((route) => route.path === 'child')?.component?.name).toBe(
      'ChildComponent',
    );
  });

  it('builds deterministic local and external dependency edges', () => {
    const root = buildFixture();
    const result = senseInventoryDepGraph({
      repoRoot: root,
      scanDir: join(root, 'packages'),
      persistBody: false,
      now: NOW,
    });

    expect(result.reading.status).toBe('pass');
    expect(result.body.graph['packages/core/src/a.ts']).toEqual([
      'packages/core/src/b.ts',
      'pkg-c',
    ]);
    expect(result.body.graph['packages/core/src/b.ts']).toEqual(['node:fs']);
  });
});

describe('data and coverage inventory sensors', () => {
  it('parses SQL tables, keys, constraints, defaults, annotations, and PII registry rows', () => {
    const root = buildFixture();
    const result = senseInventoryDataModel({
      repoRoot: root,
      migrationDirs: ['missing', 'database'],
      piiRegistryTable: 'pii_map',
      persistBody: false,
      now: NOW,
    });

    expect(result.reading.status).toBe('pass');
    expect(result.body.tables.map((table) => table.name)).toEqual([
      'permissions',
      'pii_map',
      'role_permissions',
      'roles',
      'users',
    ]);
    const users = result.body.tables.find((table) => table.name === 'users');
    expect(users?.primary_key).toEqual(['id']);
    expect(users?.columns.find((column) => column.name === 'email')).toMatchObject({
      nullable: false,
      pii_class: 'contact',
      legal_basis: 'contract',
      retention: 'P2Y',
    });
    expect(users?.columns.find((column) => column.name === 'full_name')).toMatchObject({
      pii_class: 'personal',
      legal_basis: 'consent',
      retention: 'P1Y',
    });
    expect(users?.columns.find((column) => column.name === 'active')?.default).toBe('true');
    expect(result.bodyPath).toBeNull();
  });

  it('seeds PII classifications and derives RBAC tables and endpoint bindings', () => {
    const root = buildFixture();
    const model = senseInventoryDataModel({
      repoRoot: root,
      migrationDirs: ['database'],
      piiRegistryTable: 'pii_map',
      persistBody: false,
      now: NOW,
    });
    const api = senseInventoryApi({
      repoRoot: root,
      scanDir: 'apps/api',
      publicMarkerDecorators: ['Public'],
      persistBody: false,
      now: NOW,
    });
    write(
      root,
      'record/proofs/sensors/inventory_data_model/data-model.json',
      JSON.stringify(model.body),
    );
    write(root, 'record/proofs/sensors/inventory_api/api-map.json', JSON.stringify(api.body));
    const handling = senseInventoryDataHandling({
      repoRoot: root,
      persistBody: false,
      now: NOW,
    });
    const rbac = senseInventoryRbac({
      repoRoot: root,
      persistBody: false,
      now: NOW,
    });

    expect(model.reading.status).toBe('pass');
    expect(api.reading.status).toBe('pass');
    expect(handling.reading.status).toBe('pass');
    expect(
      handling.body?.tables
        .find((table) => table.name === 'users')
        ?.columns.find((column) => column.name === 'password_hash')?.pii_class,
    ).toBe('credentials');
    expect(rbac.reading.status).toBe('pass');
    const rbacBody = rbac.body as {
      rbacIlfTables: string[];
      bindings: { endpointBindings: Array<{ permissionId: string }> };
      unmapped: { endpointsWithoutRole: string[] };
    };
    expect(rbacBody.rbacIlfTables).toEqual(
      expect.arrayContaining(['roles', 'permissions', 'role_permissions']),
    );
    expect(rbacBody.bindings.endpointBindings.map((binding) => binding.permissionId)).toEqual(
      expect.arrayContaining(['guard:SessionGuard', 'role:AdminRole', 'role:reader']),
    );
    expect(rbacBody.unmapped.endpointsWithoutRole).toEqual([]);
  });

  it('reports missing and malformed prerequisite bodies honestly', () => {
    const root = fixtureRoot();
    expect(
      senseInventoryDataHandling({ repoRoot: root, persistBody: false, now: NOW }).reading,
    ).toMatchObject({ status: 'review' });
    expect(
      senseInventoryRbac({ repoRoot: root, persistBody: false, now: NOW }).reading,
    ).toMatchObject({ status: 'unknown' });

    const bad = write(root, 'bad.json', '{bad');
    expect(
      senseInventoryDataHandling({
        repoRoot: root,
        dataModelPath: bad,
        persistBody: false,
        now: NOW,
      }).reading.status,
    ).toBe('error');
    expect(
      senseInventoryRbac({
        repoRoot: root,
        dataModelPath: bad,
        apiMapPath: bad,
        persistBody: false,
        now: NOW,
      }).reading.status,
    ).toBe('error');
  });

  it('synthesizes paired, route-only, and endpoint-only use-case links', () => {
    const root = buildFixture();
    const api = senseInventoryApi({
      repoRoot: root,
      scanDir: 'apps/api',
      persistBody: false,
      now: NOW,
    });
    const routes = senseInventoryRoutes({
      repoRoot: root,
      scanDir: 'apps/web',
      framework: 'react',
      persistBody: false,
      now: NOW,
    });
    write(root, 'record/proofs/sensors/inventory_api/api-map.json', JSON.stringify(api.body));
    write(
      root,
      'record/proofs/sensors/inventory_routes/routes-react.json',
      JSON.stringify(routes.body),
    );
    const routeIds = routes.body.routes.map((route) => route.id);
    const endpointIds = api.body.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`);
    write(
      root,
      'product/use-cases/inventory.json',
      JSON.stringify({
        schemaVersion: '1.0.0',
        roles: ['operator'],
        cases: [
          {
            id: 'UC-inventory',
            title: 'Exercise inventory links',
            mainFlow: [
              {
                action: 'paired',
                actorRole: 'operator',
                refs: { routeIds: [routeIds[0]], endpointIds: [endpointIds[0]] },
              },
              {
                action: 'route only',
                actorRole: 'operator',
                refs: { routeIds: [routeIds[1], 'missing-route'] },
              },
              {
                action: 'endpoint only',
                actorRole: 'operator',
                refs: { endpointIds: [endpointIds[1], 'missing-endpoint'] },
              },
            ],
          },
        ],
      }),
    );
    write(root, 'product/use-cases/bad.json', '{bad');

    const result = senseInventoryCoverage({
      repoRoot: root,
      framework: 'react',
      persistBody: false,
      now: NOW,
    });
    const body = result.body as {
      links: Array<{ linkKind: string }>;
      stats: { linkCount: number };
      unmapped: { routes: string[]; endpoints: string[] };
    };

    expect(result.reading.status).toBe('review');
    expect(body.links.map((link) => link.linkKind)).toEqual([
      'paired',
      'route-only',
      'endpoint-only',
    ]);
    expect(body.stats.linkCount).toBe(3);
    expect(result.reading.findings?.map((finding) => finding.code)).toContain(
      'COVERAGE_USE_CASES_PARSE_FAILED',
    );
  });

  it('reports absent and invalid coverage inputs without emitting a body file', () => {
    const root = fixtureRoot();
    const absent = senseInventoryCoverage({ repoRoot: root, persistBody: false, now: NOW });
    expect(absent.reading.status).toBe('review');

    const badApi = write(root, 'api.json', '{bad');
    const badRoutes = write(root, 'routes.json', '{bad');
    const invalid = senseInventoryCoverage({
      repoRoot: root,
      apiMapPath: badApi,
      routesPath: badRoutes,
      persistBody: false,
      now: NOW,
    });
    expect(invalid.reading.status).toBe('error');
    expect(invalid.bodyPath).toBeNull();
  });
});
