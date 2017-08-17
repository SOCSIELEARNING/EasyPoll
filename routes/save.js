var express = require('express');
var router = express.Router();

var sanitizeHtml = require('sanitize-html');

var mongoclient = require('mongodb').MongoClient;
var objectid = require('mongodb').ObjectID;
var assert = require('assert');

var findReferrer = function(db, query, callback) {
   var cursor = db.collection('polls').find( query );
    var id = '';
   cursor.each(function(err, doc) {
      //assert.equal(err, null);
      if (doc != null) {
          id = doc._id;
        } else {
          callback(id);
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

var updateRecord = function(db, query, polltype, releasedate, labels, callback) {
    //console.log ('Updating record');
    db.collection('polls').updateOne(
      query,
      {
        $set: { 'releasedate': releasedate, 'polltype': polltype, 'labels': labels }
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

var formatLabels = function(polltype, polllength, req) {
    var labelarray = ['1','2','3','4','5'];
    switch(polltype) {
        case 0:
            if (polllength>0) {
                labelarray = [];
                for (var i=0; i<=polllength-1; ++i) {
                    labelarray[(labelarray.length)] = i+1;
                }
            }    
            return (labelarray);
            break;
        case 1:
            if (polllength>0) {
                labelarray = [];
                for (var i=0; i<=polllength-1; ++i) {
                    if (req.body[(('label') + (i+1))] != undefined && req.body[(('label') + (i+1))] != '') {
                        labelarray[(labelarray.length)] = sanitizeHtml(req.body[(('label') + (i+1))]);
                    } else {
                        labelarray[(labelarray.length)] = i+1;
                    }
                }
            }
            return (labelarray);
            break;
        default:
            return (labelarray);
    }
}

router.post('/', function(req, res, next) {
    if (req.query.referrer!=undefined && req.body.polltype!=undefined && req.body.polllength!=undefined) {
        var mongodbaddress = req.app.get('mongodbaddress');
        var referrer = (sanitizeHtml(req.query.referrer));
        var whiteListed = checkAgainstWhitelist(referrer, req.app.get('whitelist'));
        if (whiteListed==true  && typeof(Number(sanitizeHtml(req.body.polltype)))=='number' && typeof(Number(sanitizeHtml(req.body.polllength)))=='number') {
            var labels = formatLabels((Number(sanitizeHtml(req.body.polltype))), (Number(sanitizeHtml(req.body.polllength))), req);
            var creationdate = new Date();
            var releasedate = '';
            if (req.body.releasedate!=undefined) {
                if (req.body.releasedate!='') {
                    releasedate = (sanitizeHtml(req.body.releasedate));
                }
            }
            mongoclient.connect(mongodbaddress, function(err, db) {
                //assert.equal(null, err);
                findReferrer(db, {'referrer': referrer}, function(id) {
                    if (id!='') {
                        updateRecord(db, {'_id': objectid(id)}, (Number(sanitizeHtml(req.body.polltype))), releasedate, labels, function() {
                            console.log ('Record updated: ' + referrer);
                            db.close();
                            res.redirect ('/?poll='+referrer);
                        });
                    } else {
                        insertRecord(db, req, referrer, (Number(sanitizeHtml(req.body.polltype))), releasedate, labels, function() {
                            console.log ('Record created: ' + referrer);
                            db.close();
                            res.redirect ('/?poll='+referrer);
                        });
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