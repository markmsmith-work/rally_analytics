(function() {
  var AnalyticsQuery, AtAnalyticsQuery, AtArrayAnalyticsQuery, BetweenAnalyticsQuery, GuidedAnalyticsQuery, TimeInStateAnalyticsQuery, TransitionsAnalyticsQuery, root, type;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; };

  root = this;

  type = (function() {
    var classToType, name, _i, _len, _ref;
    classToType = {};
    _ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function(obj) {
      var strType;
      strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  })();

  AnalyticsQuery = (function() {

    function AnalyticsQuery(config, _XHRClass) {
      var addRequiredHeader, key, os, platform, userAgent, value, _ref;
      this._XHRClass = _XHRClass;
      this._gotResponse = __bind(this._gotResponse, this);
      this.debug = false;
      if (this._XHRClass == null) {
        throw new Error('Must provide an XHRClass as the second parameter for this AnalyticsQuery constructor.');
      }
      this._xhr = null;
      this._find = null;
      this._fields = null;
      this._sort = {
        _ValidFrom: 1
      };
      this._startIndex = 0;
      this._pageSize = 10000;
      this._callback = null;
      this.headers = {};
      this.headers['X-RallyIntegrationLibrary'] = 'rally_analytics-0.1.0';
      if (typeof navigator !== "undefined" && navigator !== null) {
        platform = navigator.appName + ' ' + navigator.appVersion;
        userAgent = navigator.userAgent;
        os = navigator.platform;
      } else if (typeof process !== "undefined" && process !== null) {
        platform = 'Node.js (or some other non-browser) ' + process.version;
        userAgent = 'Rally analytics toolkit on Node.js (or some other non-browser)';
        os = process.platform;
      }
      this.headers['X-RallyIntegrationPlatform'] = platform;
      this.headers['X-RallyIntegrationOS'] = os;
      this.headers['User-Agent'] = userAgent;
      _ref = config.additionalHeaders;
      for (key in _ref) {
        value = _ref[key];
        this.headers[key] = value;
      }
      addRequiredHeader = function(headers, key) {
        if (config[key] != null) {
          return headers[key] = config[key];
        } else {
          throw new Error("Must include config[" + key + "] header when instantiating this rally_analytics.AnalyticsQuery object");
        }
      };
      addRequiredHeader(this.headers, 'X-RallyIntegrationName');
      addRequiredHeader(this.headers, 'X-RallyIntegrationVendor');
      addRequiredHeader(this.headers, 'X-RallyIntegrationVersion');
      if (config.workspaceOID != null) {
        this.workspaceOID = config.workspaceOID;
      } else {
        throw new Error('Must provide a config.workspaceOID');
      }
      this.username = config.username;
      this.password = config.password;
      this.protocol = "https";
      this.server = "rally1.rallydev.com";
      this.service = "analytics";
      this.version = "1.29";
      this.endpoint = "artifact/snapshot/query.js";
      this._firstPage = true;
      this.ETLDate = null;
      this.lastResponseText = '';
      this.lastResponse = {};
      this.lastMeta = {};
      this.allResults = [];
      this.allMeta = [];
    }

    AnalyticsQuery.prototype.find = function(_find) {
      this._find = _find;
      return this;
    };

    AnalyticsQuery.prototype.sort = function(_sort) {
      this._sort = _sort;
      return this;
    };

    AnalyticsQuery.prototype.fields = function(_fields) {
      this._fields = _fields;
      return this;
    };

    AnalyticsQuery.prototype.start = function(_startIndex) {
      this._startIndex = _startIndex;
      return this;
    };

    AnalyticsQuery.prototype.startIndex = function(_startIndex) {
      this._startIndex = _startIndex;
      return this;
    };

    AnalyticsQuery.prototype.pagesize = function(_pageSize) {
      this._pageSize = _pageSize;
      return this;
    };

    AnalyticsQuery.prototype.pageSize = function(_pageSize) {
      this._pageSize = _pageSize;
      return this;
    };

    AnalyticsQuery.prototype.auth = function(username, password) {
      this.username = username;
      this.password = password;
      return this;
    };

    AnalyticsQuery.prototype.getBaseURL = function() {
      return this.protocol + '://' + [this.server, this.service, this.version, this.workspaceOID, this.endpoint].join('/');
    };

    AnalyticsQuery.prototype.getQueryString = function() {
      var findString, queryArray;
      findString = JSON.stringify(this._find);
      if ((this._find != null) && findString.length > 2) {
        queryArray = [];
        queryArray.push('find=' + encodeURIComponent(findString));
        if (this._sort != null) {
          queryArray.push('sort=' + encodeURIComponent(JSON.stringify(this._sort)));
        }
        if (this._fields != null) {
          queryArray.push('fields=' + encodeURIComponent(JSON.stringify(this._fields)));
        }
        queryArray.push('start=' + this._startIndex);
        queryArray.push('pagesize=' + this._pageSize);
        return queryArray.join('&');
      } else {
        throw new Error('find clause not set');
      }
    };

    AnalyticsQuery.prototype.getURL = function() {
      return this.getBaseURL() + '?' + this.getQueryString();
    };

    AnalyticsQuery.prototype.getAll = function(_callback) {
      var key, value, _ref;
      this._callback = _callback;
      if (this._find == null) {
        throw new Error('Must set find clause before calling getAll');
      }
      this._xhr = new this._XHRClass();
      this._xhr.onreadystatechange = this._gotResponse;
      this._xhr.open('GET', this.getURL(), true, this.username, this.password);
      _ref = this.headers;
      for (key in _ref) {
        value = _ref[key];
        this._xhr.setRequestHeader(key, value);
      }
      this._xhr.send();
      return this;
    };

    AnalyticsQuery.prototype._gotResponse = function() {
      var key, newFind, newMeta, o, value, _i, _len, _ref, _ref2, _ref3, _return;
      var _this = this;
      if (this._xhr.readyState === 4) {
        _return = function() {
          _this._firstPage = true;
          _this._startIndex = 0;
          _this.ETLDate = null;
          return _this._callback.call(_this);
        };
        this.lastResponseText = this._xhr.responseText;
        if (this.debug) console.log('\nlastResponse\n' + this.lastResponseText);
        this.lastResponse = JSON.parse(this.lastResponseText);
        if (false) {
          return _return();
        } else {
          if (this._firstPage) {
            this._firstPage = false;
            this.allResults = [];
            this.allMeta = [];
            this.ETLDate = this.lastResponse.ETLDate;
            this._pageSize = this.lastResponse.PageSize;
            newFind = {
              '$and': [
                this._find, {
                  '_ValidFrom': {
                    '$lte': this.ETLDate
                  }
                }
              ]
            };
            this._find = newFind;
          } else {

          }
          _ref = this.lastResponse.Results;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            o = _ref[_i];
            this.allResults.push(o);
          }
          newMeta = {};
          _ref2 = this.lastResponse;
          for (key in _ref2) {
            value = _ref2[key];
            if (key !== 'Results') newMeta[key] = value;
          }
          this.allMeta.push(newMeta);
          if (this.lastResponse.Results.length + this.lastResponse.StartIndex >= this.lastResponse.TotalResultCount) {
            return _return();
          } else {
            this._startIndex += this._pageSize;
            this._xhr = new this._XHRClass();
            this._xhr.onreadystatechange = this._gotResponse;
            this._xhr.open('GET', this.getURL(), true, this.username, this.password);
            _ref3 = this.headers;
            for (key in _ref3) {
              value = _ref3[key];
              this._xhr.setRequestHeader(key, value);
            }
            return this._xhr.send();
          }
        }
      }
    };

    return AnalyticsQuery;

  })();

  GuidedAnalyticsQuery = (function() {

    __extends(GuidedAnalyticsQuery, AnalyticsQuery);

    function GuidedAnalyticsQuery(config, _XHRClass) {
      this._XHRClass = _XHRClass;
      GuidedAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      this._scope = {};
      this._type = null;
      this._additionalCriteria = [];
    }

    GuidedAnalyticsQuery.prototype.generateFind = function() {
      var c, compoundArray, _i, _len, _ref, _ref2;
      compoundArray = [];
      if (JSON.stringify(this._scope).length > 2) {
        compoundArray.push(this._scope);
      } else {
        throw new Error('Must set scope first.');
      }
      if (this._type != null) compoundArray.push(this._type);
      _ref = this._additionalCriteria;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        compoundArray.push(c);
      }
      if ((0 < (_ref2 = compoundArray.length) && _ref2 < 2)) {
        return compoundArray[0];
      } else {
        return {
          '$and': compoundArray
        };
      }
    };

    GuidedAnalyticsQuery.prototype.find = function() {
      if (arguments.length > 0) {
        throw new Error('Do not call find() directly to set query. Use scope(), type(), and additionalCriteria()');
      }
      return GuidedAnalyticsQuery.__super__.find.call(this, this.generateFind());
    };

    GuidedAnalyticsQuery.prototype.resetScope = function() {
      return this._scope = {};
    };

    GuidedAnalyticsQuery.prototype.scope = function(key, value) {
      var addToScope, k, v;
      var _this = this;
      addToScope = function(k, v) {
        var okKeys;
        if (k === 'ItemHierarchy') k = '_ItemHierarchy';
        if (k === 'Tag') k = 'Tags';
        okKeys = ['Project', 'Iteration', 'Release', 'Tags', '_ItemHierarchy'];
        if (__indexOf.call(okKeys, k) < 0) {
          throw new Error("Key for scope() call must be one of " + okKeys);
        }
        if (type(v) === 'array') {
          return _this._scope[k] = {
            '$in': v
          };
        } else {
          return _this._scope[k] = v;
        }
      };
      if (type(key) === 'object') {
        for (k in key) {
          v = key[k];
          addToScope(k, v);
        }
      } else if (arguments.length === 2) {
        addToScope(key, value);
      } else {
        throw new Error('Must provide Object in first parameter or two parameters (key, value).');
      }
      return this;
    };

    GuidedAnalyticsQuery.prototype.type = function(type) {
      this._type = {
        '_Type': type
      };
      return this;
    };

    GuidedAnalyticsQuery.prototype.resetAdditionalCriteria = function() {
      return this._additionalCriteria = [];
    };

    GuidedAnalyticsQuery.prototype.additionalCriteria = function(criteria) {
      this._additionalCriteria.push(criteria);
      return this;
    };

    GuidedAnalyticsQuery.prototype.leafOnly = function() {
      this.additionalCriteria({
        '$or': [
          {
            _Type: "HierarchicalRequirement",
            Children: null
          }, {
            _Type: "PortfolioItem",
            Children: null,
            UserStories: null
          }
        ]
      });
      return this;
    };

    GuidedAnalyticsQuery.prototype.getAll = function(callback) {
      this.find();
      return GuidedAnalyticsQuery.__super__.getAll.call(this, callback);
    };

    return GuidedAnalyticsQuery;

  })();

  AtAnalyticsQuery = (function() {

    __extends(AtAnalyticsQuery, GuidedAnalyticsQuery);

    function AtAnalyticsQuery(config, _XHRClass, zuluDateString) {
      this._XHRClass = _XHRClass;
      AtAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      if (zuluDateString == null) {
        throw new Error('Must provide a zuluDateString when instantiating an AtAnalyticsQuery.');
      }
      this._additionalCriteria.push({
        _ValidFrom: {
          '$lte': zuluDateString
        },
        _ValidTo: {
          '$gt': zuluDateString
        }
      });
    }

    return AtAnalyticsQuery;

  })();

  AtArrayAnalyticsQuery = (function() {

    __extends(AtArrayAnalyticsQuery, GuidedAnalyticsQuery);

    function AtArrayAnalyticsQuery(config, _XHRClass, arrayOfZuluDates) {
      this._XHRClass = _XHRClass;
      AtArrayAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      throw new Error('AtArrayAnalyticsQuery is not yet implemented');
    }

    return AtArrayAnalyticsQuery;

  })();

  BetweenAnalyticsQuery = (function() {

    __extends(BetweenAnalyticsQuery, GuidedAnalyticsQuery);

    function BetweenAnalyticsQuery(config, _XHRClass, zuluDateString1, zuluDateString2) {
      var criteria;
      this._XHRClass = _XHRClass;
      BetweenAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      if (!((zuluDateString1 != null) && (zuluDateString2 != null))) {
        throw new Error('Must provide two zuluDateStrings when instantiating a BetweenAnalyticsQuery.');
      }
      criteria = {
        '$or': [
          {
            _ValidFrom: {
              '$lte': zuluDateString1
            },
            _ValidTo: {
              '$gt': zuluDateString1
            }
          }, {
            _ValidFrom: {
              '$gte': zuluDateString1,
              '$lt': zuluDateString2
            }
          }
        ]
      };
      this._additionalCriteria.push(criteria);
      this.sort({
        _ValidFrom: 1
      });
    }

    return BetweenAnalyticsQuery;

  })();

  TimeInStateAnalyticsQuery = (function() {

    __extends(TimeInStateAnalyticsQuery, GuidedAnalyticsQuery);

    function TimeInStateAnalyticsQuery(config, _XHRClass, arrayOfZuluDates) {
      this._XHRClass = _XHRClass;
      TimeInStateAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      throw new Error('Not yet implemented');
    }

    return TimeInStateAnalyticsQuery;

  })();

  TransitionsAnalyticsQuery = (function() {

    __extends(TransitionsAnalyticsQuery, GuidedAnalyticsQuery);

    function TransitionsAnalyticsQuery(config, _XHRClass, arrayOfZuluDates) {
      this._XHRClass = _XHRClass;
      TransitionsAnalyticsQuery.__super__.constructor.call(this, config, this._XHRClass);
      throw new Error('Not yet implemented');
    }

    return TransitionsAnalyticsQuery;

  })();

  root.AnalyticsQuery = AnalyticsQuery;

  root.GuidedAnalyticsQuery = GuidedAnalyticsQuery;

  root.AtAnalyticsQuery = AtAnalyticsQuery;

  root.AtArrayAnalyticsQuery = AtArrayAnalyticsQuery;

  root.BetweenAnalyticsQuery = BetweenAnalyticsQuery;

  root.TimeInStateAnalyticsQuery = TimeInStateAnalyticsQuery;

  root.TransitionsAnalyticsQuery = TransitionsAnalyticsQuery;

}).call(this);
