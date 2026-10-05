/* Central license server configuration.
   - Leave empty for the normal deployment where the hotel app and API are served together.
   - For a separate API server, replace the value below with its HTTPS origin.
   The app supports ONLINE mode first and OFFLINE fallback after a successful online activation.
*/
window.LICENSE_SERVER_URL = window.LICENSE_SERVER_URL || window.location.origin;
