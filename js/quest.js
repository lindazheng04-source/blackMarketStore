const QuestManager = {
    checkProgress() {
        const descEl = document.getElementById('quest-desc');
        const barEl = document.getElementById('quest-bar');
        const progText = document.getElementById('quest-progress-text');
        
        // 如果 DOM 還沒加載完成，直接返回避免報錯
        if (!descEl || !barEl || !progText) return;
        
        // 確保 Game.state 已經初始化
        if (typeof Game === 'undefined' || !Game.state) return;
        const state = Game.state;

        if (state.questStep === 1) {
            progText.innerText = "步驟 1/3";
            descEl.innerText = `目標: 消耗體力點擊【手柄搜尋】，收集垃圾 (${state.questProgress || 0}/5)`;
            barEl.style.width = `${Math.min(100, ((state.questProgress || 0) / 5) * 100)}%`;
            if ((state.questProgress || 0) >= 5) {
                state.questStep = 2;
                state.questProgress = 0;
                state.money = (state.money || 0) + 2000;
                Game.log("🎁 完成新手任務 1！獲得政府創業補貼 2,000 算力幣！", "gold");
            }
        } else if (state.questStep === 2) {
            progText.innerText = "步驟 2/3";
            descEl.innerText = `目標: 積累 10 垃圾後，點擊【提煉芯片】 1 次 (${state.questProgress || 0}/1)`;
            barEl.style.width = `${Math.min(100, ((state.questProgress || 0) / 1) * 100)}%`;
            if ((state.questProgress || 0) >= 1) {
                state.questStep = 3;
                state.questProgress = 0;
                state.money = (state.money || 0) + 3000;
                Game.log("🎁 完成新手任務 2！獲得黑市技術贊助 3,000 算力幣！", "gold");
            }
        } else if (state.questStep === 3) {
            progText.innerText = "步驟 3/3";
            descEl.innerText = `目標: 在黑市變現 1 次高純芯片 (${state.questProgress || 0}/1)`;
            barEl.style.width = `${Math.min(100, ((state.questProgress || 0) / 1) * 100)}%`;
            if ((state.questProgress || 0) >= 1) {
                state.questStep = 4;
                progText.innerText = "已完成引導";
                descEl.innerText = `🎉 恭喜！你已掌握廢土經商之道，向百层大廈進發吧！`;
                barEl.style.width = `100%`;
                Game.log("🎉 恭喜通關新手引導任務！", "gold");
            }
        } else {
            progText.innerText = "自由經商";
            descEl.innerText = `🎉 自由發展中，向更高層數擴張！`;
            barEl.style.width = `100%`;
        }
    }
};
