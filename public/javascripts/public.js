var languageArray = ['Your rating', 'Rating', 'Number of ratings', 'Completed'];
var colorsArray = ['#ffcc33'];
var chartData = [];
var chartWidth = 400;
var chartHeight = 125;

function returnReferrer(val) {
    var query = ((val).toString()).split('?');
    if (query.length>=2) {
        var queryarray = (query[1]).split('&');
		if (queryarray.length>0) {
            var params = new Object();
			for(var i=0; i<queryarray.length; i++)
			{	
				params[(queryarray[i].split('='))[0]] = (queryarray[i].split('='))[1];	
			}
            if (params.poll!=undefined) {
                return((params.poll).replace(/[^A-Za-z0-9]/g, ''));
            } else {
                return (val);
            }	
        } else {
            return (val);
        }
    } else {
        return (val);
    }
}

function setLocalStorageData(val) {
    if (typeof(Storage) !== 'undefined') {
        var referrer = returnReferrer(window.location.href);
        localStorage.setItem(referrer, val);
	}
}
    
function checkLocalStorageData() {
    if (typeof(Storage) !== 'undefined') {
        var referrer = returnReferrer(window.location.href);
        var localStorageData = localStorage.getItem(referrer);
        if (localStorageData==null || localStorageData.length==0 || $('.easypoll-form').length==0) {
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
    if ($('#easypoll-chart').length!=0) {
        var chart = new google.visualization.BarChart(document.getElementById('easypoll-chart'));
        chart.draw(view, options);
    }
}

function drawBarChart(ratings, total, labels) {
    google.charts.load('current', {packages:['corechart']});
    var ratingsArray = (String(ratings)).split(',');
    var labelsArray = (String(labels)).split(',');
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
                chartData[chartData.length] = [String(labelsArray[i]), Number(ratingsArray[i]), 'color:'+colorsArray[0]+'; stroke-color: white; fill-opacity:' + opac, anno];
            } else {
                chartData[chartData.length] = [String(labelsArray[i]), 0, 'color:'+colorsArray[0]+'; stroke-color: white; fill-opacity:' + opac, anno];
            }
        }  
        google.charts.setOnLoadCallback(drawChart);
    }
}

function drawPreviousResponse(prevResponse, target) {
    if ($(target).length!=0 && $(target).attr('data-labels')!=undefined  && $(target).attr('data-polltype')!=undefined) {
        $(target).css('display', 'none');
        var prevResponseHtml='';
        var labelsArray = ($(target).attr('data-labels')).split(',');
        if ($(target).attr('data-polltype')=='0') {
            for (var i=0; i<labelsArray.length; i++) {   
                if (prevResponse>=(i+1)) {
                    prevResponseHtml = (prevResponseHtml + ('<div class="easypoll-radio radio-inline-true"></div>'));
                } else {
                    prevResponseHtml = (prevResponseHtml + ('<div class="easypoll-radio radio-inline-false"></div>'));
                }
            }
        }
        $(target).after('<div class="easypoll-previous-results"><div class="alert alert-success">' + languageArray[0] + ': ' + labelsArray[prevResponse-1] + '</div>' + prevResponseHtml + '</div>');
    }
}

$( document ).ready(function() {
    var prevResponse = checkLocalStorageData();
    var responseRecorded = false;
    var responseValue = languageArray[3];
    if (prevResponse==false) {
        if ($( '#ratings-form-submit' )!==undefined && $( '#ratings-form' )!==undefined) {
            $( '#ratings-form-submit' ).css ('display', 'block');
            $( '#ratings-form' ).css('display', 'block');
        }
        
        if ($( '#ratings-form' )!==undefined) {
            $( '#ratings-form' ).submit(function( event ) {
                if (responseRecorded==false) {
                    setLocalStorageData(responseValue);
                }
            });
        }
        $('.easypoll-form').find('.radio').click(function( event ) {
            if ($('input[name=rating]:checked').val()!==undefined) {
                responseRecorded=true;
                responseValue = String ($('input[name=rating]:checked').val());
                setLocalStorageData(responseValue);
                if ($( '#ratings-form-submit' )!==undefined) {
                    $( '#ratings-form-submit' ).attr('disabled', false);
                }
                if ($( '#ratings-form' )!==undefined) {
                    $( '#ratings-form' ).submit();
                }
            }
        });
    } else {
        if (isNaN(prevResponse)==false) {
            drawPreviousResponse((Number(prevResponse)), $('.easypoll-form'));
        }
    }
    if ($('#easypoll-chart').length!=0 && $('#easypoll-chart').attr('data-ratings')!=undefined && $('#easypoll-chart').attr('data-total')!=undefined && $('#easypoll-chart').attr('data-labels')!=undefined) {
        drawBarChart($('#easypoll-chart').attr('data-ratings'),$('#easypoll-chart').attr('data-total'),$('#easypoll-chart').attr('data-labels'));
    }
});

