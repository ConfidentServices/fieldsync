/**
 * FieldSync Route Intelligence
 * =============================
 * Suggests better route ordering using our own TSP solver.
 * Google APIs for geocoding + distance matrix. Zero routing SaaS.
 *
 * Pipeline:
 *   1. Geocode each stop address (cached — addresses rarely change)
 *   2. Build distance matrix via Google Distance Matrix API
 *   3. Run Nearest Neighbor + 2-opt TSP solver (milliseconds, O(n²))
 *   4. Compare optimized vs current order → calculate savings
 *   5. Return human-readable recommendation + Google Maps link for tech
 *
 * We are NOT doing the routing. We SUGGEST it. Owner approves → tech gets SMS.
 *
 * Cost model (absorbed into margin):
 *   - Geocoding: $5/1,000 (one-time per address, cached in DB)
 *   - Distance Matrix: $5/1,000 elements (n² per tech per day)
 *   - For 10 techs × 20 stops: 400 elements/day → ~$0.002/day per company
 */

import type { FSJob } from '../connectors/base';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodedStop {
  job: FSJob;
  latlng: LatLng;
  addressNormalized: string;
}

export interface RouteAnalysis {
  techId: string;
  techName: string;
  date: Date;
  jobCount: number;
  currentOrder: FSJob[];
  optimizedOrder: FSJob[];
  currentMiles: number;
  optimizedMiles: number;
  milesSaved: number;
  estimatedFuelSaved: number;   // dollars at IRS $0.21/mile rate
  estimatedTimeSavedMin: number;
  annualizedSavings: number;    // milesSaved × 250 working days × $0.21
  googleMapsLink: string;       // directions URL for tech SMS
  improvement: 'significant' | 'minor' | 'none'; // >3mi = significant, >0.5mi = minor
}

export interface GeocodeCache {
  get(address: string): Promise<LatLng | null>;
  set(address: string, latlng: LatLng): Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';
const IRS_MILEAGE_RATE = 0.21;       // per mile
const WORKING_DAYS_PER_YEAR = 250;
const AVG_SPEED_MPH = 25;             // urban field service average
const MIN_SAVINGS_TO_REPORT = 0.5;   // miles — below this don't bother showing

// ─── Geocoding ────────────────────────────────────────────────────────────────

export async function geocodeAddress(
  address: string,
  apiKey: string,
  cache: GeocodeCache
): Promise<LatLng | null> {
  const normalized = normalizeAddress(address);

  // Check cache first
  const cached = await cache.get(normalized);
  if (cached) return cached;

  // Hit Google Geocoding API
  const url = new URL(`${GOOGLE_MAPS_API_BASE}/geocode/json`);
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString());
    const data = await res.json() as GoogleGeocodeResponse;

    if (data.status !== 'OK' || !data.results.length) {
      console.warn(`[RouteOptimizer] Geocode failed for "${address}": ${data.status}`);
      return null;
    }

    const latlng: LatLng = {
      lat: data.results[0].geometry.location.lat,
      lng: data.results[0].geometry.location.lng,
    };

    await cache.set(normalized, latlng);
    return latlng;
  } catch (err) {
    console.error(`[RouteOptimizer] Geocode error for "${address}":`, err);
    return null;
  }
}

// ─── Distance Matrix ──────────────────────────────────────────────────────────

/**
 * Build a full N×N distance matrix (in miles) for a set of stops.
 * Uses Google Distance Matrix API in batches of 10×10 (max 100 elements per call).
 * Returns distances[i][j] = miles from stop i to stop j.
 */
