XMLHttpRequest = require("../node_modules/node-XMLHttpRequest").XMLHttpRequest

xhr = new XMLHttpRequest()

xhr.onreadystatechange = () ->
	console.log("State: " + this.readyState)

	if this.readyState == 4
		console.log("Complete.\nBody length: " + this.responseText.length)
		console.log("Body:\n" + this.responseText)

url = 'http://test13cluster:9100/analytics-api/1.27/41529001/artifact/snapshot/query.js?find={_ItemHierarchy:1443125795,%22_PreviousValues.KanbanState%22:{$exists:true}}&sort={_ValidFrom:1}&pagesize=10000&start=2'

if process?
  username = process.env.RALLY_USERNAME
  password = process.env.RALLY_PASSWORD

xhr.open("GET", url, true, username, password)
xhr.send()