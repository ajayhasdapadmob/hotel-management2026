const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '../data/users.json');

function ensure() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
}
function readUsers() {
  ensure();
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
}
function saveUsers(users) {
  ensure();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function findUser(username) {
  return readUsers().find(u => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
}
function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}
function adminCredentialsOk(username, password) {
  return String(username || '') === String(process.env.ADMIN_USERNAME || 'owner') &&
    String(password || '') === String(process.env.ADMIN_PASSWORD || 'ChangeMeNow!');
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual,'hex'), Buffer.from(expected,'hex'));
}
function adminTokenOk(token) {
  return String(token || '') === String(process.env.ADMIN_TOKEN || 'CHANGE_THIS_ADMIN_TOKEN');
}
function createCustomer(data) {
  const users = readUsers();
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  const licenseId = String(data.licenseId || '').trim();
  if (!username || !password || !licenseId) return { success:false, message:'username, password and licenseId are required.' };
  if (username.length < 4) return { success:false, message:'Username must be at least 4 characters.' };
  if (password.length < 6) return { success:false, message:'Password must be at least 6 characters.' };
  if (findUser(username)) return { success:false, message:'Username already exists.' };
  if (users.some(u => u.licenseId === licenseId)) return { success:false, message:'This license already has a user.' };
  const user = {
    id: `USR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    username,
    passwordHash: hashPassword(password),
    licenseId,
    role: 'customer',
    deviceId: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };
  users.push(user);
  saveUsers(users);
  return { success:true, message:'Customer login created.', data:publicUser(user) };
}
function loginCustomer(username, password, deviceId) {
  const user = findUser(username);
  if (!user || user.role !== 'customer' || !verifyPassword(String(password || ''), user.passwordHash)) {
    return { success:false, message:'Invalid username or password.' };
  }
  if (!deviceId) return { success:false, message:'Device ID is required.' };
  if (user.deviceId && user.deviceId !== deviceId) {
    return { success:false, code:'DEVICE_MISMATCH', message:'This license is already registered on another device. Please contact the software owner.' };
  }
  if (!user.deviceId) user.deviceId = deviceId;
  user.lastLoginAt = new Date().toISOString();
  const users = readUsers();
  const idx = users.findIndex(u => u.id === user.id);
  users[idx] = user;
  saveUsers(users);
  return { success:true, data:publicUser(user) };
}
function resetDevice(username) {
  const users = readUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
  if (idx === -1) return { success:false, message:'User not found.' };
  users[idx].deviceId = null;
  saveUsers(users);
  return { success:true, message:'Device authorization reset.', data:publicUser(users[idx]) };
}
function deleteCustomer(username) {
  const users = readUsers();
  const next = users.filter(u => u.username.toLowerCase() !== String(username || '').trim().toLowerCase());
  if (next.length === users.length) return { success:false, message:'User not found.' };
  saveUsers(next);
  return { success:true, message:'Customer login deleted.' };
}
module.exports = { readUsers, publicUser, findUser, adminCredentialsOk, adminTokenOk, createCustomer, loginCustomer, resetDevice, deleteCustomer };
