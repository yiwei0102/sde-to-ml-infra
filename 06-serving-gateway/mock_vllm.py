import asyncio
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/v1/chat/completions")
async def chat_completion(request: dict):
    await asyncio.sleep(1)

    return JSONResponse({
        "id": "chatcmpl-mock",
        "object": "chat.completion",
        "model": request.get("model", "mock-model"),
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Hello from mock vLLM!"
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 5,
            "completion_tokens": 6,
            "total_tokens": 11
        }
    })
