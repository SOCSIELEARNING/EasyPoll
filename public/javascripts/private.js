function activateLabels() {
     if ($( "#polltype" ).val() == 1) {
         $( ".lbl" ).each(function( index ) {
            if (index <= (($( "#polllength" ).val())-1)) {
                $( this ).attr('disabled', false);   
                $( this ).attr('required', true);  
            } else {
                $( this ).attr('disabled', true);
                $( this ).attr('required', false);  
            }
        });
     }
}
function deactivateLabels() {
    $( ".lbl" ).each(function( index ) {
        $( this ).attr('disabled', true);
        $( this ).attr('required', false);
    });
}

$( document ).ready(function() {
    $( "#polltype" ).change(function() {
        if ($( "#polltype" ).val() == 1) {
            activateLabels();
            $( "#poll-labels" ).removeClass('hidden');
        } else {
            deactivateLabels();
            $( "#poll-labels" ).addClass('hidden');
        }
    });
     $( "#cancel" ).click(function() {
         window.history.back();
     });
    $( "#polllength" ).change(function() {
        activateLabels();
    });
});
