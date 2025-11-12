export interface Env {
	GEMINI_API_KEY: string;
	FIREBASE_WEB_API_KEY: string;
}

interface ProxyRequestBody {
	prompt?: string;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 2;

const allowedOrigins = new Set([
	'https://wanderly.web.app',
	'https://wanderly.firebaseapp.com',
	'https://wanderly-1f739.web.app',
	'https://wanderly-1f739.firebaseapp.com',
	'http://localhost:5173',
]);

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin') ?? '';
		const method = request.method.toUpperCase();

		if (method === 'OPTIONS') {
			if (origin && !allowedOrigins.has(origin)) {
				return corsResponse(origin, 403, 'Origin not allowed');
			}
			return handleCorsPreflight(request, origin);
		}

		if (method !== 'POST') {
			return corsResponse(origin, 405, 'Method not allowed');
		}

		if (origin && !allowedOrigins.has(origin)) {
			return corsResponse(origin, 403, 'Origin not allowed');
		}

		const authHeader = request.headers.get('Authorization') ?? '';
		if (!authHeader.startsWith('Bearer ')) {
			return corsResponse(origin, 401, 'Missing bearer token');
		}

		const idToken = authHeader.slice('Bearer '.length).trim();
		if (!idToken) {
			return corsResponse(origin, 401, 'Missing bearer token');
		}

		const user = await verifyFirebaseIdToken(idToken, env.FIREBASE_WEB_API_KEY);
		if (!user) {
			return corsResponse(origin, 401, 'Invalid authentication token');
		}

		let body: ProxyRequestBody;
		try {
			body = (await request.json()) as ProxyRequestBody;
		} catch (error) {
			console.error('Invalid request body', error);
			return corsResponse(origin, 400, 'Invalid JSON body');
		}

		const prompt = body?.prompt?.trim();
		if (!prompt) {
			return corsResponse(origin, 400, 'Missing prompt');
		}

		const geminiPayload = {
			contents: [
				{
					role: 'user',
					parts: [{ text: prompt }],
				},
			],
			tools: [{ googleSearch: {} }],
		};

		let geminiResponse: Response | null = null;
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				geminiResponse = await fetch(GEMINI_ENDPOINT, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-goog-api-key': env.GEMINI_API_KEY,
					},
					body: JSON.stringify(geminiPayload),
				});
			} catch (error) {
				console.error('Gemini request failed', error);
				if (attempt === MAX_RETRIES) {
					return corsResponse(origin, 502, 'Upstream service error');
				}
				await waitForBackoff(attempt);
				continue;
			}

			if (!RETRYABLE_STATUS.has(geminiResponse.status) || attempt === MAX_RETRIES) {
				break;
			}
			await waitForBackoff(attempt);
			geminiResponse = null;
		}

		if (!geminiResponse) {
			return corsResponse(origin, 502, 'Gemini service unavailable');
		}

		const resultText = await geminiResponse.text();
		return new Response(resultText, {
			status: geminiResponse.status,
			headers: {
				...corsHeaders(origin),
				'Content-Type': 'application/json',
			},
		});
	},
};

async function verifyFirebaseIdToken(idToken: string, firebaseWebApiKey: string): Promise<{ uid: string } | null> {
	try {
		const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebApiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ idToken }),
		});
		if (!response.ok) {
			console.warn('Failed to verify Firebase ID token', await response.text());
			return null;
		}
		const data = (await response.json()) as {
			users?: Array<{ localId?: string }>;
		};
		const firebaseUser = data.users?.[0];
		if (!firebaseUser?.localId) {
			return null;
		}
		return { uid: firebaseUser.localId };
	} catch (error) {
		console.error('Error verifying Firebase ID token', error);
		return null;
	}
}

function corsHeaders(origin: string, allowedHeaders?: string | null): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': allowedHeaders?.length ? allowedHeaders : 'Content-Type, Authorization',
		Vary: 'Origin',
	};
}

function handleCorsPreflight(request: Request, origin: string): Response {
	const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
	return new Response(null, {
		status: 204,
		headers: {
			...corsHeaders(origin, requestedHeaders),
			'Access-Control-Max-Age': '86400',
		},
	});
}

function corsResponse(origin: string, status: number, body?: string): Response {
	return new Response(body, {
		status,
		headers: corsHeaders(origin),
	});
}

function waitForBackoff(attempt: number): Promise<void> {
	const baseDelayMs = 500;
	const delay = baseDelayMs * 2 ** attempt;
	return new Promise((resolve) => setTimeout(resolve, delay));
}
