const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const async = require('async');

// Đọc cấu hình từ file config.json
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

class OKX {
    headers() {
        return {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "App-Type": "web",
            "Content-Type": "application/json",
            "Origin": "https://www.okx.com",
            "Referer": config.referer,
            "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
            "X-Cdn": "https://www.okx.com",
            "X-Locale": "en_US",
            "X-Utc": "7",
            "X-Zkdex-Env": "0"
        };
    }

    async checkProxyIP(proxy) {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent
        });
        if (response.status === 200) {
            return response.data.ip;
        } else {
            throw new Error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
        }
    }

    async postToOKXAPI(extUserId, extUserName, queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/info?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = {
            "extUserId": extUserId,
            "extUserName": extUserName,
            "gameId": 1,
            "linkCode": config.linkCode
        };

        const agent = new HttpsProxyAgent(proxy);
        return axios.post(url, payload, { headers, httpsAgent: agent });
    }

    async assessPrediction(extUserId, predict, queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/assess?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = {
            "extUserId": extUserId,
            "predict": predict,
            "gameId": 1
        };

        const agent = new HttpsProxyAgent(proxy);
        return axios.post(url, payload, { headers, httpsAgent: agent });
    }

    async checkDailyRewards(extUserId, queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/tasks?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.get(url, { headers, httpsAgent: agent });
        const tasks = response.data.data;
        const dailyCheckInTask = tasks.find(task => task.id === 4);
        if (dailyCheckInTask) {
            if (dailyCheckInTask.state === 0) {
                this.log('Bắt đầu checkin...');
                await this.performCheckIn(extUserId, dailyCheckInTask.id, queryId, proxy);
            } else {
                this.log('Hôm nay bạn đã điểm danh rồi!');
            }
        }
    }

    async performCheckIn(extUserId, taskId, queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/task?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = {
            "extUserId": extUserId,
            "id": taskId
        };

        const agent = new HttpsProxyAgent(proxy);
        await axios.post(url, payload, { headers, httpsAgent: agent });
        this.log('Điểm danh hàng ngày thành công!');
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`);
            await this.sleep(1000);
        }
        console.log('');
    }

    async Countdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[*] Chờ ${i} giây để tiếp tục...`);
            await this.sleep(1000);
        }
        console.log('');
    }

    extractUserData(queryId) {
        const urlParams = new URLSearchParams(queryId);
        const user = JSON.parse(decodeURIComponent(urlParams.get('user')));
        return {
            extUserId: user.id,
            extUserName: user.username
        };
    }

    async getBoosts(queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/boosts?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.get(url, { headers, httpsAgent: agent });
        return response.data.data;
    }

    async useBoost(queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/boost?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = { id: 1 };

        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, { headers, httpsAgent: agent });
        if (response.data.code === 0) {
            this.log('Reload Fuel Tank thành công!'.yellow);
            await this.Countdown(5);
        } else {
            this.log(`Lỗi Reload Fuel Tank: ${response.data.msg}`.red);
        }
    }

    async upgradeFuelTank(queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/boost?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = { id: 2 };

        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, { headers, httpsAgent: agent });
        if (response.data.code === 0) {
            this.log('Nâng cấp Fuel Tank thành công!'.yellow);
        } else {
            this.log(`Lỗi nâng cấp Fuel Tank: ${response.data.msg}`.red);
        }
    }

    async upgradeTurbo(queryId, proxy) {
        const url = `https://www.okx.com/priapi/v1/affiliate/game/racer/boost?t=${Date.now()}`;
        const headers = { ...this.headers(), 'X-Telegram-Init-Data': queryId };
        const payload = { id: 3 };

        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, { headers, httpsAgent: agent });
        if (response.data.code === 0) {
            this.log('Nâng cấp Turbo Charger thành công!'.yellow);
        } else {
            this.log(`Lỗi nâng cấp Turbo Charger: ${response.data.msg}`.red);
        }
    }

    async retryAsync(fn, retries = config.maxRetries) {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (error.response && error.response.status === 429) {
                    this.log(`Lỗi: ${error.message}. Quá nhiều yêu cầu. Thử lại sau 30 giây...`);
                    await this.sleep(30000); // Chờ 30 giây khi gặp lỗi 429
                } else if (error.response && error.response.status === 400) {
                    this.log(`Lỗi: ${error.message}. Yêu cầu không hợp lệ. Dừng lại.`);
                    throw lastError; // Dừng lại khi gặp lỗi 400
                } else {
                    this.log(`Lỗi: ${error.message}. Thử lại sau ${config.retryInterval / 1000} giây...`);
                    await this.sleep(config.retryInterval);
                }
            }
        }
        throw lastError;
    }

    async processAccount(queryId, proxy) {
        const { extUserId, extUserName } = this.extractUserData(queryId);
        try {
            const proxyIP = await this.retryAsync(() => this.checkProxyIP(proxy));
            console.log(`========== Tài khoản | ${extUserName} | IP: ${proxyIP} ==========`.blue);
            await this.retryAsync(() => this.checkDailyRewards(extUserId, queryId, proxy));

            let boosts = await this.retryAsync(() => this.getBoosts(queryId, proxy));
            boosts.forEach(boost => {
                this.log(`${boost.context.name.green}: ${boost.curStage}/${boost.totalStage}`);
            });
            let reloadFuelTank = boosts.find(boost => boost.id === 1);
            let fuelTank = boosts.find(boost => boost.id === 2);
            let turbo = boosts.find(boost => boost.id === 3);

            if (fuelTank && config.upgradeFuelTank) {
                const balanceResponse = await this.retryAsync(() => this.postToOKXAPI(extUserId, extUserName, queryId, proxy));
                const balancePoints = balanceResponse.data.data.balancePoints;
                if (fuelTank.curStage < fuelTank.totalStage && balancePoints > fuelTank.pointCost) {
                    await this.retryAsync(() => this.upgradeFuelTank(queryId, proxy));
                    boosts = await this.retryAsync(() => this.getBoosts(queryId, proxy));
                } else {
                    this.log('Không đủ điều kiện nâng cấp Fuel Tank!'.red);
                }
            }

            if (turbo && config.upgradeTurbo) {
                const balanceResponse = await this.retryAsync(() => this.postToOKXAPI(extUserId, extUserName, queryId, proxy));
                const balancePoints = balanceResponse.data.data.balancePoints;
                if (turbo.curStage < turbo.totalStage && balancePoints > turbo.pointCost) {
                    await this.retryAsync(() => this.upgradeTurbo(queryId, proxy));
                    boosts = await this.retryAsync(() => this.getBoosts(queryId, proxy));
                } else {
                    this.log('Không đủ điều kiện nâng cấp Turbo Charger!'.red);
                }
            }

            for (let j = 0; j < 50; j++) {
                const response = await this.retryAsync(() => this.postToOKXAPI(extUserId, extUserName, queryId, proxy));
                const balancePoints = response.data.data.balancePoints;
                this.log(`${'Balance Points:'.green} ${balancePoints}`);

                const predict = 1;
                const assessResponse = await this.retryAsync(() => this.assessPrediction(extUserId, predict, queryId, proxy));
                const assessData = assessResponse.data.data;
                const result = assessData.won ? 'Win'.green : 'Thua'.red;
                const calculatedValue = assessData.basePoint * assessData.multiplier;
                this.log(`Kết quả: ${result} x ${assessData.multiplier}! Balance: ${assessData.balancePoints}, Nhận được: ${calculatedValue}, Giá cũ: ${assessData.prevPrice}, Giá hiện tại: ${assessData.currentPrice}`.magenta);

                if (assessData.numChance <= 0 && reloadFuelTank && reloadFuelTank.curStage < reloadFuelTank.totalStage) {
                    await this.retryAsync(() => this.useBoost(queryId, proxy));
                    boosts = await this.retryAsync(() => this.getBoosts(queryId, proxy));
                    reloadFuelTank = boosts.find(boost => boost.id === 1);
                } else if (assessData.numChance > 0) {
                    await this.Countdown(5);
                    continue;
                } else if (assessData.secondToRefresh > 0) {
                    await this.Countdown(assessData.secondToRefresh + 5);
                } else {
                    break;
                }
            }
        } catch (error) {
            this.log(`${'Lỗi rồi:'.red} ${error.message}`);
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'id.txt');
        const proxyFile = path.join(__dirname, 'proxy.txt');
        const userData = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
        const proxyData = fs.readFileSync(proxyFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            await new Promise((resolve) => {
                async.eachLimit(userData, config.numberOfConcurrentTasks, async (queryId, callback) => {
                    const proxy = proxyData[userData.indexOf(queryId) % proxyData.length];
                    await this.processAccount(queryId, proxy);
                    callback();
                }, resolve);
            });
            await this.waitWithCountdown(60);
        }
    }
}

if (require.main === module) {
    const okx = new OKX();
    okx.main().catch(err => {
        console.error(err.toString().red);
        process.exit(1);
    });
}
