###
Rally Analytics

This project makes it easier to get data from Rally's Analytics web services endpoints. Due to the magic of service/desktop-side 
JavaScript provided by Node.js, it serves as both a REST Toolkit, for script-based access, as well as a data access library for 
running inside of a browser.

Useful links:

* API Documentation for this data access library/REST toolkit
* Full user documentation for the Analytics API

## Concepts ##

In order for you to be productive using the Rally Analytics API, there are two things you'll need to wrap your head around:

1. The MVCC-like snapshot data model
2. The MongoDB-like query language

**Snapshot Data Model***

The data model for the repository that sits under this API has been carefully crafted for efficient analytics. It is particularly 
well suited to seeing how your data changes over time which is the focus of most reports (burn charts, defect trend, cumulative flow, etc.). 
The data is stored in a snapshot schema which means that every time there is a change, an entirely new snapshot of the effected entity is 
saved with the new values (as well as the previous ones). The older snapshot is not removed. It is only updated to adjust its _ValidTo timestamp. 

Let's say you have this:

    {
      _id: 'B2E...',       # GUID just for analytics engine
      ObjectID: 777,  # objectID (OID) from Rally
      Name: "Footer disappears when using new menu",
      State: "Submitted",
      _ValidFrom: "2011-01-01T12:34:56Z",
      _ValidTo: "9999-01-01T00:00:00Z",    # "current" snapshot
      OtherField: 'Other Value'  # ... Other fields not shown
    }

Then on January 2, 2011, at noon GMT, the analytics engine receives a notice that Rally object 777 had its "State" field changed from "Submitted" 
to "Open". The latest record for rally object 777 is read. Its _validTo is updated but nothing else is changed in that record. Rather, a new record 
is created showing the new value as well as the previous values for the field(s) that changed. So, the repository would now contain the updated 
original plus the new snapshot like so:

    {
      _id: 'B2E...',       # GUID just for analytics engine
      ObjectID: 777,  # objectID (OID) from Rally
      Name: "Footer disappears when using new menu",
      State: "Submitted",
      _ValidFrom: "2011-01-01T12:34:56Z",  
      _ValidTo: "2011-01-02T12:00:00Z", # updated
      OtherField: 'Other Value'  # ... Other fields not shown
    }

    {
      _id: 'A37...',       # a new analytics "document" so it gets a new _id
      ObjectID: 777,  # same Rally OID
      Name: "Footer disappears when using new menu",
      State: "Open",
      _ValidFrom: "2011-01-02:12:00:00Z",  # equals B2E’s _ValidTo
      _ValidTo: "9999-01-01T00:00:00Z",    
      _PreviousValues: {
        State: "Submitted"
      },
      OtherField: 'Other Value'  # ... Other fields not shown
    }

Things to note:

* Every time there is a change, an entirely new snapshot of the effected entity is saved with the new values (as well as the unchanged ones).  
* The _PreviousValues field stores the values that were replaced when this particular snapshot was added.
* The way _ValidFrom and _ValidTo are manipulated, you can rely upon the property that for a given Rally ObjectID, only one version of the object 
  will be active for any moment in time.
* Null (<No Entry>) values are not stored except...
* There is a special case where a value is changed from null to a non-null value. In this case, the _PreviousValues field will explicitly say 
  that it was null before the change.
  
**The Query Language**

The query language understood by Rally's Analytics API, is based upon the MongoDB query language. You string together a number of
clauses to pull back the "documents" of interest. This API supports the following operators.

* {a: 10} - docs where a is 10 or an array containing the value 10
* {a: 10, b: "hello"} - docs where a is 10 and b is "hello"
* {a: {$gt: 10}} - docs where a > 10, also $lt, $gte, and $lte   
* {a: {$ne: 10}} - docs where a != 10 
* {a: {$in: [10, "hello"]}} - docs where a is either 10 or "hello"
* {a: {$exists: true}} - docs containing an "a" field
* {a: {$exists: false}} - docs not containing an "a" field
* {a: {$type: 2}} - docs where a is a string (see bsonspec.org for more types)
* {a: /foo.*bar/} - docs where a matches the regular expression "foo.*bar"
* {"a.b": 10} - docs where a is an embedded document where b is 10
* {$or: [{a: 1}, {b: 2}]} - docs where a is 1 or b is 2
* {$and: [{a: 1}, {b: 2}]} - docs where a is 1 and b is 2

## Usage ##

More usage examples are provided in the API Documentation for each Class/Method but here is a quick walkthrough of a common usage.

First, you need to "require" the desired analytics query class(es). We're also going to require a mock
for the XMLHttpResponse Object but you will simply pass in the browser's XMHttpRequest Object (or 
the equivalent from node-XMLHttpRequest if running on node.js)

    rally_analytics = require('../')
    {GuidedAnalyticsQuery, XHRMock} = rally_analytics

Then, you need to set the config Object.

    config =
      'X-RallyIntegrationName': 'My Chart'
      'X-RallyIntegrationVendor': 'My Company'
      'X-RallyIntegrationVersion': '0.1.0'
      username: null  # if running in browser, will prompt
      password: null  # if running in Node.js will look for RALLY_USERNAME/RALLY_PASSWORD environment variables
      workspaceOID: 12345
      additionalHeaders: [ 
        someHeader: 'Some Value'
      ]
      
Now you are ready to instantiate your analytics query.
      
    query = new GuidedAnalyticsQuery(config, XHRMock)  # You would use XMLHttpRequest
    
And, specify query clauses.

    query.type('HierarchicalRequirement')
         .scope('_ProjectHierarchy', 1234)
         .leafOnly()
         .additionalCriteria({Blocked: true})
    
Next, specify a callback.

    callback = () ->
      console.log(this.allResults.length)  # will spit back 5 from our XHRMock
    # 5

Finally, call getAll()

    query.getAll(callback)
            
###
root = this

root.XHRMock = require('../mock/XHRMock').XHRMock

analyticsquery = require('./analyticsquery')
root.AnalyticsQuery = analyticsquery.AnalyticsQuery
root.GuidedAnalyticsQuery = analyticsquery.GuidedAnalyticsQuery
root.AtAnalyticsQuery = analyticsquery.AtAnalyticsQuery
root.AtArrayAnalyticsQuery = analyticsquery.AtArrayAnalyticsQuery
root.BetweenAnalyticsQuery = analyticsquery.BetweenAnalyticsQuery
root.TimeInStateAnalyticsQuery = analyticsquery.TimeInStateAnalyticsQuery
root.TransitionsAnalyticsQuery = analyticsquery.PreviousToCurrentAnalyticsQuery