const CONFIG = {
    SAVE_KEY: "snored_industry_save_v2",
    AUTO_SAVE_INTERVAL: 5000, // 5秒自动存盘
    MAX_ENERGY: 100,
    ENERGY_RECOVER_RATE: 2, // 每秒恢复 2 体力
    CHIP_SELL_PRICE: 1500, // 每个芯片黑市卖 1500 算力币
};

// 初始默认状态
const defaultGameState = {
    days: 1,
    money: 5000,
    debt: 0,
    energy: 100,
    level: 1,
    currentFloor: 1,
    garbage: 0,
    chips: 0,
    questStep: 1,
    questProgress: 0,
    shops: {
        1: { name: "垃圾分拣站", level: 1, upkeep: 10, output: 30, upgradeCostMoney: 2500, upgradeCostChips: 2 }
    }
};
