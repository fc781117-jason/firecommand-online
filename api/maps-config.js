/**
 * FireCommand v26 Google Maps browser configuration.
 * The browser key MUST be restricted in Google Cloud by HTTP referrer and API.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GOOGLE_MAPS_BROWSER_KEY || '';
  const mapId = process.env.GOOGLE_MAPS_MAP_ID || '';
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).json({
    enabled: Boolean(key),
    key,
    mapId,
    version: '26',
    requiredApis: ['Maps JavaScript API', 'Places API (New)', 'Geocoding API']
  });
}
