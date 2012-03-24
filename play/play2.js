(function() {
  var AnalyticsQuery, XMLHttpRequest, callback, config, password, query, rally_analytics, username;

  XMLHttpRequest = require("../node_modules/node-XMLHttpRequest").XMLHttpRequest;

  rally_analytics = require('../');

  AnalyticsQuery = rally_analytics.AnalyticsQuery;

  if (typeof process !== "undefined" && process !== null) {
    username = process.env.RALLY_USERNAME;
    password = process.env.RALLY_PASSWORD;
  }

  config = {
    'X-RallyIntegrationName': 'testName',
    'X-RallyIntegrationVendor': 'testRally',
    'X-RallyIntegrationVersion': '0.1.0',
    workspaceOID: 41529001
  };

  callback = function() {
    console.log(this.allResults);
    return console.log(this.allResults.length);
  };

  query = new AnalyticsQuery(config, XMLHttpRequest);

  query.debug = false;

  query.protocol = 'https';

  query.server = 'rally1.rallydev.com';

  query.service = 'analytics';

  query.version = '1.27';

  query.find({
    _ItemHierarchy: 1443125795,
    "_PreviousValues.KanbanState": {
      $exists: true
    }
  });

  query.pagesize(10000);

  query.fields(['KanbanState', 'ObjectID']);

  query.getAll(callback);

}).call(this);
