var express = require('express');
var router = express.Router();

var url = require('url');

var sanitizeHtml = require('sanitize-html');

var mongoclient = require('mongodb').MongoClient;
var assert = require('assert');

var id = '';
var referrer = '';
var total = 0;
var rating = 0;
var ratings = [];
var labels = [];

var findReferrer = function(db, query, callback) {
   //Create index on referrer to ensure no duplicates and allowed, needed for upsert
   db.collection('referrer').createIndex( {'referrer': 1}, { unique: true } )
   var cursor = db.collection('referrer').find( query );
   cursor.each(function(err, doc) {
      //assert.equal(err, null);
      if (doc != null) {
          console.log ('Poll referrer found in database - Passing ratings to view');
          console.dir(doc);
          id = doc._id;
          if (doc.total!=undefined) {
              if (isNaN(Number(doc.total))==false) {
                  total = (Number(doc.total));  
              }
          }
          if (doc.rating!=undefined) {
              if (isNaN(Number(doc.rating))==false) {
                rating = (Number(doc.rating));    
              }
          }
          if (doc.labels!=undefined) {
              labels = doc.labels;
          }
          if (doc.ratings!=undefined) {
              ratings = doc.ratings;
          }
        } else {
          console.log ('Finished searching database for referrer - Exiting');
          callback();
      }
   });
};
var insertRecord = function(db, req, callback) {
    console.log ('Creating empty record using update to make sure no duplicates are created');
    db.collection('referrer').update(
        { referrer: referrer },
        {
            //Only update if a new document is inserted
            $setOnInsert: { total: 0, rating: 0, ratings: [], referrer: referrer, creator: '', title: '', description: '', responselimit: 1, chngresponse: false, creationdate: new Date(), releasedate: new Date(), manualrelease: false, labels: ['1','2','3','4','5'], entries: [], flag1: false, flag2: false, flag3: false, meta1: '', meta2: '', meta3: '' }
        },
            //Inserts a single document if non exists
        { upsert: true },
        function(err, result) {
            //assert.equal(err, null);
            callback();
    }); 
};

var getFormattedUrl = function(req) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });
}

router.get('/', function(req, res, next) {
    var mongodbaddress = req.app.get('mongodbaddress');
    id = '';
    referrer = (sanitizeHtml(getFormattedUrl(req))).replace(/[^A-Za-z0-9]/g, '');
    total = 0;
    rating = 0;
    ratings = [];
    labels = [];
    console.log ('Instance referrer: ' + referrer);
    mongoclient.connect(mongodbaddress, function(err, db) {
        //assert.equal(null, err);
        findReferrer(db, {'referrer': referrer}, function() {
            if (id!='') {
                db.close();
                res.render('index', { title: 'EasyPoll', id: id, total: total, rating: rating, ratings: ratings, labels: labels});
            } else {                    
                insertRecord(db, req, function() {
                    findReferrer(db, {'referrer': referrer}, function() {
                        db.close();
                        res.render('index', { title: 'EasyPoll', id: id, total: total, rating: rating, ratings: ratings, labels: labels});
                    });
                });
            }
        });
    });
    
    
    
});

module.exports = router;
