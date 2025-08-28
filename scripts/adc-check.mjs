import {GoogleAuth} from 'google-auth-library';
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';
const path = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
console.log('[ADC check] PROJECT=', project, 'CRED_PATH=', path);
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const client = await auth.getClient();
const token = await client.getAccessToken();
if (!token || !token.token) {
  throw new Error('ADC token not obtained');
}
console.log('[ADC check] OK: token acquired');