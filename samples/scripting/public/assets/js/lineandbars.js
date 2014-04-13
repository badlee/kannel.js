	// LINE AND BARS CHARTS

$(function () {
  
  function generateNumber(min, max) {
    min = typeof min !== 'undefined' ? min : 1;
    max = typeof max !== 'undefined' ? max : 100;
    
    return Math.floor((Math.random() * max) + min);
  }
  
  var chart,
      categories = ['Categorie 1', 'Categorie 2', 'Categorie 3', 'Categorie 4', 'Categorie 5','Categorie 6', 'Categorie 7', 'Categorie 8', 'Categorie 9', 'Categorie 10', 'Categorie 11', 'Categorie 12', 'Categorie 13', 'Categorie 14', 'Categorie 15', 'Categorie 16', 'Categorie 17', 'Categorie 18', 'Categorie 19','Categorie 20', 'Categorie 21','Categorie 22', 'Categorie 23', 'Categorie 24', 'Categorie 25', 'Categorie 26', 'Categorie 27', 'Categorie 28', 'Categorie 29', 'Categorie 30'],
      serie1 = new Array(31).join('0').split('').map(parseFloat),
      serie2 = new Array(31).join('0').split('').map(parseFloat),
      $aapls;
  
  $(document).ready(function() {

    chart = new Highcharts.Chart({
      chart: {
        renderTo: 'importantchart',
        type: 'column',
        backgroundColor: 'transparent',
        height: 140,
        marginLeft: 3,
        marginRight: 3,
        marginBottom: 0,
        marginTop: 0
      },
      title: {
        text: ''
      },
      xAxis: {
        lineWidth: 0,
        tickWidth: 0,
        labels: { 
          enabled: false 
        },
        categories: categories
      },
      yAxis: {
        labels: { 
          enabled: false 
        },
        gridLineWidth: 0,
        title: {
          text: null,
        },
      },
      series: [{
        name: 'Received SMS',
        data: serie1
      }, {
        name: 'Sent',
        color: '#fff',
        type: 'line',
        data: serie2
      }],
      credits: { 
        enabled: false 
      },
      legend: { 
        enabled: false 
      },
      plotOptions: {
        column: {
          borderWidth: 0,
          color: '#b2c831',
          shadow: false
        },
        line: {
          marker: { 
            enabled: false
          },
          lineWidth: 1,
          color : '#fa1d2d'
        }
      },
      tooltip: { 
        enabled: true
      }
    });
  var prevSent = 0;
  var prevRecieve = 0;    
  var statusFn = function(){
    $.getJSON("/stats.json",function(data){
      document.querySelector('p[ref="sent"] bold').innerHTML = data.sent;
      document.querySelector('p[ref="received"] bold').innerHTML = data.received;
      chart.series[1].addPoint(prevSent == 0 || data.sent < prevSent ? 0 : data.sent - prevSent, true, true);
      chart.series[0].addPoint(prevRecieve ==0 || data.received < prevRecieve ? 0 : data.received - prevRecieve  , true, true);
      prevSent = data.sent;
      prevRecieve = data.received; 
    });
  };
  statusFn();
  
    setInterval(statusFn, 1000);
  });
  
});
