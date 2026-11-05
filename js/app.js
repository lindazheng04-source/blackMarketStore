const Game = {
    state: {},

    init() {
        const savedData = StorageManager.loadGame();
        this.state = savedData ? Object.assign({}, defaultGameState, savedData) : Object.assign({}, defaultGameState);

        setInterval(() => this.tick(), 1000);
        setInterval(() => StorageManager.saveGame(), CONFIG.AUTO_SAVE_INTERVAL);

        this.log("系統已載入。廢土帝國商業引導已啟動。", "gold");
        this.updateUI();
    },

    tick() {
        if (this.state.energy < CONFIG.MAX_ENERGY) {
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + CONFIG.ENERGY_RECOVER_RATE);
        }

        if (this.state.hasAutoMachine && this.state.garbage >= 2) {
            this.state.garbage -= 2;
            this.state.chips += 1;
        }

        if (this.state.hasShop && !this.state.isOwned) {
            this.state.money -= (this.state.rentCost / 100); 
        }

        if (this.state.stocks) {
            this.state.stocks.forEach(s => {
                let changePercent = (Math.random() - 0.48) * 3.0;
                s.price = Math.max(1.0, s.price * (1 + changePercent / 100));
                s.change = changePercent;
            });
        }

        this.state.days += 0.01;
        this.updateUI();
    },

    switchTab(tabName) {
        ['shop', 'faction', 'stock', 'legacy'].forEach(t => {
            const content = document.getElementById(`tab-content-${t}`);
            const btn = document.getElementById(`tab-btn-${t}`);
            if (content) {
                content.classList.add('hidden');
                content.classList.remove('flex');
            }
            if (btn) {
                btn.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-zinc-400 hover:text-white hover:bg-zinc-800";
            }
        });
        const targetContent = document.getElementById(`tab-content-${tabName}`);
        const targetBtn = document.getElementById(`tab-btn-${tabName}`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            targetContent.classList.add('flex');
        }
        if (targetBtn) {
            targetBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-purple-600 text-white shadow";
        }
    },

    manualScavenge() {
        if (this.state.energy < 5) {
            this.log("體力不足！請前往左側購買營養膏或黑市興奮劑。", "alert");
            return;
        }
        this.state.energy -= 5;
        this.state.garbage += 1;
        this.log("深入廢墟搜尋垃圾 (+1)，消耗 5 體力。", "normal");
        if (this.state.questStep === 1) {
            this.state.questProgress = (this.state.questProgress || 0) + 1;
        }
        this.updateUI();
    },

    manualProcess() {
        if (this.state.energy < 10) {
            this.log("體力不足！", "alert");
            return;
        }
        if (this.state.garbage < 10) {
            this.log("垃圾不足 (需 10 單位)。", "alert");
            return;
        }
        this.state.energy -= 10;
        this.state.garbage -= 10;
        this.state.chips += 1;
        this.log("成功提煉出 1 個【高純度合成芯片】！", "success");
        if (this.state.questStep === 2) {
            this.state.questProgress = (this.state.questProgress || 0) + 1;
        }
        this.updateUI();
    },

    rentFirstShop() {
        if (this.state.money >= CONFIG.FIRST_RENT_COST) {
            this.state.money -= CONFIG.FIRST_RENT_COST;
            this.state.hasShop = true;
            this.log("🎉 成功租下第 1 層的破舊店鋪，正式開業！", "gold");
            this.updateUI();
        } else {
            this.log(`資金不足！租下首店需要 ${CONFIG.FIRST_RENT_COST.toLocaleString()} 算力幣。`, "alert");
        }
    },

    serveGuest() {
        if (this.state.energy < 8) {
            this.log("體力不足以招待客人！", "alert");
            return;
        }
        this.state.energy -= 8;
        const guest = GUEST_TYPES[Math.floor(Math.random() * GUEST_TYPES.length)];
        const amount = Math.floor(Math.random() * (guest.max - guest.min + 1)) + guest.min;
        this.state[guest.rewardType] = (this.state[guest.rewardType] || 0) + amount;
        this.log(`接待【${guest.name}】(${guest.desc})，獲得物资 x${amount}！`, "success");
        this.updateUI();
    },

    buyAutoMachine() {
        const cost = 15000;
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.hasAutoMachine = true;
            this.log("🤖 成功在店裡安裝【自動提煉流水線】！每秒自動消耗垃圾產出芯片！", "gold");
            this.updateUI();
        } else {
            this.log(`自動化提煉機器售價 ${cost.toLocaleString()} 算力幣！`, "alert");
        }
    },

    buyoutShop() {
        const cost = 20000;
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.isOwned = true;
            this.log("🏢 買斷店鋪產權，從此永久免除租金！", "gold");
            this.updateUI();
        } else {
            this.log(`買斷產權需要 ${cost.toLocaleString()} 算力幣！`, "alert");
        }
    },

    sellChips() {
        if (this.state.chips >= 1) {
            this.state.chips -= 1;
            this.state.money += CONFIG.CHIP_SELL_PRICE;
            this.log(`黑市變現 1 個芯片，獲得 ${CONFIG.CHIP_SELL_PRICE.toLocaleString()} 算力幣！`, "gold");
            if (this.state.questStep === 3) {
                this.state.questProgress = (this.state.questProgress || 0) + 1;
            }
            this.updateUI();
        } else {
            this.log("手中沒有合成芯片可出售！", "alert");
        }
    },

    buyEnergyGov() {
        if (this.state.money >= 200) {
            this.state.money -= 200;
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + 25);
            this.log("購買政府營養膏，恢復 25 體力。", "success");
            this.updateUI();
        } else {
            this.log("資金不足 (需要 200 算力)！", "alert");
        }
    },

    buyEnergyBlackMarket() {
        if (this.state.money >= 900) {
            this.state.money -= 900;
            this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + 100);
            this.log("注射黑市興奮劑，體力瞬間回滿！", "gold");
            this.updateUI();
        } else {
            this.log("資金不足 (需要 900 算力)！", "alert");
        }
    },

    sweepFaction() {
        if (!this.state.factions || !this.state.factions[this.state.currentFloor]) return;
        let f = this.state.factions[this.state.currentFloor];
        if (this.state.money >= 1000) {
            this.state.money -= 1000;
            f.control = Math.max(0, f.control - 15);
            this.log(`掃蕩第 ${this.state.currentFloor} 層勢力，掌控度下降至 ${f.control}%！`, "success");
            this.updateUI();
        } else {
            this.log("資金不足 (需要 1,000 算力)！", "alert");
        }
    },

    bribeFaction() {
        if (this.state.money >= 500) {
            this.state.money -= 500;
            this.log("已繳納保護費，平安無事。", "normal");
            this.updateUI();
        } else {
            this.log("資金不足 (需要 500 算力)！", "alert");
        }
    },

    tradeStock(id, amount) {
        if (!this.state.stocks) return;
        let stock = this.state.stocks.find(s => s.id === id);
        if(!stock) return;
        let cost = stock.price * amount;
        if(amount > 0 && this.state.money >= cost) {
            this.state.money -= cost;
            stock.owned += amount;
            this.log(`買入 ${stock.name} ${amount} 股。`, "normal");
        } else if(amount < 0 && stock.owned >= Math.abs(amount)) {
            let gain = stock.price * Math.abs(amount);
            this.state.money += gain;
            stock.owned -= Math.abs(amount);
            this.log(`賣出 ${stock.name} ${Math.abs(amount)} 股，套現 ${gain.toFixed(1)}！`, "success");
        }
        this.updateUI();
    },

    buyLegacyTech(type) {
        if (this.state.legacyPoints >= 100) {
            this.state.legacyPoints -= 100;
            if (!this.state.techs) this.state.techs = {};
            this.state.techs.scavenge = (this.state.techs.scavenge || 0) + 1;
            this.log("成功解鎖納米回收科技！", "gold");
            this.updateUI();
        } else {
            this.log("遺產聲望點數不足 (需要 100 點)！", "alert");
        }
    },

    openNextFloor() {
        let next = (this.state.currentFloor || 1) + 1;
        let cost = next * 10000;
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.currentFloor = next;
            if (!this.state.factions[next]) {
                this.state.factions[next] = { name: `第 ${next} 層財團衛隊`, control: 100 };
            }
            this.log(`🚀 進駐第 ${next} 層！`, "gold");
            this.updateUI();
        } else {
            this.log(`進駐下一層需要資金 ${cost.toLocaleString()} 算力幣！`, "alert");
        }
    },

    log(text, type = 'normal') {
        const consoleBox = document.getElementById('mud-console');
        if (!consoleBox) return;
        const div = document.createElement('div');
        div.className = type === 'alert' ? 'text-rose-400 font-bold' : (type === 'success' ? 'text-emerald-400' : (type === 'gold' ? 'text-amber-400 font-bold' : 'text-zinc-300'));
        div.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
        consoleBox.appendChild(div);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    },

    updateUI() {
        // 安全呼叫新手任務檢查
        if (typeof QuestManager !== 'undefined' && QuestManager.checkProgress) {
            QuestManager.checkProgress();
        }

        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        safeSetText('stat-days', Math.floor(this.state.days || 1));
        safeSetText('stat-energy', `${(this.state.energy || 0).toFixed(1)} / ${CONFIG.MAX_ENERGY}`);
        safeSetText('stat-debt', Math.floor(this.state.debt || 0).toLocaleString());
        safeSetText('stat-floor', this.state.currentFloor || 1);
        safeSetText('current-floor-num', this.state.currentFloor || 1);
        safeSetText('player-money', Math.floor(this.state.money || 0).toLocaleString());

        // 店鋪面板顯隱與控制
        const noShopPanel = document.getElementById('no-shop-panel');
        const hasShopPanel = document.getElementById('has-shop-panel');
        if (this.state.hasShop) {
            if (noShopPanel) {
                noShopPanel.classList.add('hidden');
                noShopPanel.classList.remove('flex');
            }
            if (hasShopPanel) {
                hasShopPanel.classList.remove('hidden');
                hasShopPanel.classList.add('flex');
            }

            if (this.state.isOwned) {
                safeSetText('shop-ownership', "產權已買斷 (免租)");
                const ownershipEl = document.getElementById('shop-ownership');
                if (ownershipEl) ownershipEl.className = "text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono";
                const buyoutBtn = document.getElementById('buyout-btn');
                if (buyoutBtn) buyoutBtn.classList.add('hidden');
            }
            if (this.state.hasAutoMachine) {
                const autoBtn = document.getElementById('auto-machine-btn');
                if (autoBtn) {
                    autoBtn.innerText = "🤖 自動提煉流水線 (已安裝)";
                    autoBtn.disabled = true;
                }
            }
        } else {
            if (noShopPanel) {
                noShopPanel.classList.remove('hidden');
                noShopPanel.classList.add('flex');
            }
            if (hasShopPanel) {
                hasShopPanel.classList.add('hidden');
                hasShopPanel.classList.remove('flex');
            }
        }

        safeSetText('res-garbage', this.state.garbage || 0);
        safeSetText('res-military', this.state.militaryParts || 0);
        safeSetText('res-data', this.state.dataChips || 0);
        safeSetText('res-chips', this.state.chips || 0);

        // 渲染勢力
        if (this.state.factions && this.state.factions[this.state.currentFloor]) {
            let f = this.state.factions[this.state.currentFloor];
            safeSetText('faction-name', f.name);
            safeSetText('faction-control', `${f.control}%`);
            const bar = document.getElementById('faction-bar');
            if (bar) bar.style.width = `${f.control}%`;
        }

        // 渲染右側樓層圖譜
        const floorListContainer = document.getElementById('floor-list-container');
        if (floorListContainer) {
            let floorListHtml = '';
            for (let i = 1; i <= Math.max(5, (this.state.currentFloor || 1) + 1); i++) {
                let active = i === (this.state.currentFloor || 1);
                floorListHtml += `
                    <div class="flex items-center justify-between p-2 rounded border ${active ? 'bg-purple-950/30 border-purple-500/50 text-purple-300' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'} text-xs font-mono">
                        <span>第 ${i} 層</span>
                        <span class="text-[10px]">${active ? '當前據點' : ''}</span>
                    </div>
                `;
            }
            floorListContainer.innerHTML = floorListHtml;
        }

        // 渲染股票
        const stockContainer = document.getElementById('stock-market-container');
        if (stockContainer && this.state.stocks) {
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
                            <span>現价: ${s.price.toFixed(1)}</span>
                            <span>持有: ${s.owned}股</span>
                        </div>
                        <div class="grid grid-cols-2 gap-1 pt-1">
                            <button onclick="Game.tradeStock('${s.id}', 10)" class="bg-emerald-950 border border-emerald-800 text-emerald-300 py-1 rounded">買 10股</button>
                            <button onclick="Game.tradeStock('${s.id}', -10)" class="bg-rose-950 border border-rose-800 text-rose-300 py-1 rounded">賣 10股</button>
                        </div>
                    </div>
                `;
            });
            stockContainer.innerHTML = stockHtml;
        }

        safeSetText('legacy-points', `${this.state.legacyPoints || 0} 點`);
    }
};

window.onload = () => Game.init();
