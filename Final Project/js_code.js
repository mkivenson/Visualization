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
  const main_graph = document.querySelector('#main_graph');
  const graph_naturalgas = document.querySelector('#graph_naturalgas');
  const graph_petroleum = document.querySelector('#graph_petroleum');
  const graph_electricity = document.querySelector('#graph_electricity');
  const graph_coal = document.querySelector('#graph_coal');
  const myDataFile = 'https://raw.githubusercontent.com/mkivenson/Visualization/master/Final%20Project/Datasets/State%20Energy%20Data%20System%201960-2009/preprocessed.csv';
  var filters = {
    'Year': '1970',
    'Energy Type': 'Total energy',
    'Measure': 'consum',
    'Unit': 'Billion Btu',
    'Sector': 'transportation'
  };

  var slider = document.getElementById("myRange");
  const year_output = document.querySelector('#year_output');
  const type_output = document.querySelector('#type_filt');
  const sector_output = document.querySelector('#sector_filt');
  const screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const stretch_height = document.querySelector('.page-stretcher').clientHeight;
  const contain = document.querySelector('.flex-container-main');
  var controller = new ScrollMagic.Controller({
    triggerElement: contain
    });

	// build scene

  var slides = document.querySelectorAll("section.panel");

  // create scene for every slide
  for (var i=0; i<slides.length; i++) {
    new ScrollMagic.Scene({
      duration: stretch_height - 100,
      offset: stretch_height*i
      })
      .setPin(contain)
      .setTween(new TimelineMax()
        .to('.section-container', 1, {x: `-${(i*25)}%`}))
      .addIndicators() // add indicators (requires plugin)
      .addTo(controller);
  }

  new ScrollMagic.Scene(
    {duration: stretch_height - 100}
  )
        .setPin(contain)
        .on("progress", function (e) {
          console.log('start')
          var scroll_year = 1960 + Math.round((49 * e.progress), 0)
          year_output.innerHTML = scroll_year;
          filters = {
            ...filters,
            'Year': scroll_year.toString(),
          };
          var filtered_data = chart_filter(chart_data, filters)
          console.log('end')
          chart_plot(filtered_data, main_graph, 'Total Energy Consumption by State')
          //chart_subplots(chart_data, filters)
          
        })
        
        .addTo(controller)
        .addIndicators();
        
  let chart_data = []
  Plotly.d3.csv(
    myDataFile,
    (inputData) => {
      chart_data = inputData
      // setup input fields
      // slider setup
      // const years = Array.from(new Set(unpack(inputData, 'Year')))
      // slider.min = Math.min(...years)
      // slider.max = Math.max(...years)
      // slider.value = slider.min
      // year_output.innerHTML = slider.value

      // // type_filter
      // Array.from(new Set(unpack(inputData, 'Energy Type')))
      // .map((t) => createElementFromHTML(`<option value="${t}">${t}</option>`))
      // .forEach( (e) => type_output.appendChild(e))

      // sector_filter
      Array.from(new Set(unpack(inputData, 'Sector')))
      .map((t) => createElementFromHTML(`<option value="${t}">${t}</option>`))
      .forEach( (e) => sector_output.appendChild(e))


      // generate plot
      var filtered_data = chart_filter(chart_data, filters)
      chart_plot(filtered_data, main_graph, 'Total Energy Consumption by State')
      chart_subplots(chart_data, filters)
    }
  );

  // Update the current slider value (each time you drag the slider handle)
  // slider.onchange = function() {
  //   year_output.innerHTML = slider.value;
  //   filters = {
  //     ...filters,
  //     'Year': slider.value,
  //   };
  //   var filtered_data = chart_filter(chart_data, filters)
  //   chart_plot(filtered_data, main_graph, 'Total Energy Consumption by State')
  //   chart_subplots(chart_data, filters)
  // } 

  // type_output.onchange = function() {
    
  //   filters = {
  //     ...filters,
  //     'Energy Type': type_output.options[type_output.selectedIndex].value,
  //   };
  //   var filtered_data = chart_filter(chart_data, filters)
  //   chart_plot(filtered_data, main_graph, 'Total Energy Consumption by State')
  // } 

  sector_output.onchange = function() {
    filters = {
      ...filters,
      'Sector': sector_output.options[sector_output.selectedIndex].value,
    };
    var filtered_data = chart_filter(chart_data, filters)
    chart_plot(filtered_data, main_graph, 'Total Energy Consumption by State')
    chart_subplots(chart_data, filters)
  }

});



function chart_filter (inputData, filters) {
  return inputData.map((row) => ({
    ...row,
    'Data': parseFloat(row['Data'])
  }))
  .filter((row) => rowMatch(row, filters))
  .filter((row) => !rowMatch(row, {'StateCode': 'US'}))
}

function chart_plot (inputData, location, title) {
  const screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const data = [{
      type: 'choropleth',
      locationmode: 'USA-states',
      locations: unpack(inputData, 'StateCode'),
      z: unpack(inputData, 'Data'),
      text: unpack(inputData, 'Description'),
      zmin: Math.min(...unpack(inputData, 'Data')),
      zmax: Math.max(...unpack(inputData, 'Data')),
      colorscale: 'Viridis',
      colorbar: {
        title: 'Billions BTU',
        thickness: 25,
        
      },
  }];

  const layout = {
      title: {
        text:title,
        font: {
          family: 'Calibri',
          size: 24
        },
        xref: 'paper',
        x: 0.05,
      },
      width: screenWidth / 3, 
      height: screenHeight / 2,
      dragmode: false,
      geo:{
          scope: 'usa',
          showlakes: true,
          lakecolor: 'rgb(255,255,255)'
      },
  };

  Plotly.react(location, data, layout, {showLink: false, responsive: false});
}

function chart_subplots(chart_data, filter){
  /*coal data and chart*/
  var filters_coal = {
    ...filter,
    'Energy Type': 'Coal'
  }
  var coal_data = chart_filter(chart_data, filters_coal)
  chart_plot(coal_data, graph_coal, 'Coal Consumption by State')

  /*electricity data and chart*/
  var filters_electricity = {
    ...filter,
    'Energy Type': 'Electricity'
  }
  var elec_data = chart_filter(chart_data, filters_electricity)
  chart_plot(elec_data, graph_electricity, 'Electricity Consumption by State')

  /*natural gas data and chart*/
  var filters_naturalgas =  {
    ...filter,
    'Energy Type': 'Natural gas'
  }
  var natgas_data = chart_filter(chart_data, filters_naturalgas)
  chart_plot(natgas_data, graph_naturalgas, 'Natural Gas Consumption by State')

  /*petroleum data and chart*/
  var filters_petroleum = {
    ...filter,
    'Energy Type': 'All petroleum products'
  }
  var petroleum_data = chart_filter(chart_data, filters_petroleum)
  chart_plot(petroleum_data, graph_petroleum, 'Petroleum Consumption by State')
}




