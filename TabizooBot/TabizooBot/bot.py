import os
import sys
import time
import requests
from colorama import *
from datetime import datetime, timezone
import json
import brotli

red = Fore.LIGHTRED_EX
yellow = Fore.LIGHTYELLOW_EX
green = Fore.LIGHTGREEN_EX
black = Fore.LIGHTBLACK_EX
blue = Fore.LIGHTBLUE_EX
white = Fore.LIGHTWHITE_EX
reset = Style.RESET_ALL

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.realpath(__file__))

# Construct the full paths to the files
data_file = os.path.join(script_dir, "data.txt")
config_file = os.path.join(script_dir, "config.json")


class TabiZoo:
    def __init__(self):
        self.line = white + "~" * 50

        self.banner = f"""
        TabiZoo Bot
        t.me/mitomchanel
        
        """

        self.upgrade = (
            json.load(open(config_file, "r")).get("auto-upgrade", "false").lower()
            == "true"
        )

    # Clear the terminal
    def clear_terminal(self):
        # For Windows
        if os.name == "nt":
            _ = os.system("cls")
        # For macOS and Linux
        else:
            _ = os.system("clear")

    def headers(self, data):
        return {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "application/json",
            "Host": "app.tabibot.com",
            "Origin": "https://app.tabibot.com",
            "Pragma": "no-cache",
            "Rawdata": f"{data}",
            "Referer": "https://app.tabibot.com/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126", "Microsoft Edge WebView2";v="126"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
        }

    def user_info(self, data):
        url = f"https://app.tabibot.com/api/user/profile"

        headers = self.headers(data=data)

        response = requests.get(url=url, headers=headers)

        return response

    def mining_info(self, data):
        url = f"https://app.tabibot.com/api/mining/info"

        headers = self.headers(data=data)

        response = requests.get(url=url, headers=headers)

        return response

    def check_in(self, data):
        url = f"https://app.tabibot.com/api/user/check-in"

        headers = self.headers(data=data)

        response = requests.post(url=url, headers=headers)

        return response

    def level_up(self, data):
        url = f"https://app.tabibot.com/api/user/level-up"

        headers = self.headers(data=data)

        response = requests.post(url=url, headers=headers)

        return response

    def claim(self, data):
        url = f"https://app.tabibot.com/api/mining/claim"

        headers = self.headers(data=data)

        response = requests.post(url=url, headers=headers)

        return response

    def log(self, msg):
        now = datetime.now().isoformat(" ").split(".")[0]
        print(f"{black}[{now}]{reset} {msg}{reset}")

    def main(self):
        while True:
            self.clear_terminal()
            print(self.banner)
            data = open(data_file, "r").read().splitlines()
            num_acc = len(data)
            self.log(self.line)
            self.log(f"{green}Numer of account: {white}{num_acc}")
            end_at_list = []
            for no, data in enumerate(data):
                self.log(self.line)
                self.log(f"{green}Account number: {white}{no+1}/{num_acc}")

                # Get info
                try:
                    user_info = self.user_info(data=data).json()
                    user_id = user_info["tgUserId"]
                    balance = user_info["coins"]
                    level = user_info["level"]
                    self.log(f"{green}Account ID: {white}{user_id}")
                    self.log(f"{green}Balance: {white}{balance:,}")
                    self.log(f"{green}Level: {white}{level}")
                except Exception as e:
                    self.log(f"{red}Get user info error!!!")

                # Claim
                try:
                    claim = self.claim(data=data).json()
                    if claim:
                        self.log(f"{green}Claim successful")
                    else:
                        self.log(f"{yellow}Not time to claim yet")
                except Exception as e:
                    self.log(f"{red}Claim error!!!")

                # Check in
                try:
                    check_in = self.check_in(data=data).json()
                    if check_in["hasCheckedIn"]:
                        self.log(f"{yellow}Checked in already")
                except Exception as e:
                    self.log(f"{red}Check in error!!!")

                # Level up
                if self.upgrade:
                    self.log(f"{white}Auto upgrade: {green}ON")
                    try:
                        level_up = self.level_up(data=data).json()
                        current_level = level_up["level"]
                        if current_level > level:
                            self.log(f"{green}Upgrade successful")
                            self.log(f"{green}New level: {white}{current_level}")
                        else:
                            self.log(f"{yellow}Not enough point to upgrade")
                    except Exception as e:
                        self.log(f"{red}Level up error!!!")
                else:
                    self.log(f"{white}Auto upgrade: {red}OFF")

                # Get end time
                try:
                    mining_info = self.mining_info(data=data).json()
                    end_time = mining_info["nextClaimTime"]
                    formatted_end_time = end_time.replace("T", " ").replace("Z", "")
                    self.log(f"{green}End time: {white}{formatted_end_time} (UTC)")
                    end_at_list.append(end_time)
                except Exception as e:
                    self.log(f"{red}Get mining info error!!!")

            print()
            if end_at_list:
                now = datetime.now(timezone.utc).timestamp()
                wait_times = []
                for end_at_str in end_at_list:
                    end_at = datetime.fromisoformat(end_at_str.replace("Z", "+00:00"))
                    if end_at.timestamp() > now:
                        wait_times.append(end_at.timestamp() - now)

                if wait_times:
                    wait_time = min(wait_times)
                else:
                    wait_time = 15 * 60
            else:
                wait_time = 15 * 60

            wait_hours = int(wait_time // 3600)
            wait_minutes = int((wait_time % 3600) // 60)
            wait_seconds = int(wait_time % 60)

            wait_message_parts = []
            if wait_hours > 0:
                wait_message_parts.append(f"{wait_hours} hours")
            if wait_minutes > 0:
                wait_message_parts.append(f"{wait_minutes} minutes")
            if wait_seconds > 0:
                wait_message_parts.append(f"{wait_seconds} seconds")

            wait_message = ", ".join(wait_message_parts)
            self.log(f"Wait for {wait_message}!")
            time.sleep(wait_time)


if __name__ == "__main__":
    try:
        tabi = TabiZoo()
        tabi.main()
    except KeyboardInterrupt:
        sys.exit()
