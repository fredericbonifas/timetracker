var width = 1280,
        height = 2000,
        cellSize = 52; // cell size

var no_months_in_a_row = Math.floor(width / (cellSize * 7 + 50));
var shift_up = cellSize * 3;
var startMonth = 12;
var startYear = 2015;
var endYear = 2016;
var maxValue = 0;

var colorsTasks = {
    'démolition': '#B1B1B1', // grey
    'cloisons': '#cccccc', // light grey
    'électricité': '#EA8D3D', // orange
    'plomberie': '#5397D2', // blue
    'peinture': '#79C34B', // green
    'carrelage': '#983A80', // velvet
    'parquet': '#9C6868' // brown
};


function sortTime(a, b) {
  if (a.total < b.total)
    return 1;
  if (a.total > b.total)
    return -1;
  return 0;
}

var day = d3.time.format('%w'), // day of the week
        day_of_month = d3.time.format('%e'), // day of the month
        day_of_year = d3.time.format('%j'),
        week = d3.time.format('%U'), // week number of the year
        month = d3.time.format('%m'), // month number
        year = d3.time.format('%Y'),
        percent = d3.format('.1%'),
        format = d3.time.format('%Y-%m-%d'),
        format2 = d3.time.format('%d/%m/%Y');

var color = d3.scale.quantize()
        .domain([0, 10])
        .range(d3.range(11).map(function(d) { return 'q' + d + '-11'; }));

var svg = d3.select('#calendar').selectAll('svg')
        .data(d3.range(startYear, endYear + 1))
    .enter().append('svg')
        .attr('width', width)
        .attr('height', function(d) {
            if (d === startYear) {
                return height / 4;
            }
            return height;
        })
        .attr('class', 'RdYlGn')
    .append('g');

var g = svg.selectAll('.day')
        .data(function(d) {
            if (d === startYear) {
                return d3.time.days(new Date(d, startMonth - 1, 1), new Date(d + 1, 0, 1));
            }
            return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
        })
    .enter().append('g')
        .attr('class', 'day')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('transform', function(d) {
            var month_padding = 1.2 * cellSize * 7 * ((month(d) - 1) % (no_months_in_a_row));
            var wday = day(d) - 1;
            if (wday === -1) { // Sunday
                wday = 6;
            }
            var x = wday * cellSize + month_padding;

            var week_diff = week(d) - week(new Date(year(d), month(d) - 1, 1));
            if (wday === 6) { // Sunday
                week_diff = week_diff - 1;
            }
            var row_level = Math.ceil(month(d) / (no_months_in_a_row));
            if (parseInt(year(d)) === startYear) {
                    row_level = 1;
            }
            var y = (week_diff * cellSize) + row_level * cellSize * 8 - cellSize / 2 - shift_up;
            return 'translate(' + x + ',' + y + ')';
        })
        .datum(format);

g.append('rect')
    .attr('width', cellSize)
    .attr('height', cellSize);


var month_titles = svg.selectAll('.month-title')  // Jan, Feb, Mar and the whatnot
            .data(function(d) {
                if (d === startYear) {
                    return d3.time.months(new Date(d, startMonth - 1, 1), new Date(d + 1, 0, 1));
                }
                return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
        .enter().append('text')
            .text(monthTitle)
            .attr('x', function(d, i) {
                var month_padding = 1.2 * cellSize * 7 * ((month(d) - 1) % (no_months_in_a_row));
                return month_padding;
            })
            .attr('y', function(d, i) {
                var week_diff = week(d) - week(new Date(year(d), month(d) - 1, 1));
                var row_level = Math.ceil(month(d) / (no_months_in_a_row));
                if (parseInt(year(d)) === startYear) {
                        row_level = 1;
                }
                return (week_diff * cellSize) + row_level * cellSize * 8 - cellSize - shift_up;
            })
            .attr('class', 'month-title')
            .attr('d', monthTitle);

var year_titles = svg.selectAll('.year-title')  // Jan, Feb, Mar and the whatnot
            .data(function(d) {
                return d3.time.years(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append('text')
            .text(yearTitle)
            .attr('x', function(d, i) { return width / 2 - 100; })
            .attr('y', function(d, i) { return cellSize * 5.5 - shift_up; })
            .attr('class', 'year-title')
            .attr('d', yearTitle);

var key = '1-Tr-Kn4YZxVNUVYFFvzB9sDMwtCM1yRq0l183OMZHk4',  // key for demo spreadsheet
        query = '&tqx=out:csv',                       // query returns the first sheet as CSV
        url = 'https://spreadsheets.google.com/tq?key=' + key + query;  // CORS-enabled server

//var url = 'travaux.csv';

d3.csv(url, function(error, csv) {
    if (error) throw error;
    var data = d3.nest()
        .key(function(d) { return format(format2.parse(d.date)); })
        .rollup(function(d) {
            var values = [];
            for (var i = d.length - 1; i >= 0; i--) {
                values.push({
                    'total': parseInt(d[i].total),
                    'type': d[i].type,
                    'tache': d[i].tache,
                });
            }
            values.sort(sortTime);
            var partialRadius = 0;
            for (var i = values.length - 1; i >= 0; i--) {
                partialRadius += values[i].total;
                values[i].radius = partialRadius;
            }
            if (partialRadius > maxValue) {
                maxValue = partialRadius;
            }
            return values;
        })
        .map(csv);

    g.filter(function(d) { return d in data; })
        .selectAll('circle')
        .data(function(d) {
            return data[d];
        })
        .enter()
        .append('circle')
        .attr('fill', function(d) {
            return colorsTasks[d.type];
        })
        .attr('stroke-width', 0)
        .attr('cx', cellSize / 2)
        .attr('cy', cellSize / 2)
        .attr('r', function(d) {
            return Math.sqrt(d.radius / Math.PI) * cellSize / 2 / Math.sqrt(maxValue / Math.PI);
        })
        .append('svg:title')
        .text(function(d) {
            return d.tache;
        });

});


function dayTitle(t0) {
    return t0.toString().split(' ')[2];
}
function monthTitle(t0) {
    return t0.toLocaleString('en-us', { month: 'long' });
}
function yearTitle(t0) {
    return t0.toString().split(' ')[3];
}
