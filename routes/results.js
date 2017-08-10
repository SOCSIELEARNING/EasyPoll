var express = require('express');
var router = express.Router();

var sanitizeHtml = require('sanitize-html');

var mongoclient = require('mongodb').MongoClient;
var objectid = require('mongodb').ObjectID;
var assert = require('assert');

var findRecord = function(db, query, callback) {
   var cursor = db.collection('polls').find( query );
   var rating = 0;
   var total = 0;
   var ratings = [];
   cursor.each(function(err, doc) {
      //assert.equal(err, null);
      if (doc != null) {
          rating = (Number(doc.rating));
          total = (Number(doc.total));
          ratings = (doc.ratings);
        } else {
          callback(rating, total, ratings);
      }
   });
};

var updateRecord = function(db, query, rating, total, ratings, callback) {
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
            if ((referrer).indexOf(whitelist[i])!=-1) {
                isFound=true;
            }
        }
    } else {
        isFound=true;
    }
    return (isFound);
}

router.post('/', function(req, res, next) {
    if (req.headers.referer!='' && req.query.id!=undefined) {
        var whiteListed = checkAgainstWhitelist(req.headers.referer, req.app.get('whitelist'));
        if (whiteListed==true &&  typeof(Number(sanitizeHtml(req.body.rating)))=='number') {    
            var mongodbaddress = req.app.get('mongodbaddress');
            mongoclient.connect(mongodbaddress, function(err, db) {
                //assert.equal(null, err);
                findRecord(db, {'_id': objectid(req.query.id)}, function(rating, total, ratings) {
                    if (isNaN(total)==false && isNaN(rating)==false) {
                        rating = (rating + (Number(sanitizeHtml(req.body.rating))));
                        if (ratings[((Number(sanitizeHtml(req.body.rating)))-1)]==undefined || ratings[((Number(sanitizeHtml(req.body.rating)))-1)]==null) {
                            ratings[((Number(sanitizeHtml(req.body.rating)))-1)]=1;
                        } else {
                            if (isNaN(ratings[((Number(sanitizeHtml(req.body.rating)))-1)])==false) {
                                ratings[((Number(sanitizeHtml(req.body.rating)))-1)] = ++(ratings[((Number(sanitizeHtml(req.body.rating)))-1)]);    
                            }
                        }
                        ++total;
                        updateRecord(db, {'_id': objectid(req.query.id)}, rating, total, ratings, function() {
                            console.log ('Done: ' + req.headers.referer);
                            db.close();
                            console.log ('Rating: ' + req.body.rating);
                            res.redirect (req.headers.referer);
                        });  
                    } else {
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