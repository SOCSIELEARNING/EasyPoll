var languageArray = ['Your rating', 'Rating', 'Number of ratings'];
var colorsArray = ['#ffcc33'];
var chartData = [];
var chartWidth = 400;
var chartHeight = 125;

function setLocalStorageData(val) {
    if (typeof(Storage) !== 'undefined') {
        localStorage.setItem(((window.location.href).replace(/[^A-Za-z0-9]/g, '')), val);
	}
}
    
function checkLocalStorageData() {
    if (typeof(Storage) !== 'undefined') {        
        var localStorageData = localStorage.getItem((window.location.href).replace(/[^A-Za-z0-9]/g, ''));
        if (localStorageData==null || localStorageData.length==0 || $('.easypoll-ratings').length==0) {
            return(false);
        } else {
            return(localStorageData);
        }
    } else {
        return(false);
    }
}

function drawChart() {
    var data = google.visualization.arrayToDataTable(
        chartData
    );
    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1, 2, 3]);
    var options = {
        title: '',
        width: chartWidth,
        height: chartHeight,
        bar: {groupWidth: '95%'},
        legend: { position: 'none' }
    };
    if ($('#chart_div').length!=0) {
        var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
        chart.draw(view, options);
    }
}

function drawBarChart(ratings, total) {
    google.charts.load('current', {packages:['corechart']});
    var ratingsArray = (String(ratings)).split(',');
    if (ratingsArray.length > 0) {
        chartData = [[languageArray[1], languageArray[2], { role: 'style' }, { role: 'annotation' } ]];
        for (var i=(ratingsArray.length-1); i>=0; i--) {
            var opac = 0.5;
            var anno='';
            if (i<5) {
                opac=(1-(i/10));
            }
            if (ratingsArray[i]!='') {
                anno = ((String((((Number(ratingsArray[i]))*100)/total).toFixed(0)))+'%');
                chartData[chartData.length] = [String(i+1), Number(ratingsArray[i]), 'color:'+colorsArray[0]+'; stroke-color: white; fill-opacity:' + opac, anno];
            } else {
                chartData[chartData.length] = [String(i+1), 0, 'color:'+colorsArray[0]+'; stroke-color: white; fill-opacity:' + opac, anno];
            }
        }  
        google.charts.setOnLoadCallback(drawChart);
    }
}

$( document ).ready(function() {
    var prevResponse = checkLocalStorageData();
    var responseRecorded = false;
    var responseValue = 'Completed';
    if (prevResponse==false) {
        if ($( '#ratings-form-submit' )!==undefined) {
            $( '#ratings-form-submit' ).css ('display', 'block');
        }
        if ($( '#ratings-form' )!==undefined) {
            $( '#ratings-form' ).submit(function( event ) {
                if (responseRecorded==false) {
                    setLocalStorageData(responseValue);
                }
            });
        }
        $( '.radio' ).click(function( event ) {
            if ($('input[name=rating]:checked').val()!==undefined) {
                responseValue = String ($('input[name=rating]:checked').val());
            }
            responseRecorded=true;
            setLocalStorageData(responseValue);
            if ($( '#ratings-form-submit' )!==undefined) {
                $( '#ratings-form-submit' ).attr('disabled', false);
            }
            if ($( '#ratings-form' )!==undefined) {
                $( '#ratings-form' ).submit();
            }
        });
    } else {
        $('.easypoll-form').append('<div class="alert alert-success">' + languageArray[0]+': <strong>'+prevResponse+'</strong></div>');
    }
    if ($( '#ratings-form' )!==undefined) {
        $( '#ratings-form' ).css('display', 'block');
    }
    if ($('#chart_div').length!=0 && $('#chart_div').attr('data-ratings')!=undefined && $('#chart_div').attr('data-total')!=undefined) {
        drawBarChart($('#chart_div').attr('data-ratings'),$('#chart_div').attr('data-total'));
    }
});

