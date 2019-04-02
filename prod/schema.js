"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _graphql = require("graphql");

var _default = (0, _graphql.buildSchema)(`type Query {
  hello: String
}

schema {
  query: Query
}
`);

exports.default = _default;