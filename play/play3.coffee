ChartTime = {}
ChartTime._pad = (n, l) ->
  result = n.toString()
  while result.length < l
    result = '0' + result
  return result

getZuluString = (jsDate) ->
  year = jsDate.getUTCFullYear()
  month = jsDate.getUTCMonth() + 1
  day = jsDate.getUTCDate()
  hour = jsDate.getUTCHours()
  minute = jsDate.getUTCMinutes()
  second = jsDate.getUTCSeconds()
  millisecond = jsDate.getUTCMilliseconds()
  s = ChartTime._pad(year, 4) + '-' + ChartTime._pad(month, 2) + '-' + ChartTime._pad(day, 2) + 'T' + 
      ChartTime._pad(hour, 2) + ':' + ChartTime._pad(minute, 2) + ':' + ChartTime._pad(second, 2) + '.' + 
      ChartTime._pad(millisecond, 3) + 'Z'
  return s
  
console.log(getZuluString(new Date()))