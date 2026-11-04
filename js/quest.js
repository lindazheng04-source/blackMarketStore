const QuestManager = {
    checkProgress() {
        const descEl = document.getElementById('quest-desc');
        const barEl = document.getElementById('quest-bar');
        const progText = document.getElementById('quest-progress-text');
        const state = Game.state;

        if (state.questStep === 1) {
            progText.innerText = "步骤 1/3";
            descEl.innerText = `目标: 消耗体力点击【手柄搜寻】，收集垃圾 (${state.questProgress}/5)`;
            barEl.style.width = `${(state.questProgress / 5) * 100}%`;
            if (state.questProgress >= 5) {
                state.questStep = 2;
                state.questProgress = 0;
                state.money += 2000;
                Game.log("🎁 完成新手任务 1！获得补贴 2,000 算力币！", "gold");
            }
        } else if (state.questStep === 2) {
            progText.innerText = "步骤 2/3";
            descEl.innerText = `目标: 积累 10 垃圾后，点击【提炼芯片】 1 次 (${state.questProgress}/1)`;
            barEl.style.width = `${(state.questProgress / 1) * 100}%`;
            if (state.questProgress >= 1) {
                state.questStep = 3;
                state.questProgress = 0;
                state.money += 3000;
                Game.log("🎁 完成新手任务 2！获得赞助 3,000 算力币！", "gold");
            }
        } else if (state.questStep === 3) {
            progText.innerText = "步骤 3/3";
            descEl.innerText = `目标: 使用【合成芯片 + 算力币】升级 1 次店铺 (${state.questProgress}/1)`;
            barEl.style.width = `${(state.questProgress / 1) * 100}%`;
            if (state.questProgress >= 1) {
                state.questStep = 4;
                progText.innerText = "已完成全部引导";
                descEl.innerText = `🎉 恭喜！你已掌握废土经商之道，前往下一层扩张吧！`;
                barEl.style.width = `100%`;
                Game.log("🎉 恭喜通关新手引导任务！", "gold");
            }
        }
    }
};
