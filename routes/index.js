var express = require('express');
var router = express.Router();

var sanitizeHtml = require('sanitize-html');

var mongoclient = require('mongodb').MongoClient;
var assert = require('assert');

var defaultRecord = {polltype: 0, releasedate: '', labels: ['1','2','3','4','5']};

var findReferrer = function(db, query, callback) {
   //Create index on referrer to ensure no duplicates and allowed, needed for upsert
   db.collection('polls').createIndex( {'referrer': 1}, { unique: true } )
   var cursor = db.collection('polls').find( query );
   var id = ''; 
   var total = 0;
   var rating = 0;
   var labels = [];
   var ratings = [];
   var polltype = 0;
   var releasedate = '';
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
          if (doc.polltype!=undefined) {
              if (isNaN(Number(doc.polltype))==false) {
                polltype = doc.polltype;
              }
          }
          if (doc.releasedate!=undefined) {
              releasedate = doc.releasedate;
          }
        } else {
          console.log ('Finished searching database for referrer - Exiting');
          callback(id, total, rating, labels, ratings, polltype, releasedate);
      }
   });
};

var insertRecord = function(db, req, referrer, polltype, releasedate, labels, callback) {
    console.log ('Creating empty record using update to make sure no duplicates are created');
    db.collection('polls').update(
        { referrer: referrer },
        {
            //Only update if a new document is inserted
            $setOnInsert: { total: 0, rating: 0, ratings: [], referrer: referrer, creator: '', title: '', description: '', responselimit: 1, chngresponse: false, creationdate: new Date(), releasedate: releasedate, manualrelease: false, labels: labels, entries: [], polltype: polltype, flag1: false, flag2: false, flag3: false, meta1: '', meta2: '', meta3: '' }
        },
            //Inserts a single document if none exists
        { upsert: true },
        function(err, result) {
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

var generateShareAddress = function(req, referrer) {
    var shareAddress='';
    if (req.get('host')!=undefined && req.protocol!=undefined) {
        shareAddress = (req.protocol + '://' + req.get('host') + '?poll=' + referrer);
    }
    return (shareAddress);
}

var authenticateUser = function(req) {
    //Add custom authentication
    return (req.app.get('isAdmin'))
}
var parseReferrer = function(param) {
    var str = '';
    var query = ((param).toString()).split('?');
    if (query.length>=2) {
        var queryarray = (query[1]).split('&');
        if (queryarray.length>0) {
            var params = new Object();
            for(var i=0; i<queryarray.length; i++) {	
                params[(queryarray[i].split('='))[0]] = (queryarray[i].split('='))[1];	
            }
            if (params.poll!=undefined) {
                str = (sanitizeHtml(params.poll)).replace(/[^A-Za-z0-9]/g, '');
            }
        }
    }
    return (str);
}

router.get('/', function(req, res, next) {
    if (req.originalUrl!=undefined) {
        var mongodbaddress = req.app.get('mongodbaddress');
        var referrer = parseReferrer(req.originalUrl);
        if (referrer!='') {
            var whiteListed = checkAgainstWhitelist(referrer, req.app.get('whitelist'));
            if (whiteListed==true) {
                var shareAddress=generateShareAddress(req, referrer);
                var isAdmin = authenticateUser(req);
                console.log ('Instance referrer: ' + referrer);
                mongoclient.connect(mongodbaddress, function(err, db) {
                    //assert.equal(null, err);
                    findReferrer(db, {'referrer': referrer}, function(id, total, rating, labels, ratings, polltype, releasedate) {
                        if (id!='') {
                            db.close();
                            if (releasedate!='') {
                                var currDate = new Date();
                                var targetDate = new Date(releasedate);
                                if (targetDate=='Invalid Date') {
                                    res.render('index', { languagePack: req.app.get('languagePack'), id: id, total: total, rating: rating, ratings: ratings, labels: labels, polltype: polltype, isAdmin: isAdmin});
                                } else if (targetDate<=currDate) {
                                    res.render('index', { languagePack: req.app.get('languagePack'), id: id, total: total, rating: rating, ratings: ratings, labels: labels, polltype: polltype, isAdmin: isAdmin});
                                } else {
                                    res.render('splash', { languagePack: req.app.get('languagePack'), id: id, releasedate: releasedate, polltype: polltype, isAdmin: isAdmin}); 
                                }
                            } else {
                                res.render('index', { languagePack: req.app.get('languagePack'), id: id, total: total, rating: rating, ratings: ratings, labels: labels, polltype: polltype, isAdmin: isAdmin});
                            }
                        } else {
                            if (isAdmin==true) {
                                db.close();
                                res.render('private', { languagePack: req.app.get('languagePack'), referrer: referrer, isAdmin: isAdmin, allowShare: req.app.get('allowShare'), shareAddress: shareAddress });
                            } else {
                                insertRecord(db, req, referrer, defaultRecord.polltype, defaultRecord.releasedate, defaultRecord.labels, function() {
                                    findReferrer(db, {'referrer': referrer}, function(id, total, rating, labels, ratings, polltype, releasedate) {
                                        db.close();
                                        res.render('index', { languagePack: req.app.get('languagePack'), id: id, total: total, rating: rating, ratings: ratings, labels: labels, polltype: polltype, isAdmin: isAdmin});
                                    });
                                });
                            }
                        }
                    });
                });
            } else {
                res.render('error', { message: (req.app.get('languagePack'))[5], error: {status: null, stack: null}});
            }
        } else {
            res.render('error', { message: (req.app.get('languagePack'))[4], error: {status: null, stack: null}});
        }
    }
});

module.exports = router;
