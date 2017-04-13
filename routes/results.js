var express = require('express');
var router = express.Router();

var mongoclient = require('mongodb').MongoClient;
var objectid = require('mongodb').ObjectID;
var assert = require('assert');

var rating = 0;
var total = 0;
var ratings = [];

var findRecord = function(db, query, callback) {
   var cursor = db.collection('polls').find( query );
   cursor.each(function(err, doc) {
      //assert.equal(err, null);
      if (doc != null) {
          rating = (Number(doc.rating));
          total = (Number(doc.total));
          ratings = (doc.ratings);
        } else {
          callback();
      }
   });
};

var updateRecord = function(db, query, callback) {
    //console.log ('Updating record');
    db.collection('polls').updateOne(
      query,
      {
        $set: { 'rating': rating, 'ratings': ratings, 'total': total }
      }, function(err, results) {
          //assert.equal(err, null);
          callback();
   });
};

var checkAgainstWhitelist = function(referrer, whitelist) {
    var isFound=false;
    if (whitelist.length > 0) {
        for (var i=0; i<whitelist.length; ++i) {
            if ((whitelist[i]).indexOf(referrer)!=-1) {
                isFound=true;
            }
        }
    } else {
        isFound=true;
    }
    return (isFound);
}

router.post('/', function(req, res, next) {
    if (req.headers.referer!='') {
        var whiteListed = checkAgainstWhitelist(req.headers.referer, req.app.get('whitelist'));
        if (whiteListed==true) {    
            var mongodbaddress = req.app.get('mongodbaddress');
            mongoclient.connect(mongodbaddress, function(err, db) {
                //assert.equal(null, err);
                findRecord(db, {'_id': objectid(req.query.id)}, function() {
                    if (isNaN(total)==false && isNaN(rating)==false) {
                        rating = (rating + (Number(req.body.rating)));
                        if (ratings[((Number(req.body.rating))-1)]==undefined || ratings[((Number(req.body.rating))-1)]==null) {
                            ratings[((Number(req.body.rating))-1)]=1;
                        } else {
                            if (isNaN(ratings[((Number(req.body.rating))-1)])==false) {
                                ratings[((Number(req.body.rating))-1)] = ++(ratings[((Number(req.body.rating))-1)]);    
                            }
                        }
                        ++total;
                        updateRecord(db, {'_id': objectid(req.query.id)}, function() {
                            db.close();
                            //console.log ('Referrer: ' + req.headers.referer);
                            //console.log ('ID: ' + req.query.id);
                            console.log ('Rating: ' + req.body.rating);
                            res.redirect (req.headers.referer);
                        });  
                    } else {
                        //console.log ('Referrer: ' + req.headers.referer);
                        //console.log ('ID: ' + req.query.id);
                        console.log ('Rating: ' + req.body.rating);
                        res.redirect (req.headers.referer);
                    }
                });
            });
        } else {
            res.render('error', { message: (req.app.get('languagePack'))[5], error: {status: null, stack: null}});
        }
    } else {
        res.render('error', { message: (req.app.get('languagePack'))[4], error: {status: null, stack: null}});
    }
});

module.exports = router;