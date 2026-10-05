# Customer License System

This V3-7 package now uses owner-created customer accounts. Customers cannot create their own usernames.

## Owner/Admin
Open `/admin.html` from the license server.

Default setup values in `server/.env.example`:
- ADMIN_USERNAME=owner
- ADMIN_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
- ADMIN_TOKEN=CHANGE_THIS_LONG_RANDOM_TOKEN

Change all three before production.

## Customer creation
Owner creates:
- unique Username
- password
- unique License ID
- hotel/customer details
- initial 30-day or 1-year license

The customer receives only the username, password and license information. There is no customer registration page.

## Device protection
On first successful login, the server binds that customer login to a generated device ID. The same credentials on another browser/device are rejected until the owner uses **Reset Device** in the admin panel.

## Customer app
Set `window.LICENSE_SERVER_URL` in `js/license-config.js` if the central server is hosted separately. If the app and server share the same origin, leave it empty.

## Important
A central server is required for remote license control. The local browser data is not the authority for activation, expiry or device authorization.
