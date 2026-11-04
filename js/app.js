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

        if (this.state.debt > 0) {
            this.state.debt += this.state.debt * 0.001;
        }

        this.state.days += 0.01;
        this.updateUI();

        if (this.state.hasAutoMachine && this.state.garbage >= 2) {
            this.state.garbage -= 2;
            this.state.chips += 1;
        }

        // 日租金扣除（若没有买断）
        if (this.state.hasShop && !this.state.isOwned) {
            this.state.money -= (this.state.rentCost / 100); // 摊平为秒级扣除
        }

        // 股票波动
        this.state.stocks.forEach(s => {
            let changePercent = (Math.random() - 0.48) * 3.0;
            s.price = Math.max(1.0, s.price * (1 + changePercent / 100));
            s.change = changePercent;
        });

        // 3. 高利贷低利息
        if (this.state.debt > 0) {
            this.state.debt += this.state.debt * 0.001;
        }

        this.state.days += 0.01;
        this.updateUI();
    },

    switchTab(tabName) {
        ['shop', 'faction', 'stock', 'legacy'].forEach(t => {
            document.getElementById(`tab-content-${t}`).classList.add('hidden');
            document.getElementById(`tab-content-${t}`).classList.remove('flex');
            document.getElementById(`tab-btn-${t}`).className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-zinc-400 hover:text-white hover:bg-zinc-800";
        });
        document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
        document.getElementById(`tab-content-${tabName}`).classList.add('flex');
        document.getElementById(`tab-btn-${tabName}`).className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-purple-600 text-white shadow";
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

    // 在 Game 对象里增加接待客人与买断逻辑：

// 1. 租用首店
rentFirstShop() {
    if (this.state.money >= CONFIG.FIRST_RENT_COST) {
        this.state.money -= CONFIG.FIRST_RENT_COST;
        this.state.hasShop = true;
        this.log("🎉 恭喜！你成功租下了第 1 层的第一个破旧街角店铺，正式开业！", "gold");
        this.updateUI();
    } else {
        this.log(`资金不足！租下首家店铺需要 ${CONFIG.FIRST_RENT_COST} 算力币。`, "alert");
    }
},

// 2. 接待客人
serveGuest() {
    if (!this.state.hasShop) {
        this.log("你还没有店铺，无法接待客人！请先攒钱租下店铺。", "alert");
        return;
    }
    if (this.state.energy < 8) {
        this.log("体力不足，无法招待客人！", "alert");
        return;
    }

    this.state.energy -= 8;
    // 随机一位客人光临
    const guest = GUEST_TYPES[Math.floor(Math.random() * GUEST_TYPES.length)];
    const amount = Math.floor(Math.random() * (guest.max - guest.min + 1)) + guest.min;
    
    this.state.inventory[guest.rewardType] += amount;
    this.log(`接待了【${guest.name}】(${guest.desc})，获得物资 x${amount}！`, "success");
    this.updateUI();
},

// 3. 买断店铺产权
buyoutShop() {
    const cost = this.state.rentCost * 100; // 例如 20,000 买断
    if (this.state.money >= cost) {
        this.state.money -= cost;
        this.state.isOwned = true;
        this.log("🏢 财大气粗！你直接买断了该店铺的土地产权，从此永久免除租金！", "gold");
        this.updateUI();
    } else {
        this.log(`买断产权需要 ${cost} 算力币！`, "alert");
    }
},

// 4. 购买自动提炼机器
buyAutoMachine() {
    const cost = 15000;
    if (this.state.money >= cost) {
        this.state.money -= cost;
        this.state.hasAutoMachine = true;
        this.log("🤖 成功在店里安装了【自动提炼流水线机器】！每秒会自动为你提炼物资！", "gold");
        this.updateUI();
    } else {
        this.log(`自动化提炼机器售价 ${cost} 算力币！`, "alert");
    }
}
    
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

    sellChips() {
        if (this.state.chips >= 1) {
            this.state.chips -= 1;
            this.state.money += CONFIG.CHIP_SELL_PRICE;
            this.log(`黑市变现 1 个芯片，获得 ${CONFIG.CHIP_SELL_PRICE} 算力币！`, "gold");
            if (this.state.questStep === 3) this.state.questProgress++;
            this.updateUI();
        } else {
            this.log("手中没有合成芯片！", "alert");
        }
    },

    // 体力购买
    buyEnergyGov() {
        if (this.state.money >= 200) {
            this.state.money -= 200;
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + 25);
            this.log("购买政府营养膏，恢复 25 体力。", "success");
            this.updateUI();
        }
    },

    buyEnergyBlackMarket() {
        if (this.state.money >= 900) {
            this.state.money -= 900;
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + 100);
            this.log("注射黑市兴奋剂，体力瞬间回复！", "gold");
            this.updateUI();
        }
    },

    // 势力扫荡
    sweepFaction() {
        let f = this.state.factions[this.state.currentFloor];
        if (this.state.money >= 1000 && f) {
            this.state.money -= 1000;
            f.control = Math.max(0, f.control - 15);
            this.log(`扫荡第 ${this.state.currentFloor} 层势力，掌控度升至 ${100 - f.control}%！`, "success");
            this.updateUI();
        }
    },

    bribeFaction() {
        if (this.state.money >= 500) {
            this.state.money -= 500;
            this.log("已缴纳保护费，平安无事。", "normal");
            this.updateUI();
        }
    },

    // 股票交易
    tradeStock(id, amount) {
        let stock = this.state.stocks.find(s => s.id === id);
        if(!stock) return;
        let cost = stock.price * amount;
        if(amount > 0 && this.state.money >= cost) {
            this.state.money -= cost;
            stock.owned += amount;
            this.log(`买入 ${stock.name} ${amount} 股。`, "normal");
        } else if(amount < 0 && stock.owned >= Math.abs(amount)) {
            let gain = stock.price * Math.abs(amount);
            this.state.money += gain;
            stock.owned -= Math.abs(amount);
            this.log(`卖出 ${stock.name} ${Math.abs(amount)} 股，套现 ${gain.toFixed(1)}！`, "success");
        }
        this.updateUI();
    },

    buyLegacyTech(type) {
        if (this.state.legacyPoints >= 100) {
            this.state.legacyPoints -= 100;
            this.state.techs.scavenge++;
            this.log("成功解锁纳米回收科技！", "gold");
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
        document.getElementById('stat-energy').innerText = `${this.state.energy.toFixed(1)} / ${CONFIG.MAX_ENERGY}`;
        document.getElementById('stat-debt').innerText = Math.floor(this.state.debt).toLocaleString();
        document.getElementById('stat-floor').innerText = this.state.currentFloor;
        document.getElementById('current-floor-num').innerText = this.state.currentFloor;

        document.getElementById('player-money').innerText = Math.floor(this.state.money).toLocaleString();
        
        // 店铺面板显隐
        if (this.state.hasShop) {
            document.getElementById('no-shop-panel').classList.add('hidden');
            document.getElementById('has-shop-panel').classList.remove('hidden');
            document.getElementById('has-shop-panel').classList.add('flex');
            
            if (this.state.isOwned) {
                document.getElementById('shop-ownership').innerText = "产权已买断 (免租)";
                document.getElementById('shop-ownership').className = "text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono";
                document.getElementById('buyout-btn').classList.add('hidden');
            }
            if (this.state.hasAutoMachine) {
                document.getElementById('auto-machine-btn').innerText = "🤖 自动提炼流水线 (已安装)";
                document.getElementById('auto-machine-btn').disabled = true;
            }
        } else {
            document.getElementById('no-shop-panel').classList.remove('hidden');
            document.getElementById('has-shop-panel').classList.add('hidden');
        }

        document.getElementById('res-garbage').innerText = this.state.garbage;
        document.getElementById('res-military').innerText = this.state.militaryParts;
        document.getElementById('res-data').innerText = this.state.dataChips;
        document.getElementById('res-chips').innerText = this.state.chips;

        // 渲染势力
        let f = this.state.factions[this.state.currentFloor] || { name: "地方帮派", control: 100 };
        document.getElementById('faction-name').innerText = f.name;
        document.getElementById('faction-control').innerText = `${f.control}%`;
        document.getElementById('faction-bar').style.width = `${f.control}%`;

        // 渲染股票
        let stockHtml = '';
        this.state.stocks.forEach(s => {
            let color = s.change >= 0 ? 'text-emerald-400' : 'text-rose-400';
            stockHtml += `
                <div class="bg-[#09090d] border border-zinc-800 rounded-lg p-3 flex flex-col justify-between gap-2 font-mono text-xs">
                    <div class="flex justify-between">
                        <span class="font-bold text-zinc-200">${s.name}</span>
                        <span class="${color}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>现价: ${s.price.toFixed(1)}</span>
                        <span>持有: ${s.owned}股</span>
                    </div>
                    <div class="grid grid-cols-2 gap-1 pt-1">
                        <button onclick="Game.tradeStock('${s.id}', 10)" class="bg-emerald-950 border border-emerald-800 text-emerald-300 py-1 rounded">买 10股</button>
                        <button onclick="Game.tradeStock('${s.id}', -10)" class="bg-rose-950 border border-rose-800 text-rose-300 py-1 rounded">卖 10股</button>
                    </div>
                </div>
            `;
        });
        document.getElementById('stock-market-container').innerHTML = stockHtml;

        document.getElementById('legacy-points').innerText = `${this.state.legacyPoints} 点`;
    }
};

// 页面加载完成后启动
window.onload = () => Game.init();
