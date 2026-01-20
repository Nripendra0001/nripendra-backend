const Result = require("../models/Result");

exports.addResult = async (req, res) => {
  try {
    const data = await Result.create(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const data = await Result.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
