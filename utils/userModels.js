const USUser    = require("../models/USUser");
const SAUser    = require("../models/SAUser");
const OtherUser = require("../models/OtherUser");

const MODEL_BY_COUNTRY = { US: USUser, ZA: SAUser, OTHER: OtherUser };
const MODEL_BY_PARAM   = { us: USUser, sa: SAUser, other: OtherUser };

module.exports = { MODEL_BY_COUNTRY, MODEL_BY_PARAM };