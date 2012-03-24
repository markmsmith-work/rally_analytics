(function() {

  /*
  ## AnalyticsQuery configuration ##
  
  This config example is valid for all the query forms shown here
  
      config =
        'X-RallyIntegrationName': 'My header'
        requiredHeader2: 'My header2'
        additionalHeaders: [ 
          #
        ]
        username: 'anyone@anywhere.com' # If left off, will prompt user
        password: 'xxxxx'
        
  ## Raw AnalyticsQuery ##
  
  Create a AnalyticsQuery object with a config like above and an injected Class implementing a subset of the XMLHTTPRequest interface
      
      query = new rally_analytics.AnalyticsQuery(config, XMLHttpRequest)
  
  Then you must set the query. `find` is required but you can also specify sort, fields, etc.
  
      query.find({Project: 1234, Tag: 'Expedited', _At: '2012-01-01'}).sort({_ValidFrom:1}).fields(['ScheduleState'])
      
  Finally, call getAll()
  
      query.getAll(callback)
      
  ## Guided AnalyticsQuery (preferred) ##
      
  To help you write performant queries against the non-traditional data model of Rally's Analytics engine, we provide a guided mode 
  for composing queries. Like the raw AnalyticsQuery, you start by creating a GuidedAnalyticsQuery Object. 
  
      query = new GuidedAnalyticsQuery(config, XMLHttpRequest)
  
  **Scope**
  
  Then you must specify at least one highly selective criteria using the scope method:
  
      query.scope('Project', 1234) # or [1234, 5678]
      query.scope('Iteration', 1234) # or [1234, 5678]
      query.scope('Release', 1234) # or [1234, 5678]
      query.scope('_ItemHierarchy', 1234) # also accepts 'ItemHierarchy'
      query.scope('Tags', 'Top 10') # or ['Top 10', 'Expedite'], also accepts Tag
      
  Alternatively, you can specify your scope in one big object:
  
      query.scope({
        Project: 1234,
        Iteration: [1234, 5678, ...],
        ...
      })
      
  To reset the scope setting use the above form with a blank object:
  
      query.scope({})
      
  **Type**
  
  You can optionally limit your query to one or more work item types. Defaults to all types.
  
      query.type('Defect') # alteratively ['Defect', 'HierarchicalRequirement']
  
  **Additional Criteria**
  
  You can also specify additiona critaria. This can be useful for defining "sub-classes" of work items.
      
      query.additionalCriteria({Environment: 'Production'})
  
  ## Patterned AnalyticsQuery (even more preferred) ##
  
  Even better than the guided query, there are several sub-classes of GuidedAnalyticsQuery that implement the most
  common query patterns. It is recommended that you use this mode as much as possible because whenever 
  server-side support is added to make these more efficient, these clases will be upgraded to take advantage
  of those upgrades with no impact on your client code.
  
  **Between**
  
  This pattern will return all of the snapshots related to a particular timebox. The results are in the form expected by the 
  Lumenize function `snapshotArray_To_AtArray`, which will tell you what each work item looked like at a provided list of
  datetimes. This is the current recommended approach for most time-series charts. The burncalculator and cfdcalculator
  use this approach. Note: the 'AtArray' approach will supercede this for time-series charts at some point in the future.
    
      query = new BetweenAnalyticsQuery(config, XMLHttpRequest, '2012-01-01T12:34:56.789Z', '2012-01-10T12:34:56.789Z')
  
  It will expand to a query like this:
  
      $or:[
        {_ValidFrom: {$lte: <first_date_parameter>}, _ValidTo: {$gt:<first_date_parameter>}},  # Snapshot at start
        {_ValidFrom: {$gte: <first_date_parameter>, $lt:<second_date_parameter>}} # All remaining snapshots
      ]
  
  **At**
  
  This pattern will tell you what a set of Artfacts looked like at particular moments in time
    
      query = new AtAnalyticsQuery(config, XMLHttpRequest, '2012-01-01T12:34:56.789Z')
      
  It will expand to a query like this:
      
      {_ValidFrom: {$lte: <provided-date>}, _ValidTo: {$gt:<provided-date>}}
  
  or use the server-side equivalent to.
      
  **AtArray (not yet implemented)**
  
  This pattern is not implemented at this time but the intention is for it to tell you what a 
  set of Artfacts looked like at particular moments in time. In the mean time, use the "Between"
  pattern defined above combined with the Lumenize `snapshotArray_To_AtArray` function. 
  Eventually, this will be the ideal pattern to use for Burn charts, CFD charts, and most time-series charts
  It's the same as the 'At' pattern except that the second parameter can be a list of timestamps.
     
      query = new AtArrayAnalyticsQuery(config, XMLHttpRequest, ['2012-01-01T12:34:56.789Z', '2012-01-02T12:34:56.789Z', ...])
      
  Altneratively, we may make it possible to submit a ChartTimeIterator spec.
  
  The way to implement this in the short term is to use the Between pattern and wrap in the Lumenize 
  `snapshotArray_To_AtArray` transformation.
     
  Note: it's tempting to try to make this more efficient by just looking for snapshots where the fields of interest change. 
  However, that approach would not pick up on the deletions/restores nor the changing of the work item so it no longer meets 
  the other criteria.
    
  Note: when/if there is server-side support for finding the results at these points in time, this query pattern will be updated
  to take advantage of it.
  
  **TimeInState**
    
  This pattern will only return snapshots where the specified clause is true.
  This is useful for Cycle Time calculations as well as calculating Flow Efficiency or Blocked Time.
  
      query = new TimeInStateAnalyticsQuery(config, XMLHttpRequest, {KanbanState: {$gte: 'In Dev', $lt: 'Accepted'}})
  
  **Transitions**
  
  This pattern will return the snapshots where the _PreviousValue matches the one query clause parameter and the "current"
  value matches the other query clause parameter. In other words, it finds particular transitions. It is useful for 
  Throughput/Velocity calculations. 
  
      query = new TransitionsAnalyticsQuery(config, XMLHttpRequest,
        {ScheduleState: {$lt: 'Accepted'}}, 
        {ScheduleState: {$gte: 'Accepted'}}
      )
  
  The second predicate is actually converted such that any non-operator key is prepended with "_PreviousValues.". In the example
  above, "{ScheduleState: {$lt: 'Accepted'}}" becomes "{'_PreviousValues.ScheduleState': {$lt: 'Accepted'}}". So this will return
  the snapshots that made this particular transition from before state to after state.
  
  Note, you should also run the query swapping the two predicates and subtract the two calculations before reporting a Thoughput or 
  Velocity result. Without doing so, any story that crosses the boudary multiple times would get double, triple, etc. counted.
  
  In a future version, you may be able to specify aggregation functions ($count, $sum, $push, etc.) on a particular field when 
  making this query, because when you use this pattern, you are usually interested in the sum or count and not the actual snapshots.
  In the mean time, if you are only interested in the count, simply specify pagesize of 1 and inspect the TotalResultCount in the top
  section of the response.
  
  There is a good reason that Throughput and Velocity are defined with two predicates rather than just specifying the line to the left
  of "Accepted". Let's say, work is not really "Accepted" until the Ready flag is checked. You could write that query like so:
  
      query = new TransitionsAnalyticsQuery(config, XMLHttpRequest,
        {$or:[KanbanState: {$lt: 'Accepted'}, {KanbanState: {$gte: 'Accepted'}, Ready: false}]}, 
        {KanbanState: {$gte: 'Accepted'}, Ready: true}
      )
  */

  var analyticsquery, root;

  root = this;

  analyticsquery = require('./analyticsquery');

  root.AnalyticsQuery = analyticsquery.AnalyticsQuery;

  root.GuidedAnalyticsQuery = analyticsquery.GuidedAnalyticsQuery;

  root.AtAnalyticsQuery = analyticsquery.AtAnalyticsQuery;

  root.AtArrayAnalyticsQuery = analyticsquery.AtArrayAnalyticsQuery;

  root.BetweenAnalyticsQuery = analyticsquery.BetweenAnalyticsQuery;

  root.TimeInStateAnalyticsQuery = analyticsquery.TimeInStateAnalyticsQuery;

  root.TransitionsAnalyticsQuery = analyticsquery.PreviousToCurrentAnalyticsQuery;

}).call(this);
