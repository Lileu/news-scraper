var db = require("../models");

module.exports = {
  // Find a comment by id
  find: function(req, res) {
    db.Comment.find({ _headlineId: req.params.id }).then(function(dbComment) {
      res.json(dbComment);
    });
  },
  // Create a comment
  create: function(req, res) {
    db.Comment.create(req.body).then(function(dbComment) {
      res.json(dbComment);
    });
  },
  // Delete a comment
  delete: function(req, res) {
    db.Comment.remove({ _id: req.params.id }).then(function(dbComment) {
      res.json(dbComment);
    });
  }
};
