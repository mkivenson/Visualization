function docReady(fn) {
  // see if DOM is already available
  if (document.readyState === "complete" || document.readyState === "interactive") {
      // call on next available tick
      setTimeout(fn, 1);
  } else {
      document.addEventListener("DOMContentLoaded", fn);
  }
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}

function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
}

function rowMatch(a, m) {
  const keys = Object.keys(m);
  let matching = true;
  keys.forEach((key) => {
    if (a[key] !== m[key]){
      matching = false;
    }
  });
  return matching;
}

docReady(() => {
  const graph = document.querySelector('#graph');
  const myDataFile = 'https://raw.githubusercontent.com/mkivenson/Visualization/master/Final%20Project/Datasets/State%20Energy%20Data%20System%201960-2009/preprocessed.csv';
  var filters = {
    'Year': '1970',
    'Energy Type': 'Coal',
    'Measure': 'consum',
    'Unit': 'Billion Btu',
    'Sector': 'transportation'
  };

  var slider = document.getElementById("myRange");
  const year_output = document.querySelector('#slider_output');
  const type_output = document.querySelector('#type_filt');
  const sector_output = document.querySelector('#sector_filt');
  
  let chart1_data = []
  Plotly.d3.csv(
    myDataFile,
    (inputData) => {
      chart1_data = inputData
      // setup input fields
      // slider setup
      const years = Array.from(new Set(unpack(inputData, 'Year')))
      slider.min = Math.min(...years)
      slider.max = Math.max(...years)
      slider.value = slider.min
      year_output.innerHTML = slider.value

      // type_filter
      Array.from(new Set(unpack(inputData, 'Energy Type')))
      .map((t) => createElementFromHTML(`<option value="${t}">${t}</option>`))
      .forEach( (e) => type_output.appendChild(e))

      // sector_filter
      Array.from(new Set(unpack(inputData, 'Sector')))
      .map((t) => createElementFromHTML(`<option value="${t}">${t}</option>`))
      .forEach( (e) => sector_output.appendChild(e))


      // generate plot
      var filtered_data = chart1_filter(chart1_data, filters)
      chart1_plot(filtered_data, graph)
    }
  );

  // Update the current slider value (each time you drag the slider handle)
  slider.onchange = function() {
    year_output.innerHTML = slider.value;
    filters = {
      ...filters,
      'Year': slider.value,
    };
    var filtered_data = chart1_filter(chart1_data, filters)
    chart1_plot(filtered_data, graph)
  } 

  type_output.onchange = function() {
    
    filters = {
      ...filters,
      'Energy Type': type_output.options[type_output.selectedIndex].value,
    };
    var filtered_data = chart1_filter(chart1_data, filters)
    chart1_plot(filtered_data, graph)
  } 

  sector_output.onchange = function() {
    filters = {
      ...filters,
      'Sector': sector_output.options[sector_output.selectedIndex].value,
    };
    var filtered_data = chart1_filter(chart1_data, filters)
    chart1_plot(filtered_data, graph)
  }
  
});



function chart1_filter (inputData, filters) {
  return inputData.map((row) => ({
    ...row,
    'Data': parseFloat(row['Data'])
  }))
  .filter((row) => rowMatch(row, filters))
  .filter((row) => !rowMatch(row, {'StateCode': 'US'}))
}

function chart1_plot (inputData, location, title) {
    const data = [{
      type: 'choropleth',
      locationmode: 'USA-states',
      locations: unpack(inputData, 'StateCode'),
      z: unpack(inputData, 'Data'),
      text: unpack(inputData, 'Description'),
      zmin: Math.min(...unpack(inputData, 'Data')),
      zmax: Math.max(...unpack(inputData, 'Data')),
      colorscale: 'Viridis'
  }];

  const layout = {
      title: 'Energy Consumption by State (in billions of BTU)',
      geo:{
          scope: 'usa',
          showlakes: true,
          lakecolor: 'rgb(255,255,255)'
      }
  };

  Plotly.react(location, data, layout, {showLink: false});
}

