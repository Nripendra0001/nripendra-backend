const Notice = require("../models/Notice");

exports.addNotice = async (req,res)=>{
  const n = await Notice.create(req.body);
  res.json(n);
};

exports.getNotices = async (req,res)=>{
  const data = await Notice.find().sort({createdAt:-1});
  res.json(data);
};
