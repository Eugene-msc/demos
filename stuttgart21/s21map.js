$(function() {

	$('#title .v').addClass('inactive');

	$('#plot').hide();

	$.loadAssets({
		urls: {
			ltag: 'bw-ltag2011_.csv',
			s21: 'bw-s21_.csv'
		},
		success: function(content) {
	
			// import some classes
			var SVGMap = svgmap.SVGMap, 
				Color = svgmap.color.Color,
				Categories = svgmap.color.scale.Categories,
				Ramp = svgmap.color.scale.Ramp,
				Diverging = svgmap.color.scale.Diverging;

			window.map = new SVGMap('#map');
			
			$(window).resize(function() {
				map.resize();
				plot.resize();
				
			});
			
			
			map.loadMap('bw-cartogram-pop.svg', function(map) {
	
				$('#loading').remove();
	
				map.addLayer('gemeinden', 'bg');
				map.addLayer('gemeinden', 'gemeinden', 'key');
				
				// prepare data
				var ltag, s21, tooltips = {}, data = {}, key, row, j;
				
				ltag = $.parseCSV({
					csv: content.ltag,
					map: true
				});
				
				s21 = $.parseCSV({
					csv: content.s21,
					map: true
				});
				
				for (j in s21.rows) {
					row = s21.rows[j];
					key = "0" + row['id'];
					row['contra'] = row['Ja-Stimmen'] / row['Gueltige Stimmen']
					row['pro'] = row['Nein-Stimmen'] / row['Gueltige Stimmen']
					row['s21pc'] = (row['Nein-Stimmen']-row['Ja-Stimmen']) / row['Gueltige Stimmen']
					row['s21wb'] = row['Gueltige Stimmen'] / row['Stimmberechtigte']
					data[key] = row;
				}
				
				for (j in ltag.rows) {
					row = ltag.rows[j];
					key = "0" + row['id'];
					if (data.hasOwnProperty(key)) {
					
						var total = row['Gueltige Stimmen'];
					
						data[key]['ltwb'] = row['Gueltige Stimmen'] / row['Wahlberechtigte'];
						data[key]['cdu'] = row['CDU'] / total;
						data[key]['gruene'] = row['GRUENE'] / total;
						data[key]['cdu-gruene'] = (row['CDU']-row['GRUENE']) / total;
						data[key]['spd'] = row['SPD'] / total;
						data[key]['cdu-spd'] = (row['CDU']-row['SPD']) / total;
						data[key]['gruene-spd'] = (row['GRUENE']-row['SPD']) / total;
						data[key]['fdp'] = row['FDP'] / total;
						data[key]['linke'] = row['DIE LINKE'] / total;
						data[key]['rep'] = row['REP'] / total;
						
						var t = .35, t2 = .4,
							max = Math.max(row['CDU'],row['GRUENE'],row['SPD'],row['FDP'],row['DIE LINKE']),
							c = (max/total >= .5 ? '3' : max/total >= .42 ? '2' : max/total >= .35 ? '1' : '');	
						if (max == row["CDU"]) data[key]['ltmaj'] = 'cdu'+c;
						if (max == row["GRUENE"]) data[key]['ltmaj'] = 'gruene'+c;
						if (max == row["SPD"]) data[key]['ltmaj'] = 'spd'+c;
						if (max == row["FDP"]) data[key]['ltmaj'] = 'fdp'+c;
						if (max == row["DIE LINKE"]) data[key]['ltmaj'] = 'linke'+c;
						
					}
					// data[key] = ltag.rows[j];
				}
				
				// tooltips
				for (j in s21.rows) {
					row = s21.rows[j];
					key = "0" + row['id'];
					tooltips[key] = [row.name, '']
					
					tooltips[key][1] =
						'<table><tr><td colspan="2" class="lbl">S21-VOLKSBEGEHREN:</td></tr>'
						+'<tr><th>Für Ausstieg:&nbsp;</th><td>'+row['Ja-Stimmen']+' ('+Math.round(row['Ja-Stimmen'] / row['Gueltige Stimmen']*100)+'%)</td></tr>'
						+'<tr><th>Gegen Ausstieg:</th><td>'+row['Nein-Stimmen']+' ('+Math.round(row['Nein-Stimmen'] / row['Gueltige Stimmen']*100)+'%)</td></tr>'
						+'<tr><th>Wahlbeteiligung:&nbsp;</th><td>'+(Math.round(1000*row['s21wb'])/10)+'%</td></tr>'	
						+'<tr><td colspan="2" class="lbl l2">LANDTAGSWAHL 2011:</td></tr>'
						+'<tr><th>Wahlbeteiligung:&nbsp;</th><td>'+(Math.round(1000*row['ltwb'])/10)+'%</td></tr>'	
						+'</table>';
					
					var bch = 80, max = 0, v, p, i, part = ['cdu','gruene','spd','fdp','linke'];
					for (i in part) {
						max = Math.max(row[part[i]], max)
					}
					tooltips[key][1] += '<div class="barchart" style="height:'+bch+'px">';
					for (i in part) {
						v = Math.round(1000*row[part[i]])/10+'%';
						bh = row[part[i]] / max * bch;
						tooltips[key][1] += '<div class="col" style="margin-top:'+(bch-bh)+'px">';
						tooltips[key][1] += '<div class="bar '+part[i]+'" style="height:'+bh+'px"><div class="lbl">'+v+'</div></div>';
						tooltips[key][1] += '<div class="lbl">'+part[i].toUpperCase()+'</div>';
						tooltips[key][1] += '</div>';
					}
					
					tooltips[key][1] += '</div>'
				}
				
				var scales = {};
				scales['s21pc'] = svgmap.color.scale.BWO;
				scales['s21pc'].center = 0;
				scales['s21pc'].setClasses(11);
				scales['s21wb'] = new Ramp(Color.hsl(180,.65,.98), Color.hsl(230,1,.1));
				//scales['s21wb'].setClasses(7);
				scales['ltwb'] = scales['s21wb'];
				scales['pro'] = new Ramp(Color.hsl(220,1,.97),Color.hsl(220,1,.25));
				scales['contra'] = new Ramp('#ffffff',Color.hsl(30,1,.25));
				
				scales['cdu'] = new Ramp('#eeeeee', '#000000');
				scales['cdu'].setClasses(7);
				scales['gruene'] = new Ramp(Color.hsl(120,.61,.98), Color.hsl(120,.62,.25));
				scales['gruene'].setClasses(7);
				scales['cdu-gruene'] = new Diverging(Color.hsl(120,.62,.35), '#ffffff', '#000000', 0);
				scales['cdu-gruene'].setClasses(11);
				scales['cdu-spd'] = new Diverging(Color.hsl(0,.65,.35), '#ffffff', '#000000', 0);
				scales['cdu-spd'].setClasses(11);
				scales['gruene-spd'] = new Diverging(Color.hsl(0,.65,.35), '#ffffff', Color.hsl(120,.62,.35), 0);
				scales['gruene-spd'].setClasses(11);
				
				scales['spd'] = new Ramp(Color.hsl(0,.65,.98), Color.hsl(0,.65,.15));
				scales['spd'].setClasses(7);
				scales['fdp'] = new Ramp(Color.hsl(60,.61,.98), Color.hsl(60,.62,.15));
				scales['fdp'].setClasses(7);
				scales['linke'] = new Ramp(Color.hsl(320,.61,.98), Color.hsl(320,.62,.15));
				scales['linke'].setClasses(7);
				scales['rep'] = new Ramp('#ffffff', Color.hsl(35,.42,.25));
				scales['rep'].setClasses(7);
				
				scales['ltmaj'] = new Categories({
					cdu: '#777',
					gruene: '#4DD34D',
					spd: '#CC3333',
					fdp: '#EEEEBB',
					linke: '#dd44dd',
					cdu1: '#666',
					gruene1: '#6c6',
					spd1: '#c33',
					fdp1: '#ddddaa',
					linke1: '#cc33cc',
					cdu2: '#444',
					gruene2: '#38CB38',
					spd2: '#cc1111',
					fdp2: '#cc9',
					linke2: '#b2b',
					cdu3: '#222',
					gruene3: '#2b2',
					spd3: '#a00'
				});
				
				map.tooltips({
					content: tooltips
				});
				
				
				/*
				map.addLayerEvent('click', function(evt) {
					console.log(evt.target);
				}, 'fg');
				*/
					
				var currentScale, currentKey;
				
				var showMap = function(id) {
					$('#plot').hide();
					$('#map').show();
					$('#title .v').addClass('inactive');
					$('#title #'+id).removeClass('inactive');
								
					map.choropleth({
						data: data,
						key: id,
						colorscale: scales[id]
					});
					
					currentScale = scales[id];
					currentKey = id;
					
					var i,f,v,legend = $('#legend .c');
					if (id == "ltmaj") {
						v = ['cdu','gruene','spd','fdp','linke'];
						f = ['CDU','GRÜNE','SPD','FDP','DIE&nbsp;LINKE'];
						for (i=0; i<legend.length; i++) {
							$(legend[i]).css({ background: scales[id].getColor(v[i]) });
							$('.v', legend[i]).html(f[i]);
						}
					} else {
						for (i=0; i<legend.length; i++) {
							f = 1- i/(legend.length-1);
							v = scales[id].min + f * (scales[id].max - scales[id].min);
							$(legend[i]).css({ background: scales[id].getColor(v) });
							$('.v', legend[i]).html(Math.round(v*100)+'%');
						}
					}
				};
				
				var showPlot = function(xcol, ycol) {
					$('#plot').show();
					$('#map').hide();
					
					$('#title .v').addClass('inactive');
					$('#title #plot-'+xcol).removeClass('inactive');
					
					setXaxis(xcol);
					setYaxis(ycol);
				};
				
				$('#title .v.map').click(function(evt) {
					var id = evt.target.getAttribute('id');
					if (id == null) {
						id = evt.target.parentNode.getAttribute('id');
					}
					showMap(id);
				});
				
				$('#text p a.map').click(function(evt) {
					var id = $(evt.target).data("map");
					showMap(id);
					return false;
				});
				
				$('a.plot').click(function(evt) {
					var xcol = $(evt.target).data("x"),
						ycol = $(evt.target).data("y");
					showPlot(xcol, ycol);
					return false;
				});
				
				showMap('s21pc');
				
				
				window.plot = new plotjs.ScatterPlot('#plotc');
				plot.setData(data);
				
				plot.setScale(new Ramp(Color.hsl(180,.65,.68), Color.hsl(230,1,.1)), 's21wb');
				
				var setXaxis = function(id) {
					console.log(plot);
					plot.xAxis(id);
					$('#plot .xmenu').addClass('inactive');
					$('#plot .xmenu#'+id).removeClass('inactive');
					if ($('#selectx')[0].value != id) $('#selectx')[0].value = id;
				};
				var setYaxis = function(id) {
					plot.yAxis(id);
					$('#plot .ymenu').addClass('inactive');
					$('#plot .ymenu#'+id).removeClass('inactive');
					if ($('#selecty')[0].value != id) $('#selecty')[0].value = id;
				};
				
				setXaxis('cdu');
				setYaxis('pro');
				
				$('#selectx').change(function (e) {
					var id = e.target.value;
					setXaxis(id);
				});
				$('#selecty').change(function (e) {
					var id = e.target.value;
					setYaxis(id);
				});
				
				window.plot = plot;
				
				map.addLayerEvent('mouseover', function(e) {
					var id = e.target.path.data.key;
					plot.focus([id]);
				});
				
				map.addLayerEvent('mouseout', function(e) {
					
					plot.unfocus();
				});
				
				var plot_columns = {
					pro: 'PRO S21',
					contra: 'KONTRA S21',
					cdu: 'CDU',
					gruene: 'GRÜNE',
					spd: 'SPD',
					fdp: 'FDP'
				};
				
				for (var k in plot_columns) {
					$('#plotmenu select').append('<option value="'+k+'">'+plot_columns[k]+'</option>');
				}
				
				
			}, { padding: -50, halign: 'left', valign: 'center' }); // end map.loadSVG() ...
		
		} // end success: function() { ..	
	});	
});