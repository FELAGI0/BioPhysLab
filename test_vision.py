import asyncio
import base64
import httpx

async def test():
    try:
        with open("ecg.png", "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode()
    except FileNotFoundError:
        print("Ошибка: файл ecg.png не найден.")
        return

    # НАСТРОЙКИ ПО СОВЕТУ ПОДДЕРЖКИ
    base_url = "https://tokify.sale/v1"
    api_key = "sk-423221651c41265777c7cc9c199a9386"
    model = "claude-opus-5"  # без точки!

    print(f"=== Отправляем запрос ===")
    print(f"URL: {base_url}/chat/completions")
    print(f"Модель: {model}")
    print(f"Размер картинки (base64): {len(image_b64)} символов")
    print("=========================\n")

    async with httpx.AsyncClient(timeout=90, trust_env=False) as client:
        r = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Что видно на этой ЭКГ? Опиши ритм, ЧСС и основные зубцы."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
                    ]
                }],
                "max_tokens": 2000  # подняли лимит!
            }
        )
        print("Status:", r.status_code)
        print("Body:", r.text[:1500])

asyncio.run(test())