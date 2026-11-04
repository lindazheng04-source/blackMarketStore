const Game = {
    state: {},

    init() {
        // 读取存档，若无存档则用默认数据
        const savedData = StorageManager.loadGame();
        this.state = savedData ? Object.assign({}, defaultGameState, savedData) : Object.assign({}, defaultGameState);

        // 启动核心循环
        setInterval(() => this.tick(), 1000);
        // 自动存档循环
        setInterval(() => StorageManager.saveGame(), CONFIG.AUTO_SAVE_INTERVAL);

        this.log("欢迎回到《Snored Industry Online》。系统已载入本地自动存档！", "gold");
        this.updateUI();
    },

    tick() {
        // 1. 体力自动恢复
        if (this.state.energy < CONFIG.MAX_ENERGY) {
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + CONFIG.ENERGY_RECOVER_RATE);
        }

        // 2. 挂机店铺收益计算
        let totalIncome = 0;
        let totalUpkeep = 0;
        for (let f in this.state.shops) {
            let shop = this.state.shops[f];
            totalIncome += shop.output;
            totalUpkeep += shop.upkeep;
        }

        let netIncome = totalIncome - totalUpkeep;
        this.state.money += netIncome; // 正收益增长

        // 3. 高利贷低利息
        if (this.state.debt > 0) {
            this.state.debt += this.state.debt * 0.001;
        }

        this.state.days += 0.01;
        this.updateUI();
    },

    manualScavenge() {
        if (this.state.energy < 5) {
            this.log("体力不足！请等待体力自动恢复。", "alert");
            return;
        }
        this.state.energy -= 5;
        this.state.garbage += 1;
        this.log("你深入废墟搜寻，获得废土垃圾 (+1)，消耗 5 体力。", "normal");
        if (this.state.questStep === 1) this.state.questProgress++;
        this.updateUI();
    },

    manualProcess() {
        if (this.state.energy < 10) {
            this.log("体力不足！需要 10 体力。", "alert");
            return;
        }
        if (this.state.garbage < 10) {
            this.log(`垃圾不足，提炼芯片需要 10 垃圾 (当前 ${this.state.garbage})。`, "alert");
            return;
        }
        this.state.energy -= 10;
        this.state.garbage -= 10;
        this.state.chips += 1;
        this.log("成功消耗 10 垃圾提炼出 1 个【合成芯片】！", "success");
        if (this.state.questStep === 2) this.state.questProgress++;
        this.updateUI();
    },

    sellChips() {
        if (this.state.chips >= 1) {
            this.state.chips -= 1;
            this.state.money += CONFIG.CHIP_SELL_PRICE;
            this.log(`在黑市卖出 1 个【合成芯片】，变现 ${CONFIG.CHIP_SELL_PRICE} 算力币！`, "gold");
            this.updateUI();
        } else {
            this.log("手中没有合成芯片可出售！", "alert");
        }
    },

    upgradeShop() {
        let shop = this.state.shops[this.state.currentFloor];
        if (!shop) return;
        if (this.state.money >= shop.upgradeCostMoney && this.state.chips >= shop.upgradeCostChips) {
            this.state.money -= shop.upgradeCostMoney;
            this.state.chips -= shop.upgradeCostChips;
            shop.level++;
            shop.output = Math.floor(shop.output * 1.6);
            shop.upkeep = Math.floor(shop.upkeep * 1.2);
            shop.upgradeCostMoney = Math.floor(shop.upgradeCostMoney * 2.2);
            shop.upgradeCostChips += 1;
            this.log(`第 ${this.state.currentFloor} 层店铺升至 Lv.${shop.level}！效率大幅提升。`, "gold");
            if (this.state.questStep === 3) this.state.questProgress++;
            this.updateUI();
        } else {
            this.log(`升级条件不足！需要 ${shop.upgradeCostMoney} 算力币 和 ${shop.upgradeCostChips} 个芯片。`, "alert");
        }
    },

    takeLoan(amount) {
        this.state.money += amount;
        this.state.debt += amount;
        this.log(`借入黑市资金 ${amount} 算力币。`, "alert");
        this.updateUI();
    },

    repayLoan(amount) {
        let pay = Math.min(amount, this.state.money, this.state.debt);
        if (pay > 0) {
            this.state.money -= pay;
            this.state.debt -= pay;
            this.log(`成功偿还借贷 ${pay} 算力币。`, "success");
            this.updateUI();
        }
    },

    openNextFloor() {
        let next = this.state.currentFloor + 1;
        let cost = next * 10000;
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.currentFloor = next;
            if (!this.state.shops[next]) {
                this.state.shops[next] = {
                    name: `第 ${next} 层高级加工厂`,
                    level: 1,
                    upkeep: next * 30,
                    output: next * 60,
                    upgradeCostMoney: next * 8000,
                    upgradeCostChips: 5
                };
            }
            this.log(`🚀 成功进驻第 ${next} 层！`, "gold");
            this.updateUI();
        } else {
            this.log(`开拓第 ${next} 层需要资金 ${cost} 算力币！`, "alert");
        }
    },

    log(text, type = 'normal') {
        const consoleBox = document.getElementById('mud-console');
        if (!consoleBox) return;
        const div = document.createElement('div');
        let colorClass = "text-zinc-300";
        if(type === 'alert') colorClass = "text-rose-400 font-bold";
        if(type === 'success') colorClass = "text-emerald-400";
        if(type === 'gold') colorClass = "text-amber-400 font-bold";
        div.className = colorClass;
        div.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
        consoleBox.appendChild(div);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    },

    updateUI() {
        QuestManager.checkProgress();

        document.getElementById('stat-days').innerText = Math.floor(this.state.days);
        document.getElementById('stat-energy').innerText = `${this.state.energy} / ${CONFIG.MAX_ENERGY}`;
        document.getElementById('stat-debt').innerText = Math.floor(this.state.debt).toLocaleString();
        document.getElementById('stat-floor').innerText = this.state.currentFloor;
        document.getElementById('current-floor-num').innerText = this.state.currentFloor;

        document.getElementById('player-level').innerText = this.state.level;
        document.getElementById('player-money').innerText = Math.floor(this.state.money).toLocaleString();
        
        let totalIncome = 0;
        let totalUpkeep = 0;
        for (let f in this.state.shops) {
            totalIncome += this.state.shops[f].output;
            totalUpkeep += this.state.shops[f].upkeep;
        }
        let net = totalIncome - totalUpkeep;
        document.getElementById('player-income').innerText = `${net >= 0 ? '+' : ''}${net.toFixed(1)} /s`;

        document.getElementById('res-garbage').innerText = this.state.garbage;
        document.getElementById('res-chips').innerText = this.state.chips;

        let shop = this.state.shops[this.state.currentFloor] || { name: "基础工坊", level: 1, upkeep: 10, output: 30, upgradeCostMoney: 2500, upgradeCostChips: 2 };
        document.getElementById('shop-name').innerText = shop.name;
        document.getElementById('shop-level').innerText = shop.level;
        document.getElementById('shop-upkeep').innerText = `${shop.upkeep} /s`;
        document.getElementById('shop-output').innerText = `+${shop.output} /s`;
        document.getElementById('shop-upgrade-cost').innerText = shop.upgradeCostMoney.toLocaleString();
        document.getElementById('shop-upgrade-chips').innerText = shop.upgradeCostChips;

        let floorListHtml = '';
        for (let i = 1; i <= Math.max(5, this.state.currentFloor + 1); i++) {
            let active = i === this.state.currentFloor;
            floorListHtml += `
                <div class="flex items-center justify-between p-2 rounded border ${active ? 'bg-purple-950/30 border-purple-500/50 text-purple-300' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'} text-xs font-mono">
                    <span>第 ${i} 层</span>
                    <span class="text-[10px]">${active ? '当前据点' : ''}</span>
                </div>
            `;
        }
        document.getElementById('floor-list-container').innerHTML = floorListHtml;
    }
};

// 页面加载完成后启动
window.onload = () => Game.init();
