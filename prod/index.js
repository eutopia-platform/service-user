"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _url = _interopRequireDefault(require("url"));

var _graphql = require("graphql");

var _schema = _interopRequireDefault(require("./schema"));

var _rootResolvers = _interopRequireDefault(require("./rootResolvers"));

var _micro = require("micro");

const headers = {
  'Content-Type': 'application/json'
};

const getArguments = async request => {
  switch (request.method) {
    case 'POST':
      return (0, _micro.json)(request);

    case 'GET':
      return _url.default.parse(request.url, true).query;

    default:
      throw new Error('Invalid request method');
  }
};

const sendWithStatusCode = (response, status, headers, data) => {
  response.writeHead(status, headers);
  response.end(data);
};

const getSendError = response => e => {
  var _ref, _errors;

  return _ref = (_errors = {
    errors: {
      message: e.message
    }
  }, JSON.stringify(_errors)), sendWithStatusCode(response, 401, headers, _ref);
};

const main = async (request, response) => {
  // response.setHeader('Content-Type', 'application/json')
  const sendError = getSendError(response);

  try {
    var _ref2, _ref3;

    const args = await getArguments(request);
    const context = {};
    const query = args.query;
    const variables = args.variables;
    const operationName = args.operationName;
    _ref2 = (_ref3 = await (0, _graphql.graphql)(_schema.default, query, _rootResolvers.default, context, variables, operationName), JSON.stringify(_ref3)), sendWithStatusCode(response, 200, headers, _ref2);
  } catch (e) {
    sendError(e);
  }
};

var _default = (req, res) => {
  main(req, res);
};

exports.default = _default;