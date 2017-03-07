var languageArray = ['Previous response'];

function setLocalStorageData() {
    if (typeof(Storage) !== 'undefined') {
        var val = 'completed';
        if ($('input[name=rating]:checked').val()!==undefined) {
            val = String ($('input[name=rating]:checked').val());
        }
        localStorage.setItem(((window.location.href).replace(/[^A-Za-z0-9]/g, '')), val);
	}
}
    
function checkLocalStorageData() {
    if (typeof(Storage) !== 'undefined') {        
        var localStorageData = localStorage.getItem((window.location.href).replace(/[^A-Za-z0-9]/g, ''));
        if (localStorageData==null || localStorageData.length==0 || $('.ratings').length==0) {
            return(false);
        } else {
            return(localStorageData);
        }
    } else {
        return(false);
    }
}

$( document ).ready(function() {
    var prevResponse = checkLocalStorageData();
    if (prevResponse==false) {
        if ($( '#ratings-form-submit' )!==undefined) {
            $( '#ratings-form-submit' ).css ('display', 'block');
        }
        if ($( '#ratings-form' )!==undefined) {
            $( '#ratings-form' ).submit(function( event ) {
                setLocalStorageData();
            });
        }
        $( '.radio' ).click(function( event ) {
            if ($( '#ratings-form-submit' )!==undefined) {
                $( '#ratings-form-submit' ).attr('disabled', false);
                $( '#ratings-form' ).submit();
            }
        });
    } else {
        $('.ratings').append ('<p>'+languageArray[0]+': '+prevResponse+'</p>');
    }
    if ($( '#ratings-form' )!==undefined) {
        $( '#ratings-form' ).css('display', 'block');
    }

});

