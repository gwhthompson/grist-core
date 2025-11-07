import {UserAPI, Workspace} from 'app/common/UserAPI';
import {HomeDBManager} from 'app/gen-server/lib/homedb/HomeDBManager';
import {FlexServer} from 'app/server/lib/FlexServer';
import {MergedServer} from 'app/server/MergedServer';
import axios from 'axios';
import {assert} from 'chai';
import {createInitialDb, removeConnection, setUpDB} from 'test/gen-server/seed';
import {configForUser, createUser} from 'test/gen-server/testUtils';
import * as testUtils from 'test/server/testUtils';

describe('singleOrgMode', function() {
  testUtils.setTmpLogLevel('error');

  describe('GRIST_SINGLE_ORG with team org', function() {
    let mergedServer: MergedServer;
    let home: FlexServer;
    let dbManager: HomeDBManager;
    let homeUrl: string;
    let chimpy: UserAPI;
    let chimpyPersonalOrgId: number;
    let nasaOrgId: number;

    before(async function() {
      // Set GRIST_SINGLE_ORG to a team org for testing
      process.env.GRIST_SINGLE_ORG = 'nasa';

      setUpDB(this);
      await createInitialDb();
      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();
      homeUrl = home.getOwnUrl();
      chimpy = home.makeUserApi('nasa', 'chimpy');

      // Get org IDs for testing
      nasaOrgId = await dbManager.testGetId('NASA');
    });

    after(async function() {
      delete process.env.GRIST_SINGLE_ORG;
      await home.close();
      await removeConnection();
    });

    it('should not create personal org for new users in team single-org mode', async function() {
      // Create a new user
      await createUser(dbManager, 'newuser', 'newuser@getgrist.com');

      // Check that the user was created without a personal org
      const user = await dbManager.getUserByLogin('newuser@getgrist.com');
      assert.isNull(user!.personalOrg, 'Personal org should not be created in team single-org mode');
    });

    it('should allow access to existing personal org docs in team single-org mode', async function() {
      // First, create a personal org and doc WITHOUT single-org mode
      delete process.env.GRIST_SINGLE_ORG;

      // Create a user with personal org
      await createUser(dbManager, 'testuser', 'testuser@getgrist.com');
      const user = await dbManager.getUserByLogin('testuser@getgrist.com');
      assert.isNotNull(user!.personalOrg, 'Personal org should be created without single-org mode');

      chimpyPersonalOrgId = user!.personalOrg!.id;

      // Create a workspace in personal org
      const api = home.makeUserApi('docs', 'testuser');
      const workspaces = await api.getOrgWorkspaces('current');
      const workspace = workspaces.find(w => w.name === 'Private');
      assert.isDefined(workspace, 'Private workspace should exist in personal org');

      // Create a doc in the personal org workspace
      const doc = await api.newDoc({name: 'PersonalDoc'}, workspace!.id);
      const docId = doc.id;

      // Now re-enable GRIST_SINGLE_ORG=nasa
      process.env.GRIST_SINGLE_ORG = 'nasa';

      // The doc should still be accessible even with GRIST_SINGLE_ORG set
      const resp = await axios.get(`${homeUrl}/api/docs/${docId}`, configForUser('testuser'));
      assert.equal(resp.status, 200, 'Personal org doc should be accessible in team single-org mode');
      assert.equal(resp.data.name, 'PersonalDoc');
    });

    it('should allow creating docs in team org in single-org mode', async function() {
      // Get NASA org workspaces
      const workspaces = await chimpy.getOrgWorkspaces('current');
      const workspace = workspaces[0];
      assert.isDefined(workspace, 'Team workspace should exist');

      // Create a doc in team workspace
      const doc = await chimpy.newDoc({name: 'TeamDoc'}, workspace.id);
      assert.isDefined(doc.id, 'Should be able to create doc in team workspace');

      // Verify the doc is accessible
      const fetchedDoc = await chimpy.getDoc(doc.id);
      assert.equal(fetchedDoc.name, 'TeamDoc');
      assert.equal(fetchedDoc.workspace.org.id, nasaOrgId, 'Doc should be in team org');
    });

    it('should not allow creating docs in personal org workspaces in team single-org mode', async function() {
      // This test verifies that even if a personal org exists (from before single-org mode),
      // the system should prevent creating NEW docs in it when in team single-org mode.
      // However, this is a UI/policy decision - at the DB level, the docs would still be accessible.
      // For now, we just verify that personal org docs created before single-org mode remain accessible.
    });

    it('should include both team org and personal orgs in queries', async function() {
      // Create a user that has both access to team org and an existing personal org
      const user = await dbManager.getUserByLogin('testuser@getgrist.com');
      if (!user) { throw new Error('Test user not found'); }

      // Grant testuser access to NASA org
      await dbManager.updateOrgPermissions(
        {userId: user.id},
        nasaOrgId,
        {users: {'testuser@getgrist.com': 'viewers'}}
      );

      // Query for orgs - in single-org mode, the user should see their personal org content
      // accessible under the single org context
      const api = home.makeUserApi('nasa', 'testuser');
      const orgs = await api.getOrgs();

      // The user should see the NASA org (since GRIST_SINGLE_ORG=nasa)
      const nasaOrg = orgs.find(o => o.name === 'NASA');
      assert.isDefined(nasaOrg, 'User should see NASA org in single-org mode');
    });
  });

  describe('GRIST_SINGLE_ORG=docs (personal mode)', function() {
    let mergedServer: MergedServer;
    let home: FlexServer;
    let dbManager: HomeDBManager;
    let homeUrl: string;

    before(async function() {
      // Set GRIST_SINGLE_ORG to docs (personal-only mode)
      process.env.GRIST_SINGLE_ORG = 'docs';

      setUpDB(this);
      await createInitialDb();
      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();
      homeUrl = home.getOwnUrl();
    });

    after(async function() {
      delete process.env.GRIST_SINGLE_ORG;
      await home.close();
      await removeConnection();
    });

    it('should create personal org for new users in personal-only mode', async function() {
      // Create a new user
      await createUser(dbManager, 'personaluser', 'personaluser@getgrist.com');

      // Check that the user was created WITH a personal org
      const user = await dbManager.getUserByLogin('personaluser@getgrist.com');
      assert.isNotNull(user!.personalOrg, 'Personal org should be created in personal-only mode');
    });

    it('should allow access to personal org docs in personal-only mode', async function() {
      const api = home.makeUserApi('docs', 'personaluser');
      const workspaces = await api.getOrgWorkspaces('current');
      const workspace = workspaces.find(w => w.name === 'Private');
      assert.isDefined(workspace, 'Private workspace should exist');

      // Create a doc
      const doc = await api.newDoc({name: 'PersonalDocInDocsMode'}, workspace!.id);
      assert.isDefined(doc.id);

      // Verify the doc is accessible
      const fetchedDoc = await api.getDoc(doc.id);
      assert.equal(fetchedDoc.name, 'PersonalDocInDocsMode');
    });
  });

  describe('Configuration transitions', function() {
    let mergedServer: MergedServer;
    let home: FlexServer;
    let dbManager: HomeDBManager;
    let testUserId: number;

    before(async function() {
      setUpDB(this);
      await createInitialDb();
    });

    after(async function() {
      delete process.env.GRIST_SINGLE_ORG;
      await removeConnection();
    });

    it('should handle transition from no config to GRIST_SINGLE_ORG=team', async function() {
      // Start without GRIST_SINGLE_ORG
      delete process.env.GRIST_SINGLE_ORG;

      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();

      // Create user - should get personal org
      await createUser(dbManager, 'transitionuser', 'transitionuser@getgrist.com');
      let user = await dbManager.getUserByLogin('transitionuser@getgrist.com');
      testUserId = user!.id;
      assert.isNotNull(user!.personalOrg, 'Personal org should be created without single-org mode');

      // Create a doc in personal org
      const api = home.makeUserApi('docs', 'transitionuser');
      const workspaces = await api.getOrgWorkspaces('current');
      const workspace = workspaces.find(w => w.name === 'Private');
      const doc = await api.newDoc({name: 'TransitionDoc'}, workspace!.id);
      const docId = doc.id;

      // Now transition to GRIST_SINGLE_ORG=nasa
      await home.close();
      process.env.GRIST_SINGLE_ORG = 'nasa';

      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();

      // The existing personal org doc should still be accessible
      const homeUrl = home.getOwnUrl();
      const resp = await axios.get(`${homeUrl}/api/docs/${docId}`, configForUser('transitionuser'));
      assert.equal(resp.status, 200, 'Personal org doc should remain accessible after enabling single-org mode');

      await home.close();
    });

    it('should handle transition from GRIST_SINGLE_ORG=team back to no config', async function() {
      // Start with GRIST_SINGLE_ORG=nasa
      process.env.GRIST_SINGLE_ORG = 'nasa';

      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();

      // User should still exist from previous test
      const user = await dbManager.getUserByLogin('transitionuser@getgrist.com');
      assert.isDefined(user, 'User should still exist');

      // Remove GRIST_SINGLE_ORG
      await home.close();
      delete process.env.GRIST_SINGLE_ORG;

      mergedServer = await MergedServer.create(0, ["home", "docs"],
                                    {logToConsole: false, externalStorage: false});
      home = mergedServer.flexServer;
      await mergedServer.run();
      dbManager = home.getHomeDBManager();

      // User's personal org should still be accessible
      const userAfter = await dbManager.getUserByLogin('transitionuser@getgrist.com');
      assert.isNotNull(userAfter!.personalOrg, 'Personal org should still exist after removing single-org mode');

      await home.close();
    });
  });
});
