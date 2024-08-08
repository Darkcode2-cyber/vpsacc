import requests
import time
import json
import random

# Đọc token từ file
def read_tokens_from_file(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file]

# Gửi request đến API
def send_request(token, url, payload):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'sec-ch-ua': '"Chromium";v="124", "Android WebView";v="124", "Not-A.Brand";v="99"',
        'accept': 'application/json, text/plain, */*',
        'sec-ch-ua-mobile': '?1',
        'user-agent': 'Android',
        'origin': 'https://dapp.pokequest.io',
        'x-requested-with': 'org.telegram.messenger',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'referer': 'https://dapp.pokequest.io/',
        'priority': 'u=1, i'
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()

# In thông tin response
def print_response_info(token_index, response):
    available_taps = response['data']['available_taps']
    level = response['data']['level']
    balance = sum(coin['balance'] for coin in response['data']['balance_coins'])
    print(f"✪TOKEN {token_index + 1}✪ 👉 Tap còn lại: {available_taps} | 🏅Cấp độ hiện tại: {level} | 💰Số gold:{balance}")
    
def main():
    token_file = 'tokens.txt'
    url = 'https://api.pokey.quest/tap/tap'
    tokens = read_tokens_from_file(token_file)
    
    min_sleep = int(input("Enter the minimum sleep time in seconds: "))
    max_sleep = int(input("Enter the maximum sleep time in seconds: "))
    
    while True:
        all_tokens_exhausted = True
        
        for token_index, token in enumerate(tokens):
            while True:
                payload = {"count": random.randint(6, 30)}
                response = send_request(token, url, payload)
                print_response_info(token_index, response)
                
                if response.get('data', {}).get('available_taps', 0) == 0:
                    break
                
                sleep_time = random.uniform(min_sleep, max_sleep)
                print(f"Sleeping for {round(sleep_time, 2)} seconds before sending the next request...")
                time.sleep(sleep_time)
                
            token_sleep_time = random.uniform(0.5, 2)
            time.sleep(token_sleep_time)
        
        if all_tokens_exhausted:
            time_cycle = random.randint(900, 1200)
            print(f"=======================Tất cả các tap đã hết. Đợi {time_cycle} giây trước khi chạy tiếp...===================")
            time.sleep(time_cycle)

if __name__ == "__main__":
    main()
