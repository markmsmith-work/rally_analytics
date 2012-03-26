htmlFileString = '''
        <!-- HighCharts -->
        <script type="text/javascript" src="../lib/jquery.min.js" deploy_src="https://people.rallydev.com/js/jquery.min.js"></script>
        <script type="text/javascript" src="../lib/highcharts/js/highcharts.js" deploy_src="https://people.rallydev.com/js/highcharts.js"></script>
        <script type="text/javascript" src="../lib/highcharts/js/modules/exporting.js" deploy_src="https://people.rallydev.com/js/exporting.js"></script>
        <!-- a theme file
            <script type="text/javascript" src="../js/themes/gray.js"></script>
        -->
        
        <!-- Lumenize -->
        <script type="text/javascript" src="../lib/lumenize/deploy/lumenize-min.js" deploy_src="http://lmaccherone.github.com/Lumenize/deploy/lumenize-min.js"></script>
        
        <!-- rally_analytics -->
        <script type="text/javascript" src="../lib/analyticsquery.js"></script> 
        <script type="text/javascript" src="http://lib/analyticsquery.js"></script> 
        
        <!-- my calculator for this chart (optional) -->
'''

processDirectory = (directory) ->
  process.chdir(directory)
  fs.readdir(directory, (err, contents) ->
    files = ("#{file}" for file in contents when (file.indexOf('.html') > 0))

  )
  console.log(files)
  
  rString = '<script +type="text/javascript" +src="([-_a-z0-9A-Z/\.]+)"( +deploy_src="([-_:a-z0-9A-Z/\.]+)" *>)'
  r = new RegExp(rString)
  rOutput = r.exec(htmlFileString)
  while rOutput?
    htmlFileString = htmlFileString.replace(rOutput[0], "<script type=\"text/javascript\" src=\"#{rOutput[3]}\">")
    rOutput = r.exec(htmlFileString)
  
  console.log(htmlFileString)
  
  r2String = '<script +type="text/javascript" +src="([-_a-z0-9A-Z/\.]+)" *>'
  r2 = new RegExp(r2String)
  r2Output = r2.exec(htmlFileString)
  while r2Output?
    console.log('--', r2Output[1])
    # get file
    jsFileString = 'testing'
    if jsFileString?
      htmlFileString = htmlFileString.replace(r2Output[0], "<script type=\"text/javascript\">\n#{jsFileString}\n")
      r2Output = r2.exec(htmlFileString)
    else
      # put in dummy stuff
  
  console.log('\n' + htmlFileString)
  
  # get rid of dummy stuff

console.log(__dirname)

processDirectory(__dirname + '/src')
processDirectory(__dirname + '/examples')
