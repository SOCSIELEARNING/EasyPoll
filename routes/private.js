var express = require('express');
var router = express.Router();

var sanitizeHtml = require('sanitize-html');

var mongoclient = require('mongodb').MongoClient;
var objectid = require('mongodb').ObjectID;
var assert = require('assert');

var findRecord = function(db, query, callback) {
    var cursor = db.collection('polls').find( query );
    
    var id = '';
    var referrer = '';
    var labels = [];
    var polltype = 0;
    var releasedate = '';
   
    cursor.each(function(err, doc) {
      //assert.equal(err, null);
      if (doc != null) {
          console.log ('Poll referrer found in database - Passing data to view');
          console.dir(doc);
          id = doc._id;
          if (doc.referrer!=undefined) {
              referrer = doc.referrer;
          }
          if (doc.labels!=undefined) {
              labels = doc.labels;
          }
          if (doc.polltype!=undefined) {
              polltype = doc.polltype;
          }
          if (doc.releasedate!=undefined) {
              releasedate = doc.releasedate;
          }
        } else {
          console.log ('Finished searching database for referrer - Exiting');
          callback(id, referrer, labels, polltype, releasedate);
      }
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

router.get('/', function(req, res, next) {
    if (req.headers.referer!='' && req.query.id!=undefined) {
        var mongodbaddress = req.app.get('mongodbaddress');
        var whiteListed = checkAgainstWhitelist(req.headers.referer, req.app.get('whitelist'));
        if (whiteListed==true) {  
            mongoclient.connect(mongodbaddress, function(err, db) {
                //assert.equal(null, err);
                findRecord(db, {'_id': objectid(req.query.id)}, function(id, referrer, labels, polltype, releasedate) {
                    var shareAddress = generateShareAddress(req, referrer);
                    var isAdmin = authenticateUser(req);
                    if (id!='') {
                        db.close();
                        if (isAdmin==true) {
                            res.render('private', { languagePack: req.app.get('languagePack'), referrer: referrer, labels: labels, polllength: labels.length, polltype: polltype, releasedate: releasedate, isAdmin: isAdmin, allowShare: req.app.get('allowShare'), shareAddress: shareAddress });
                        } else {
                            res.render('error', { message: (req.app.get('languagePack'))[5], error: {status: null, stack: null}});
                        }
                    } else {
                         db.close();
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
