import asyncio
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

UPSTREAM = os.getenv('UPSTREAM_URL', 'http://127.0.0.1:8000').rstrip('/')
MAX_INFLIGHT = int(os.getenv('MAX_INFLIGHT', '4'))
QUEUE_TIMEOUT = float(os.getenv('QUEUE_TIMEOUT', '0.5'))
UPSTREAM_TIMEOUT = float(os.getenv('UPSTREAM_TIMEOUT', '120'))

semaphore = asyncio.Semaphore(MAX_INFLIGHT)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(timeout=httpx.Timeout(UPSTREAM_TIMEOUT, connect=5.0))
    yield
    await app.state.http.aclose()

app = FastAPI(lifespan=lifespan)

@app.get('/healthz')
async def healthz():
    return {'status': 'ok'}

@app.post('/v1/chat/completions')
async def chat(request: Request):
    try:
        body = await request.json()
    except ValueError:
        return JSONResponse({'error': 'Invalid JSON'}, status_code=400)
    if not isinstance(body, dict):
        return JSONResponse({'error': 'Expected JSON object'}, status_code=400)

    try:
        await asyncio.wait_for(semaphore.acquire(), timeout=QUEUE_TIMEOUT)
    except asyncio.TimeoutError:
        return JSONResponse({'error': 'Gateway overloaded'}, status_code=503)

    streaming = body.get('stream') is True
    handed_off = False
    headers = {'content-type': 'application/json'}
    try:
        if streaming:
            upstream_req = app.state.http.build_request('POST', f'{UPSTREAM}/v1/chat/completions', json=body, headers=headers)
            upstream_resp = await app.state.http.send(upstream_req, stream=True)
            if upstream_resp.status_code >= 400:
                payload = await upstream_resp.aread()
                await upstream_resp.aclose()
                return JSONResponse({'error': payload.decode(errors='replace')}, status_code=upstream_resp.status_code)

            async def chunks():
                try:
                    async for chunk in upstream_resp.aiter_bytes():
                        if await request.is_disconnected():
                            break
                        yield chunk
                finally:
                    await upstream_resp.aclose()
                    semaphore.release()
            response = StreamingResponse(chunks(), media_type='text/event-stream', headers={'Cache-Control': 'no-cache'})
            handed_off = True
            return response

        upstream_resp = await app.state.http.post(f'{UPSTREAM}/v1/chat/completions', json=body, headers=headers)
        return JSONResponse(upstream_resp.json(), status_code=upstream_resp.status_code)
    except httpx.TimeoutException:
        return JSONResponse({'error': 'Upstream timeout'}, status_code=504)
    except httpx.RequestError:
        return JSONResponse({'error': 'Upstream unavailable'}, status_code=502)
    finally:
        if not handed_off:
            semaphore.release()
