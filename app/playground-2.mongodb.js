/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("pharmachain");

// Find a document in a collection.
db.getCollection("medicines").findOne({

});
var importer = db.users.findOne({ role: "importer" });
db.medicines.updateMany(
  { tmdaApproved: true, quantity: { $gt: 0 } },
  { $set: { status: "sold_to_importer", isListed: true, currentOwner: importer._id, currentOwnerName: importer.name } }
);