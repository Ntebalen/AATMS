// SIDEBAR TOGGLE

let sidebarOpen = false;
const sidebar = document.getElementById('sidebar');

function openSidebar() {
  if (!sidebarOpen) {
    sidebar.classList.add('sidebar-responsive');
    sidebarOpen = true;
  }
}

function closeSidebar() {
  if (sidebarOpen) {
    sidebar.classList.remove('sidebar-responsive');
    sidebarOpen = false;
  }
}

// ---------- CHARTS ----------

// AREA CHART
    // Water Flow Chart with custom color
    var waterflowOptions = {
        chart: {
          type: 'line',
          height: 350
        },
        series: [{
          name: 'Water Flow',
          data: [30, 40, 45, 50, 49, 60, 70, 91]
        }],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
        },
        colors: ['#008FFB'] // Blue
      };
      var waterflowChart = new ApexCharts(document.querySelector("#waterflow-chart"), waterflowOptions);
      waterflowChart.render();
  
      // Inside Temperature Chart with custom color
      var insideTempOptions = {
        chart: {
          type: 'line',
          height: 350
        },
        series: [{
          name: 'Inside Temp',
          data: [22, 23, 21, 24, 26, 27, 25, 23]
        }],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
        },
        colors: ['#FF7F0E'] // Red
      };
      var insideTempChart = new ApexCharts(document.querySelector("#insideTemp-chart"), insideTempOptions);
      insideTempChart.render();
  
      // Inside Humidity Chart with custom color
      var insideHumiOptions = {
        chart: {
          type: 'line',
          height: 350
        },
        series: [{
          name: 'Inside Humidity',
          data: [45, 50, 48, 46, 49, 51, 52, 47]
        }],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
        },
        colors: ['#00E396'] // Green
      };
      var insideHumiChart = new ApexCharts(document.querySelector("#insideHumi-chart"), insideHumiOptions);
      insideHumiChart.render();
  
      // Ambient Temperature Chart with custom color
      var ambientTempOptions = {
        chart: {
          type: 'line',
          height: 350
        },
        series: [{
          name: 'Ambient Temp',
          data: [20, 21, 19, 22, 23, 24, 25, 21]
        }],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
        },
        colors: ['#FF4560']
      };
      var ambientTempChart = new ApexCharts(document.querySelector("#ambientTemp-chart"), ambientTempOptions);
      ambientTempChart.render();


      // Soil Moisture Chart with custom color
var soilMoistureOptions = {
    chart: {
      type: 'line',
      height: 350
    },
    series: [{
      name: 'Soil Moisture',
      data: [50, 55, 60, 65, 70, 40, 80, 85]
    }],
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    },
    colors: ['#775DD0'] // Orange
  };
  var soilMoistureChart = new ApexCharts(document.querySelector("#soilMoisture-chart"), soilMoistureOptions);
  soilMoistureChart.render();

