/* MasterChefHub: Firebase web app configuration
 *
 * Fill this in ONCE and sign-in on /login starts working.
 *
 *  1. Go to https://console.firebase.google.com and click "Add project".
 *  2. In the project, open Build > Authentication > Get started.
 *     - Sign-in method tab > turn ON "Google" (set a support email) > Save.
 *     - Also turn ON "Email/Password".
 *     (Apple and Microsoft can be turned on later in the same tab.)
 *  3. Authentication > Settings > Authorized domains > Add domain:
 *        masterchefhub.com        (and www.masterchefhub.com if you use it)
 *     "localhost" is already allowed for testing.
 *  4. Project settings (gear icon) > General > Your apps > click the web icon </>
 *     > register the app > copy the values it shows into the object below.
 *
 * These values are safe to be public. Firebase protects your data with its own
 * rules and with the Authorized domains list above, not by hiding this file.
 */
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};