export async function buildDistanceMatrix(
  stops: LatLng[],
  apiKey: string
): Promise<number[][]> {
  const n = stops.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Google Distance Matrix max: 10 origins × 10 destinations = 100 elements per call
  const BATCH = 10;

  for (let iStart = 0; iStart < n; iStart += BATCH) {
    const iEnd = Math.min(iStart + BATCH, n);
    const origins = stops.slice(iStart, iEnd);

    for (let jStart = 0; jStart < n; jStart += BATCH) {
      const jEnd = Math.min(jStart + BATCH, n);
      const destinations = stops.slice(jStart, jEnd);

      const url = new URL(`${GOOGLE_MAPS_API_BASE}/distancematrix/json`);
      url.searchParams.set(
        'origins',
        origins.map((p) => `${p.lat},${p.lng}`).join('|')
      );
      url.searchParams.set(
        'destinations',
        destinations.map((p) => `${p.lat},${p.lng}`).join('|')
      );
      url.searchParams.set('units', 'imperial');
      url.searchParams.set('key', apiKey);

      try {
        const res = await fetch(url.toString());
        const data = await res.json() as GoogleDistanceMatrixResponse;

        if (data.status !== 'OK') {
          console.warn(`[RouteOptimizer] Distance matrix error: ${data.status}`);
          // Fall back to haversine for this batch
          for (let i = 0; i < origins.length; i++) {
            for (let j = 0; j < destinations.length; j++) {
              matrix[iStart + i][jStart + j] = haversineDistance(
                origins[i],
                destinations[j]
              );
            }
          }
          continue;
        }

        for (let i = 0; i < data.rows.length; i++) {
          for (let j = 0; j < data.rows[i].elements.length; j++) {
            const el = data.rows[i].elements[j];
            if (el.status === 'OK' && el.distance?.value != null) {
              // Google returns meters — convert to miles
              matrix[iStart + i][jStart + j] = el.distance.value / 1609.34;
            } else {
              // Fallback to haversine
              matrix[iStart + i][jStart + j] = haversineDistance(
                origins[i],
                destinations[j]
              );
            }
          }
        }
      } catch (err) {
        console.error('[RouteOptimizer] Distance matrix fetch error:', err);
        // Haversine fallback for entire batch
        for (let i = 0; i < origins.length; i++) {
          for (let j = 0; j < destinations.length; j++) {
            matrix[iStart + i][jStart + j] = haversineDistance(
              origins[i],
              destinations[j]
            );
          }
        }
      }
    }
  }

  return matrix;
}

// ─── TSP Solver ───────────────────────────────────────────────────────────────

/**
 * Nearest Neighbor heuristic — O(n²), produces a reasonable initial tour.
 * Start from index 0 (tech's first scheduled stop or depot).
 */
function nearestNeighbor(distMatrix: number[][], startIdx = 0): number[] {
  const n = distMatrix.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const visited = new Set<number>([startIdx]);
  const tour = [startIdx];

  while (visited.size < n) {
    const current = tour[tour.length - 1];
    let nearest = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distMatrix[current][i] < nearestDist) {
        nearestDist = distMatrix[current][i];
        nearest = i;
      }
    }

    if (nearest === -1) break; // shouldn't happen
    tour.push(nearest);
    visited.add(nearest);
  }

  return tour;
}

/**
 * 2-opt improvement — reverses segments to eliminate crossing paths.
 * O(n²) per pass, typically converges in 5-15 passes for n < 50.
 * This runs in < 5ms for 50 stops.
 */
function twoOpt(tour: number[], distMatrix: number[][], maxPasses = 50): number[] {
  const n = tour.length;
  if (n < 4) return tour;

  let best = [...tour];
  let improved = true;
  let passes = 0;

  while (improved && passes < maxPasses) {
    improved = false;
    passes++;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        // Skip adjacent edges
        if (i === 0 && j === n - 1) continue;

        // Current: ...→tour[i]→tour[i+1]→...→tour[j]→tour[j+1]→...
        // Swapped: ...→tour[i]→tour[j]→...→tour[i+1]→tour[j+1]→...
        const a = best[i];
        const b = best[i + 1];
        const c = best[j];
        const d = best[(j + 1) % n];

        const currentDist = distMatrix[a][b] + distMatrix[c][d];
        const swappedDist = distMatrix[a][c] + distMatrix[b][d];

        if (swappedDist < currentDist - 0.001) {
          // Reverse segment [i+1 .. j]
          const newTour = [...best];
          let left = i + 1;
          let right = j;
          while (left < right) {
            [newTour[left], newTour[right]] = [newTour[right], newTour[left]];
            left++;
            right--;
          }
          best = newTour;
          improved = true;
        }
      }
    }
  }

  return best;
}

/**
 * Main TSP solver: nearest neighbor + 2-opt.
 * Returns indices into the stops array in optimized order.
 */
export function solveTSP(distMatrix: number[][]): number[] {
  if (distMatrix.length <= 2) return distMatrix.map((_, i) => i);

  const nnTour = nearestNeighbor(distMatrix, 0);
  const optimized = twoOpt(nnTour, distMatrix);
  return optimized;
}

// ─── Tour Length Calculation ──────────────────────────────────────────────────

