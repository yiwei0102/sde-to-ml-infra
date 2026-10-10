
import argparse
import time
from openai import OpenAI


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000/v1",
    )
    parser.add_argument(
        "--model",
        default="Qwen/Qwen2.5-0.5B-Instruct",
    )
    parser.add_argument(
        "--prompt",
        default="Explain KV cache in two sentences.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=128,
    )
    args = parser.parse_args()

    client = OpenAI(
        base_url=args.base_url,
        api_key="EMPTY",
        timeout=120.0,
    )

    start = time.perf_counter()

    stream = client.chat.completions.create(
        model=args.model,
        messages=[
            {"role": "user", "content": args.prompt}
        ],
        max_tokens=args.max_tokens,
        temperature=0,
        stream=True,
        stream_options={"include_usage": True},
    )

    first_content_time = None
    generated_text = []
    usage = None

    for chunk in stream:
        if chunk.usage is not None:
            usage = chunk.usage

        if not chunk.choices:
            continue

        content = chunk.choices[0].delta.content

        if content:
            if first_content_time is None:
                first_content_time = time.perf_counter()

            print(content, end="", flush=True)
            generated_text.append(content)

    end = time.perf_counter()

    print("\n\n--- Metrics ---")

    if first_content_time is not None:
        ttft = (first_content_time - start) * 1000
        print(f"Client-observed first content: {ttft:.2f} ms")

    total_seconds = end - start
    print(f"Total request time: {total_seconds:.3f} s")

    if usage and usage.completion_tokens:
        print(f"Output tokens: {usage.completion_tokens}")
        print(
            "Average output tokens/sec: "
            f"{usage.completion_tokens / total_seconds:.2f}"
        )
    else:
        print("Token usage unavailable from server.")


if __name__ == "__main__":
    main()
