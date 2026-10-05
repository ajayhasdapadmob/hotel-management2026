const express = require('express');
const router = express.Router();
const auth = require('../services/auth');
const license = require('../services/license');

function requireAdmin(req,res,next){
  const token = req.headers['x-admin-token'] || req.body?.adminToken || req.query?.adminToken;
  if (!auth.adminTokenOk(token)) return res.status(401).json({success:false,message:'Admin authorization required.'});
  next();
}

router.post('/login',(req,res)=>{
  if (!auth.adminCredentialsOk(req.body?.username,req.body?.password)) return res.status(401).json({success:false,message:'Invalid admin credentials.'});
  res.json({success:true,token:process.env.ADMIN_TOKEN || 'CHANGE_THIS_ADMIN_TOKEN'});
});
router.get('/customers',requireAdmin,(req,res)=>{
  const users = auth.readUsers();
  const licenses = license.readLicenses();
  const data = users.map(u=>({user:auth.publicUser(u),license:licenses.find(l=>l.licenseId===u.licenseId)||null}));
  res.json({success:true,count:data.length,data});
});
router.post('/customers',requireAdmin,(req,res)=>{
  const { username,password,licenseId,customerName,hotelName,mobile,email,days } = req.body || {};
  if (!licenseId) return res.status(400).json({success:false,message:'licenseId is required.'});
  if (license.findLicense(licenseId)) return res.status(409).json({success:false,message:'License ID already exists.'});
  const created = auth.createCustomer({username,password,licenseId});
  if (!created.success) return res.status(400).json(created);
  const lic = license.createLicense({licenseId,customerName,hotelName,mobile,email,days:Number(days)||30,activatedBy:'Owner'});
  if (!lic.success) return res.status(400).json(lic);
  res.status(201).json({success:true,message:'Customer and license created.',data:{user:created.data,license:lic.data}});
});
router.post('/customers/:username/reset-device',requireAdmin,(req,res)=>res.json(auth.resetDevice(req.params.username)));
router.delete('/customers/:username',requireAdmin,(req,res)=>res.json(auth.deleteCustomer(req.params.username)));
router.patch('/licenses/:licenseId/extend',requireAdmin,(req,res)=>{
  const l = license.findLicense(req.params.licenseId);
  if (!l) return res.status(404).json({success:false,message:'License not found.'});
  const days = Number(req.body?.days||30);
  const expiry = license.calculateExpiryDate(l.expiryDate,days);
  res.json(license.activateLicense(l.licenseId,expiry,'Owner'));
});
router.patch('/licenses/:licenseId/suspend',requireAdmin,(req,res)=>{
  res.json(license.suspendLicense(req.params.licenseId,'Owner'));
});
module.exports = router;
