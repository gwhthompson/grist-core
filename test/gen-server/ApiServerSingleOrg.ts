/**
 * Tests for GRIST_SINGLE_ORG personal org document access.
 *
 * This test file verifies the fix for the issue where personal org documents
 * were returning 404 errors when GRIST_SINGLE_ORG was set to a non-"docs" value.
 *
 * The fix ensures that when GRIST_SINGLE_ORG is set, documents in personal orgs
 * are accessible via the API, maintaining backwards compatibility with existing
 * API contracts.
 */

import {configForUser} from 'test/gen-server/testUtils';
import * as testUtils from 'test/server/testUtils';
import {HomeDBManager} from 'app/gen-server/lib/homedb/HomeDBManager';
import {TestServer} from 'test/gen-server/apiUtils';

import axios, {AxiosRequestConfig} from 'axios';
import * as chai from 'chai';

const assert = chai.assert;

describe('ApiServerSingleOrg', function() {
  let oldEnv: testUtils.EnvironmentSnapshot;
  let server: TestServer;
  let dbManager: HomeDBManager;
  let homeUrl: string;

  const chimpy = configForUser('Chimpy');
  const chimpyEmail = 'chimpy@getgrist.com';

  this.timeout(20000);
  testUtils.setTmpLogLevel('error');

  describe('GRIST_SINGLE_ORG=exampleorg (non-docs value)', function() {
    before(async function() {
      oldEnv = new testUtils.EnvironmentSnapshot();
      // Set GRIST_SINGLE_ORG to a non-"docs" value to reproduce the bug
      process.env.GRIST_SINGLE_ORG = 'exampleorg';
      process.env.GRIST_DEFAULT_EMAIL = chimpyEmail;

      server = new TestServer(this);
      homeUrl = await server.start(['home', 'docs']);
      dbManager = server.dbManager;
    });

    after(async function() {
      oldEnv.restore();
      await server.stop();
    });

    it('GET /api/orgs returns personal org', async function() {
      const resp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      assert.equal(resp.status, 200);
      assert.isArray(resp.data);

      // Personal org should be included in the list
      const personalOrg = resp.data.find((org: any) => org.owner);
      assert.exists(personalOrg, 'Personal org should be returned by /api/orgs');
      assert.equal(personalOrg.owner.email, chimpyEmail);
    });

    it('GET /api/orgs/:oid works for personal org', async function() {
      // First get the personal org ID
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // Now fetch the personal org by ID
      const orgResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}`, chimpy);
      assert.equal(orgResp.status, 200);
      assert.equal(orgResp.data.id, personalOrg.id);
      assert.equal(orgResp.data.owner.email, chimpyEmail);
    });

    it('GET /api/orgs/:oid/workspaces returns workspaces from personal org', async function() {
      // First get the personal org ID
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // Get workspaces in personal org
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      assert.equal(wsResp.status, 200);
      assert.isArray(wsResp.data);
    });

    it('POST /api/workspaces/:wid/docs can create doc in personal org workspace', async function() {
      // Get personal org
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // Get workspaces
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      assert.isNotEmpty(wsResp.data);
      const workspace = wsResp.data[0];

      // Create a document
      const docResp = await axios.post(
        `${homeUrl}/api/workspaces/${workspace.id}/docs`,
        {name: 'TestDoc'},
        chimpy
      );
      assert.equal(docResp.status, 200);
      assert.isString(docResp.data);
    });

    it('GET /api/docs/:did works for document in personal org (THE FIX)', async function() {
      // This is the critical test that reproduces the bug from the issue

      // Get personal org
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg, 'Personal org should exist');

      // Get workspaces
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      assert.isNotEmpty(wsResp.data, 'Personal org should have workspaces');
      const workspace = wsResp.data[0];

      // Create a document
      const docResp = await axios.post(
        `${homeUrl}/api/workspaces/${workspace.id}/docs`,
        {name: 'PersonalOrgTestDoc'},
        chimpy
      );
      assert.equal(docResp.status, 200);
      const docId = docResp.data;

      // THIS IS THE KEY TEST: Access the document
      // Before the fix, this would return 404
      // After the fix, this should return 200
      const getDocResp = await axios.get(`${homeUrl}/api/docs/${docId}`, chimpy);
      assert.equal(getDocResp.status, 200,
        'Document in personal org should be accessible when GRIST_SINGLE_ORG is set');
      assert.equal(getDocResp.data.id, docId);
      assert.equal(getDocResp.data.name, 'PersonalOrgTestDoc');
      assert.equal(getDocResp.data.workspace.org.owner.email, chimpyEmail,
        'Document should belong to personal org');
    });

    it('Complete workflow: list orgs → create doc → access doc', async function() {
      // This test verifies the complete workflow from the issue description

      // 1. GET /api/orgs - should include personal org
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      assert.equal(orgsResp.status, 200);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // 2. GET /api/orgs/:oid - should work for personal org
      const orgResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}`, chimpy);
      assert.equal(orgResp.status, 200);

      // 3. POST /api/workspaces/:wid/docs - should work
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      const workspace = wsResp.data[0];
      const docResp = await axios.post(
        `${homeUrl}/api/workspaces/${workspace.id}/docs`,
        {name: 'WorkflowTestDoc'},
        chimpy
      );
      assert.equal(docResp.status, 200);
      const docId = docResp.data;

      // 4. GET /api/docs/:did - should work (this was broken before)
      const getDocResp = await axios.get(`${homeUrl}/api/docs/${docId}`, chimpy);
      assert.equal(getDocResp.status, 200);
      assert.equal(getDocResp.data.id, docId);
    });
  });

  describe('GRIST_SINGLE_ORG=docs (merged org)', function() {
    before(async function() {
      oldEnv = new testUtils.EnvironmentSnapshot();
      // Test that the special "docs" value still works as before
      process.env.GRIST_SINGLE_ORG = 'docs';
      process.env.GRIST_DEFAULT_EMAIL = chimpyEmail;

      server = new TestServer(this);
      homeUrl = await server.start(['home', 'docs']);
      dbManager = server.dbManager;
    });

    after(async function() {
      oldEnv.restore();
      await server.stop();
    });

    it('Personal org documents are accessible with GRIST_SINGLE_ORG=docs', async function() {
      // Get personal org
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // Get workspace and create document
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      const workspace = wsResp.data[0];
      const docResp = await axios.post(
        `${homeUrl}/api/workspaces/${workspace.id}/docs`,
        {name: 'DocsTestDoc'},
        chimpy
      );
      const docId = docResp.data;

      // Access the document - should work as before
      const getDocResp = await axios.get(`${homeUrl}/api/docs/${docId}`, chimpy);
      assert.equal(getDocResp.status, 200);
      assert.equal(getDocResp.data.id, docId);
    });
  });

  describe('No GRIST_SINGLE_ORG', function() {
    before(async function() {
      oldEnv = new testUtils.EnvironmentSnapshot();
      // Test without GRIST_SINGLE_ORG to ensure we didn't break normal operation
      delete process.env.GRIST_SINGLE_ORG;
      process.env.GRIST_DEFAULT_EMAIL = chimpyEmail;

      server = new TestServer(this);
      homeUrl = await server.start(['home', 'docs']);
      dbManager = server.dbManager;
    });

    after(async function() {
      oldEnv.restore();
      await server.stop();
    });

    it('Personal org documents are accessible without GRIST_SINGLE_ORG', async function() {
      // Verify existing behavior is preserved when GRIST_SINGLE_ORG is not set

      // Get personal org
      const orgsResp = await axios.get(`${homeUrl}/api/orgs`, chimpy);
      const personalOrg = orgsResp.data.find((org: any) => org.owner);
      assert.exists(personalOrg);

      // Get workspace and create document
      const wsResp = await axios.get(`${homeUrl}/api/orgs/${personalOrg.id}/workspaces`, chimpy);
      const workspace = wsResp.data[0];
      const docResp = await axios.post(
        `${homeUrl}/api/workspaces/${workspace.id}/docs`,
        {name: 'NoSingleOrgTestDoc'},
        chimpy
      );
      const docId = docResp.data;

      // Access the document - should work as always
      const getDocResp = await axios.get(`${homeUrl}/api/docs/${docId}`, chimpy);
      assert.equal(getDocResp.status, 200);
      assert.equal(getDocResp.data.id, docId);
    });
  });
});
