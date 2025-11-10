export interface Env {
	GEMINI_API_KEY: string;
}

interface ProxyRequestBody {
	prompt?: string;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

		let geminiResponse: Response;
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
			return corsResponse(origin, 502, 'Upstream service error');
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
