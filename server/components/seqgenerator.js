'use strict';
var mongoose = require('mongoose');

var SequenceSchema, Sequence;

  SequenceSchema = new mongoose.Schema({
    nextSeqNumber: { type: Number, default: 1002 },
    collectionName:String
  });

  Sequence = mongoose.model('SeqGenerator', SequenceSchema);

function sequenceGenerator(){
  return {
    next: function(callback,colName){
      Sequence.find({collectionName:colName},function(err, data){
        if(err){ throw(err); }

        if(data.length < 1){
          // create if doesn't exist create and return first
          Sequence.create({collectionName:colName}, function(err, seq){
            if(err) { throw(err); }
            callback(seq.nextSeqNumber - 1);
          });
        } else {
          // update sequence and return next
          Sequence.findByIdAndUpdate(data[0]._id, { $inc: { nextSeqNumber: 1 } }, function(err, seq){
            if(err) { throw(err); }
            callback(seq.nextSeqNumber);
          });
        }
      });
    }
  };
}

exports.sequence = sequenceGenerator;