export function tourLengthMiles(order: number[], distMatrix: number[][]): number {
  if (order.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    total += distMatrix[order[i]][order[i + 1]];
  }
  return total;
}

// ─── Google Maps Directions Link ──────────────────────────────────────────────

/**
 * Build a Google Maps directions URL for the tech.
 * Opens in Maps app on mobile — perfect for SMS delivery.
 */
export function buildGoogleMapsLink(stops: GeocodedStop[]): string {
  if (stops.length === 0) return 'https://maps.google.com';
  if (stops.length === 1) {
    const { lat, lng } = stops[0].latlng;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const origin = `${stops[0].latlng.lat},${stops[0].latlng.lng}`;
  const destination = `${stops[stops.length - 1].latlng.lat},${stops[stops.length - 1].latlng.lng}`;

  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.latlng.lat},${s.latlng.lng}`)
    .join('|');

  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  if (waypoints) url.searchParams.set('waypoints', waypoints);
  url.searchParams.set('travelmode', 'driving');

  return url.toString();
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

/**
 * Full route analysis for a single tech's day.
 *
 * @param jobs - Jobs in their CURRENT scheduled order
 * @param techStartLatLng - Tech's starting location (home/depot)
 * @param apiKey - Google Maps API key
 * @param cache - Geocode cache implementation
 */
export async function analyzeRoute(
  jobs: FSJob[],
  techStartLatLng: LatLng,
  apiKey: string,
  cache: GeocodeCache
): Promise<RouteAnalysis | null> {
  if (jobs.length < 2) return null;

  const techName = jobs[0].techName ?? jobs[0].techId ?? 'Unknown';
  const techId = jobs[0].techId ?? 'unknown';

  // Step 1: Geocode all stops (including tech start as index 0)
  const allAddresses = [
    { address: `${techStartLatLng.lat},${techStartLatLng.lng}`, isDepot: true },
    ...jobs.map((j) => ({ address: j.serviceAddress, isDepot: false })),
  ];

  const geocoded: (LatLng | null)[] = await Promise.all(
    allAddresses.map(({ address, isDepot }) =>
      isDepot
        ? Promise.resolve(techStartLatLng)
        : geocodeAddress(address, apiKey, cache)
    )
  );

  // Filter out stops we couldn't geocode
  const validStops: Array<{ idx: number; job?: FSJob; latlng: LatLng }> = [];
  geocoded.forEach((latlng, i) => {
    if (latlng) {
      validStops.push({
        idx: i,
        job: i === 0 ? undefined : jobs[i - 1],
        latlng,
      });
    }
  });

  if (validStops.length < 3) {
    // Need depot + at least 2 stops for optimization to mean anything
    return null;
  }

  // Step 2: Build distance matrix (depot + all valid stops)
  const stops = validStops.map((s) => s.latlng);
  const distMatrix = await buildDistanceMatrix(stops, apiKey);

  // Step 3: Current order (jobs as scheduled — indices 1..n)
  const currentOrder = validStops.slice(1).map((_, i) => i + 1); // [1, 2, 3, ..., n]

  // Step 4: Optimized order via TSP (depot is fixed at 0)
  // Solve for job stops only, then prepend depot
  const jobSubMatrix = buildSubMatrix(distMatrix, validStops.slice(1).map((_, i) => i + 1));
  const optimizedJobOrder = solveTSP(jobSubMatrix);
  // Map back to full matrix indices
  const optimizedOrder = optimizedJobOrder.map((i) => i + 1);

  // Step 5: Calculate miles
  const currentWithDepot = [0, ...currentOrder];
  const optimizedWithDepot = [0, ...optimizedOrder];

  const currentMiles = tourLengthMiles(currentWithDepot, distMatrix);
  const optimizedMiles = tourLengthMiles(optimizedWithDepot, distMatrix);
  const milesSaved = Math.max(0, currentMiles - optimizedMiles);

  // Step 6: Calculate savings
  const estimatedFuelSaved = milesSaved * IRS_MILEAGE_RATE;
  const estimatedTimeSavedMin = Math.round((milesSaved / AVG_SPEED_MPH) * 60);
  const annualizedSavings = milesSaved * WORKING_DAYS_PER_YEAR * IRS_MILEAGE_RATE;

  // Step 7: Build optimized job list
  const validJobs = validStops.slice(1).map((s) => s.job!);
  const optimizedJobs = optimizedJobOrder.map((i) => validJobs[i]);
  const currentJobs = currentOrder.map((i) => validJobs[i - 1]);

  // Step 8: Google Maps link for optimized route
  const geocodedStops: GeocodedStop[] = optimizedJobs.map((job, i) => ({
    job,
    latlng: validStops[optimizedOrder[i]].latlng,
    addressNormalized: normalizeAddress(job.serviceAddress),
  }));
  const googleMapsLink = buildGoogleMapsLink(geocodedStops);

  const improvement: RouteAnalysis['improvement'] =
    milesSaved >= 3 ? 'significant' : milesSaved >= MIN_SAVINGS_TO_REPORT ? 'minor' : 'none';

  return {
    techId,
    techName,
    date: jobs[0].scheduledDate,
    jobCount: validJobs.length,
    currentOrder: currentJobs,
    optimizedOrder: optimizedJobs,
    currentMiles: round2(currentMiles),
    optimizedMiles: round2(optimizedMiles),
    milesSaved: round2(milesSaved),
    estimatedFuelSaved: round2(estimatedFuelSaved),
    estimatedTimeSavedMin,
    annualizedSavings: round2(annualizedSavings),
    googleMapsLink,
    improvement,
  };
}

/**
 * Analyze routes for ALL techs on a given day.
 * Groups jobs by techId, runs analysis per tech, returns sorted by savings desc.
 */
export async function analyzeAllRoutes(
  allJobs: FSJob[],
  techStartLocations: Map<string, LatLng>,
  defaultStartLatLng: LatLng,
  apiKey: string,
  cache: GeocodeCache
): Promise<RouteAnalysis[]> {
  // Group by tech
  const byTech = new Map<string, FSJob[]>();
  for (const job of allJobs) {
    const tid = job.techId ?? '__unassigned';
    if (!byTech.has(tid)) byTech.set(tid, []);
    byTech.get(tid)!.push(job);
  }

  const analyses = await Promise.all(
    Array.from(byTech.entries())
      .filter(([tid]) => tid !== '__unassigned')
      .map(([tid, jobs]) => {
        const start = techStartLocations.get(tid) ?? defaultStartLatLng;
        return analyzeRoute(
          jobs.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
          start,
          apiKey,
          cache
        );
      })
  );

  return analyses
    .filter((a): a is RouteAnalysis => a !== null)
    .sort((a, b) => b.milesSaved - a.milesSaved);
}

// ─── Route Summary for Dashboard ─────────────────────────────────────────────

export interface RouteSummary {
  totalMilesCurrentOrder: number;
  totalMilesOptimized: number;
  totalMilesSaved: number;
  totalFuelSaved: number;
  totalTimeSavedMin: number;
  totalAnnualizedSavings: number;
  techCount: number;
  analyses: RouteAnalysis[];
}

export function buildRouteSummary(analyses: RouteAnalysis[]): RouteSummary {
  return {
    totalMilesCurrentOrder: round2(analyses.reduce((s, a) => s + a.currentMiles, 0)),
    totalMilesOptimized: round2(analyses.reduce((s, a) => s + a.optimizedMiles, 0)),
    totalMilesSaved: round2(analyses.reduce((s, a) => s + a.milesSaved, 0)),
    totalFuelSaved: round2(analyses.reduce((s, a) => s + a.estimatedFuelSaved, 0)),
    totalTimeSavedMin: analyses.reduce((s, a) => s + a.estimatedTimeSavedMin, 0),
    totalAnnualizedSavings: round2(analyses.reduce((s, a) => s + a.annualizedSavings, 0)),
    techCount: analyses.length,
    analyses,
  };
}

// ─── Haversine Fallback ───────────────────────────────────────────────────────

/**
 * Straight-line distance in miles (fallback when Google API fails).
 * Less accurate than driving distance but good enough for fallback.
 */
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/[^\w\s,]/g, '').replace(/\s+/g, ' ').trim();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Extract a submatrix for a subset of indices.
 * Used to run TSP on jobs only (depot excluded from circular tour).
 */
function buildSubMatrix(full: number[][], indices: number[]): number[][] {
  return indices.map((i) => indices.map((j) => full[i][j]));
}

// ─── Google API Response Types ────────────────────────────────────────────────

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    geometry: {
      location: { lat: number; lng: number };
      location_type: string;
    };
    formatted_address: string;
  }>;
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }>;
  }>;
}
