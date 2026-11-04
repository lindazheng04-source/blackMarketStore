const StorageManager = {
    saveGame() {
        try {
            localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(Game.state));
            const statusEl = document.getElementById('save-status');
            if(statusEl) {
                statusEl.innerText = "已存储 " + new Date().toLocaleTimeString();
                setTimeout(() => statusEl.innerText = "自动监控中", 2000);
            }
        } catch(e) {
            console.error("存档失败:", e);
        }
    },

    loadGame() {
        try {
            const data = localStorage.getItem(CONFIG.SAVE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch(e) {
            console.error("读档失败:", e);
        }
        return null;
    },

    exportSave() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Game.state));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `snored_save_${Date.now()}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        Game.log("存档已成功导出文件！", "success");
    }
};
