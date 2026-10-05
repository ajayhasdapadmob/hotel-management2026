const express = require('express');
const router = express.Router();
const auth = require('../services/auth');
const { findLicense } = require('../services/license');

router.post('/login', (req,res)=>{
  const { username, password, deviceId } = req.body || {};
  const result = auth.loginCustomer(username,password,deviceId);
  if (!result.success) return res.status(result.code === 'DEVICE_MISMATCH' ? 409 : 401).json(result);
  const license = findLicense(result.data.licenseId);
  if (!license) return res.status(403).json({success:false,message:'License is not registered.'});
  if (String(license.status).toLowerCase() !== 'active') return res.status(403).json({success:false,message:`License status is ${license.status}.`});
  if (license.expiryDate && new Date(license.expiryDate) < new Date()) return res.status(403).json({success:false,message:'License has expired.'});
  res.json({success:true,data:{user:result.data,license}});
});


router.post('/check',(req,res)=>{
  const { username, licenseId, deviceId } = req.body || {};
  const user = auth.findUser(username);
  if (!user || user.licenseId !== licenseId || user.deviceId !== deviceId) return res.status(401).json({success:false,message:'License authorization failed.'});
  const license = findLicense(licenseId);
  if (!license) return res.status(404).json({success:false,message:'License not found.'});
  if (String(license.status).toLowerCase() !== 'active') return res.status(403).json({success:false,message:'License is '+license.status+'.'});
  if (license.expiryDate && new Date(license.expiryDate) < new Date()) return res.status(403).json({success:false,message:'License has expired.'});
  res.json({success:true,data:{license}});
});

router.get('/license/:licenseId', (req,res)=>{
  const license = findLicense(req.params.licenseId);
  if (!license) return res.status(404).json({success:false,message:'License not found.'});
  const users = auth.readUsers();
  const user = users.find(u=>u.licenseId===license.licenseId);
  if (!user) return res.status(404).json({success:false,message:'Customer login not found.'});
  res.json({success:true,data:{license,user:auth.publicUser(user)}});
});

module.exports = router;
