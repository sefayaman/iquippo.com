'use strict';

var Event = require("./event.model");
var _ = require("lodash");

exports.index = function(req, res) {

    Event.find({}).lean().exec(function(err, events) {
        if(err) { return res.status(500).send(err); }
        return res.status(200).json(events);
    });

}

exports.create = function(req, res) {

    var newEvent = new Event(req.body);
    
    newEvent.save(function(err, event) {
        if(err) { return res.status(500).send(err); }
        return res.status(200).json(event);
    });

}

exports.update = function(req, res) {

    Event.findById(req.params.id).exec(function(err, event) {
        if(err) { return res.status(500).send(err); }
        if(!event) { return res.status(404).send('Not Found'); }
        
        var updatedEvent = _.merge(event, req.body);
        updatedEvent.save(function(err, doc) {
            if(err) { return res.status(500).send(err); }
            return res.status(200).json(doc);
        });

    });

}

exports.delete = function(req, res) {

    Event.findByIdAndRemove(req.params.id, function(err, doc) {
        if(err) { return res.status(500).send(err); }
        return res.status(200).json(doc);
    });

}