const CONFIG = {
    SAVE_KEY: "snored_industry_save_v2",
    AUTO_SAVE_INTERVAL: 5000, // 5秒自动存盘
    MAX_ENERGY: 100,
    ENERGY_RECOVER_RATE: 0.01, // 调整为极慢的自然回复 (100秒恢复1点)
    CHIP_SELL_PRICE: 1500, // 每个芯片黑市卖 1500 算力币
    FIRST_RENT_COST: 2000,     // 租首店需要的资金
    BUYOUT_MULTIPLIER: 10,     // 买断产权需要的资金倍数
};

// 各种客人类型及带来的物品
const GUEST_TYPES = [
    { name: "流浪拾荒者", desc: "带来大量杂质电路板", rewardType: "garbage", min: 3, max: 8 },
    { name: "黑市雇佣兵", desc: "带来受损的军用零件", rewardType: "militaryParts", min: 1, max: 3 },
    { name: "叛逃黑客", desc: "带来加密数据残片", rewardType: "dataChips", min: 2, max: 5 }
];

// 初始默认状态
const defaultGameState = {
    days: 1,
    money: 10,
    debt: 0,
    energy: 100,
    level: 1,
    currentFloor: 1,
   // 仓库物资
    inventory: {
        garbage: 0,
        militaryParts: 0,
        dataChips: 0,
        processedChips: 0 // 提炼后的高价值商品
    },
    // 当前楼层店铺状态
    hasShop: false,         // 一开始没有店！
    isOwned: false,         // 是否买断产权
    rentCost: 200,          // 日租金
    maxGuests: 1,           // 同时接待客人上限
    hasAutoMachine: false,  // 是否拥有自动提炼机器
    questStep: 1,
    questProgress: 0
    factions: {
        1: { name: "血齿帮", control: 85 }
    },
    // 股票数据
    stocks: [
        { id: 'snored', name: 'Snored Corp 大厂', price: 120.5, change: 2.1, owned: 0 },
        { id: 'aether', name: '以太生物科技', price: 45.0, change: -1.2, owned: 0 },
        { id: 'cyber', name: '新霓虹算力枢纽', price: 210.0, change: 5.4, owned: 0 }
    ],
    techs: { scavenge: 0 }
};
