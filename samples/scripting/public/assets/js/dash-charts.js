/*** First Chart in Dashboard page ***/

	$(document).ready(function() {
		var info1 = new Highcharts.Chart({
			chart: {
				renderTo: 'load',
				margin: [0, 0, 0, 0],
				backgroundColor: null,
                plotBackgroundColor: 'none',
							
			},
			credits: { 
		        enabled: false 
		      },
		      legend: { 
		        enabled: false 
		      },
			title: {
				text: null
			},

			tooltip: {
				formatter: function() { 
					return this.point.name +': '+ this.y +' %';
						
				} 	
			},
		    series: [
				{
				borderWidth: 2,
				borderColor: '#F1F3EB',
				shadow: false,	
				type: 'pie',
				name: 'Income',
				innerSize: '65%',
				data: [
					{ name: 'load percentage', y: 45.0, color: '#b2c831' },
					{ name: 'rest', y: 55.0, color: '#3d3d3d' }
				],
				dataLabels: {
					enabled: false,
					color: '#000000',
					connectorColor: '#000000'
				}
			}]
		});
		

/*** second Chart in Dashboard page ***/

		var info = new Highcharts.Chart({
			chart: {
				renderTo: 'space',
				margin: [0, 0, 0, 0],
				backgroundColor: null,
                plotBackgroundColor: 'none',
							
			},
			credits: { 
		        enabled: false 
		      },
		      legend: { 
		        enabled: false 
		      },
			title: {
				text: null
			},

			tooltip: {
				formatter: function() { 
					return this.point.name +': '+ this.y +' %';
						
				} 	
			},
		    series: [
				{
				borderWidth: 2,
				borderColor: '#F1F3EB',
				shadow: false,	
				type: 'pie',
				name: 'SiteInfo',
				innerSize: '70%',
				data: [
					{ name: 'Used', y: 0.0, color: '#fa1d2d' },
					{ name: 'Rest', y: 100.0, color: '#3d3d3d' }
				],
				dataLabels: {
					enabled: false,
					color: '#000000',
					connectorColor: '#000000'
				}
			}]
		});

	var uptimeFn = function(){
		$.getJSON("/info.json",function(data){

			var used = Number((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal*100).toFixed(1));
			var used1 = Number((data.memoryOs.free / data.memoryOs.total*100).toFixed(1));
			document.querySelector('uptime').innerHTML = data.uptime.toHHMMSS();
			document.querySelector('p[ref="uptime"] img').src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAaCAYAAACgoey0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDoAABSCAABFVgAADqXAAAXb9daH5AAAAE2SURBVHjavNZNKwRhAAfw38hbWiJyUXIQuWiVkxKuTg7kohxQEkW5YJWDt2UJZxdfwafweRS5cRmS7M7uszP7rznMM888v5me1+j5ZUJgjvCBm5CXo0C4He94Q2dIA02Bf1tAhBz2GwUP/sGO0dcIuIS2X/ddOM0ansPSP+UbyGcJ31Vo5yEreBPjFZ5PYzFtuBcXVdS7RkeacAHdVdQbwk5a8Ah2a+iSEwykARcDVrWzeuEZLATM9dWEgVgRjvAoPE+h8BaG64DzWKkV7ooHSb05Q2st8GXIwl9mQzmuFh7DuvSyG39AIlxCS4pwDldJ8Hx8pZ1lTJWDW3Eru9yXg7cxmiE8ibW/cE9K0ycp53Gf/8DF0NNijenH4Tc8Gx9dGpUDTDZjLz4fv8brc5b5jPf17a8BAL2GJb5Z//XcAAAAAElFTkSuQmCC";
			document.querySelector('p[ref="uptime"] bold').innerHTML = "UP";
			document.querySelector('diskspace').innerHTML = used;
			document.querySelector('diskmemory').innerHTML = used1;
			info.series[0].setData([
						{ name: 'Used', y: used, color: '#fa1d2d' },
						{ name: 'Rest', y: 100 - used, color: '#3d3d3d' }
					],true)
			info1.series[0].setData([
				{ name: 'load percentage', y: used1, color: '#b2c831' },
				{ name: 'rest', y: 100 - used1, color: '#3d3d3d' }
			],true)
		}).fail(function(jqXHR, textStatus, errorThrown){
			document.querySelector('uptime').innerHTML = "can't retrieve data";
			document.querySelector('p[ref="uptime"] img').src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAaCAYAAACgoey0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDoAABSCAABFVgAADqXAAAXb9daH5AAAAFtSURBVHjavNYxSxxBGMbx3x0WmhjSaZFYBUWESxVT2fsJ/DCCSo4IItgEsQiE9BpQAiGFVmJlRCwUVJKUgUMJURQJFjmbHbgc3u3snntPN+87O/99dt+ZeUu3Q5U1TOESZcXqH55is3Q7VBnHN93VZBl7WOoi9ENwDE/wHYMFQ68xjFr4p1d40wW3b1GD4DhoF68Lgh5jLAyaq3imQLf/rd0M3sJqAdCvWG8HDm9WL9JtK/APLDwgdAUHzcHm4grqTbbX8w6hV3iB8xjH8BdzD+C2eh+0neOgHUzkhB7iZatkOWtRZNBsu2QaeBsfc0C/4HO7CWmfGp4lhdaXAfwK+504hl/JGRurd2nQWMdQwglGUub9Tm6fP2kLxnYc9chCq8ZAs4DhU3KWt9IRlmMXy9pjTefMdQzex/t74hvJFopWbHE1agA/0d8QG8VpkY7hDPMN48Ws0LyOgy6SHvkxbrI+3NNh4/YoDxTuBgAvT0oIjepKjQAAAABJRU5ErkJggg==";
			document.querySelector('p[ref="uptime"] bold').innerHTML = "DOWN";
			used1=used =0;

			document.querySelector('diskspace').innerHTML = used;
			document.querySelector('diskmemory').innerHTML = used1;
			info.series[0].setData([
						{ name: 'Used', y: used, color: '#fa1d2d' },
						{ name: 'Rest', y: 100 - used, color: '#3d3d3d' }
					],true);
			info1.series[0].setData([
				{ name: 'load percentage', y: used1, color: '#b2c831' },
				{ name: 'rest', y: 100 - used1, color: '#3d3d3d' }
			],true)
		});
	};
	uptimeFn();
		setInterval(uptimeFn,10000);
	});

