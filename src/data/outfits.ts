import type {
  GuineaPigOutfit,
  LifestyleIndexItem,
  MascotSnackId,
  TempTierId,
  WeatherCondition,
  WeatherSnapshot,
} from '../types/weather';

export interface TempTierMeta {
  id: TempTierId;
  label: string;
  rangeText: string;
  sampleTemp: number;
  accent: string;
}

export const TEMP_TIERS: TempTierMeta[] = [
  { id: 'freezing', label: '极寒冰雪', rangeText: '≤ 0°C', sampleTemp: -6, accent: 'from-cyan-400 to-blue-600' },
  { id: 'cold', label: '寒冷冬意', rangeText: '1°C ~ 9°C', sampleTemp: 5, accent: 'from-sky-400 to-indigo-500' },
  { id: 'cool', label: '微凉春秋', rangeText: '10°C ~ 17°C', sampleTemp: 14, accent: 'from-amber-400 to-orange-500' },
  { id: 'mild', label: '舒适宜人', rangeText: '18°C ~ 24°C', sampleTemp: 21, accent: 'from-emerald-400 to-teal-500' },
  { id: 'warm', label: '暖阳轻夏', rangeText: '25°C ~ 30°C', sampleTemp: 27, accent: 'from-yellow-400 to-amber-500' },
  { id: 'hot', label: '酷热盛夏', rangeText: '≥ 31°C', sampleTemp: 35, accent: 'from-orange-400 to-rose-500' },
];

export function getTempTier(temperature: number): TempTierId {
  if (temperature <= 0) return 'freezing';
  if (temperature <= 9) return 'cold';
  if (temperature <= 17) return 'cool';
  if (temperature <= 24) return 'mild';
  if (temperature <= 30) return 'warm';
  return 'hot';
}

function isRainyCondition(condition: WeatherCondition): boolean {
  return (
    condition === 'drizzle' ||
    condition === 'rain' ||
    condition === 'heavy-rain' ||
    condition === 'thunderstorm'
  );
}

function isSnowyCondition(condition: WeatherCondition): boolean {
  return condition === 'snow' || condition === 'blizzard';
}

export function resolveGuineaPigOutfit(
  temperature: number,
  condition: WeatherCondition,
  windSpeed = 12,
  isDay = true
): GuineaPigOutfit {
  const tierId = getTempTier(temperature);
  const rainy = isRainyCondition(condition);
  const snowy = isSnowyCondition(condition);
  const windy = windSpeed >= 24 || condition === 'windy' || condition === 'blizzard';
  const brightSun = (condition === 'clear' || condition === 'partly-cloudy') && isDay;

  let tierLabel = '';
  let outfitTitle = '';
  let description = '';
  let headwear: GuineaPigOutfit['headwear'] = 'none';
  let eyewear: GuineaPigOutfit['eyewear'] = 'none';
  let outerwear: GuineaPigOutfit['outerwear'] = 'denim-overalls';
  let neckwear: GuineaPigOutfit['neckwear'] = 'none';
  let footwear: GuineaPigOutfit['footwear'] = 'bare-paws';
  let rainGear: GuineaPigOutfit['rainGear'] = 'none';
  let handheldProp: GuineaPigOutfit['handheldProp'] = 'none';
  let animationMode: GuineaPigOutfit['animationMode'] = 'breathe';
  let reactionQuotes: string[] = [];

  switch (tierId) {
    case 'freezing':
      tierLabel = '极寒保暖级';
      outfitTitle = '松绿冬日大衣';
      description = '换上松针绿加厚呢大衣配浆果贝雷帽，搓搓小爪烤红薯暖身！';
      headwear = 'pom-beanie';
      eyewear = condition === 'blizzard' ? 'snow-goggles' : 'none';
      outerwear = 'parka';
      neckwear = 'wool-scarf';
      footwear = 'snow-boots';
      handheldProp = 'sweet-potato';
      animationMode = 'shiver';
      reactionQuotes = [
        '呼——鼻子都要冻红啦，快啃一口刚出炉的烤红薯！',
        '咕噜咕噜~ 加厚松绿呢大衣配格纹围巾，一点都不透风！',
        '零下啦！豚鼠建议今天窝在被窝里啃干草～',
      ];
      break;

    case 'cold':
      tierLabel = '冬日防风级';
      outfitTitle = '英伦毛呢大衣';
      description = '驼色毛呢大衣配格纹围巾与浆果红贝雷帽，面前捧着刚烤好的红薯。';
      headwear = windy ? 'earmuffs' : 'beret';
      outerwear = 'duffle-coat';
      neckwear = 'plaid-scarf';
      footwear = 'ankle-boots';
      handheldProp = 'sweet-potato';
      animationMode = 'breathe';
      reactionQuotes = [
        '刚出炉的烤红薯超香！分你一半暖暖手～',
        '早晚温差大，围巾绕两圈才不会灌风哦！',
        '咕叽咕叽，毛呢大衣今天很有街头杂志感吧？',
      ];
      break;

    case 'cool':
      tierLabel = '春秋叠穿级';
      outfitTitle = '麻花针织开衫';
      description = '青苔绿软糯针织衫搭配报童帽，手边备好温热珍珠奶茶散步去。';
      headwear = 'newsboy';
      outerwear = 'knit-cardigan';
      neckwear = windy ? 'plaid-scarf' : 'bowtie';
      footwear = 'sneakers';
      handheldProp = 'milk-tea';
      animationMode = 'breathe';
      reactionQuotes = [
        '微风不燥，穿针织开衫出门刚刚好！',
        '今天这杯黑糖珍珠奶茶，是豚鼠的能量补给站！',
        '树叶沙沙响，本豚鼠要去公园踩落叶啦～',
      ];
      break;

    case 'mild':
      tierLabel = '春日舒适级';
      outfitTitle = '经典牛仔背带';
      description = '清爽复古牛仔背带裤搭配手边雏菊牧草，惬意晒太阳晃悠！';
      headwear = brightSun ? 'beret' : 'none';
      outerwear = 'denim-overalls';
      neckwear = 'bowtie';
      footwear = 'sneakers';
      handheldProp = 'hay-clover';
      animationMode = 'bounce';
      reactionQuotes = [
        'Wheek! 这个温度简直是豚鼠天堂，开心原地蹦跶！',
        '阳光和草香都满分，今天适合晒太阳和整理好心情～',
        '摸摸我的白鼻梁，祝你今天也有好事情发生！',
      ];
      break;

    case 'warm':
      tierLabel = '轻夏清爽级';
      outfitTitle = '浅蓝丹宁背带';
      description = '换上轻快浅蓝晴空牛仔背带裤，搭配雏菊鲜草享受惬意夏风。';
      headwear = 'straw-hat';
      eyewear = brightSun ? 'sunglasses' : 'none';
      outerwear = 'floral-shirt';
      footwear = 'sandals';
      handheldProp = 'lemonade';
      animationMode = 'bounce';
      reactionQuotes = [
        '浅蓝牛仔背带裤最配夏日的晴空啦，出门散步咯！',
        '气温升高啦，记得多喝水、躲在树荫下乘凉！',
        '晴天记得涂防晒霜，不要被晒成焦糖色咯～',
      ];
      break;

    case 'hot':
      tierLabel = '酷暑清凉级';
      outfitTitle = '盛夏清凉小扇';
      description = '轻装上阵开启薄荷迷你小风扇呼呼纳凉，酷暑天只管吹风发呆！';
      headwear = 'sun-visor';
      eyewear = brightSun ? 'sunglasses' : 'none';
      outerwear = 'cooling-tank';
      neckwear = 'cooling-ring';
      footwear = 'sandals';
      handheldProp = 'mini-fan';
      animationMode = 'pant';
      reactionQuotes = [
        '呼哈呼哈……太热啦，全靠小风扇呼呼吹风续命！',
        '小风扇开到最大档！豚鼠今天只想吹空调吃果蔬～',
        '多喝水防中暑！本鼠的毛都要热蓬松啦！',
      ];
      break;
  }

  if (rainy) {
    const isStorm = condition === 'heavy-rain' || condition === 'thunderstorm';
    rainGear = isStorm ? 'storm-slicker' : 'yellow-poncho';
    headwear = 'rain-hood';
    footwear = 'rain-boots';
    handheldProp = 'umbrella';
    eyewear = 'none';

    if (condition === 'thunderstorm') {
      outfitTitle = '深海防风大衣';
      description = '穿上深海防水大衣、撑稳晴雨透明泡泡伞躲避雷阵雨！';
      reactionQuotes = [
        '轰隆！刚刚那个闪电吓得本豚鼠耳朵抖了一下！',
        '暴雨雷电天尽量别出门，一定要撑好伞远离大树呀！',
        '有防水大衣和泡泡伞护体，里面还是干干爽爽的呢～',
      ];
    } else if (condition === 'heavy-rain') {
      outfitTitle = '深海防风大衣';
      description = '深海防泼水大衣搭配透明泡泡伞，再大的雨滴也不怕淋湿！';
      reactionQuotes = [
        '雨势好大！幸好豚鼠穿了深海防水大衣！',
        '听着哗啦啦的雨声，感觉特别治愈呢～',
        '地上有水洼，走过的时候当心溅湿脚脚哦！',
      ];
    } else {
      outfitTitle = '蜜黄防雨大衣';
      description = '换上蜜糖黄防雨大衣、撑起透明泡泡伞漫步细雨中听雨声。';
      reactionQuotes = [
        '细雨绵绵最适合听雨声发呆啦，透明伞看天空超浪漫！',
        '出门记得带伞！豚鼠已经替你备好透明泡泡伞啦～',
        '滴答滴答，雨点滑过伞面的声音真好听。',
      ];
    }
  } else if (snowy) {
    if (condition === 'blizzard') {
      eyewear = 'snow-goggles';
      headwear = 'pom-beanie';
      outerwear = 'parka';
      outfitTitle = '暴雪护目大衣';
      description = '换上深蓝抗寒大衣搭配琥珀护目雪镜，肩头接满蓬松飞雪！';
      reactionQuotes = [
        '雪花往脸上扑来啦！还好有防风雪镜护住眼睛！',
        '暴雪天气路滑，出门一定要慢慢走小碎步哦～',
      ];
    } else if (tierId !== 'freezing') {
      headwear = 'earmuffs';
      neckwear = neckwear === 'none' ? 'wool-scarf' : neckwear;
      footwear = 'snow-boots';
      outfitTitle = `${outfitTitle} × 踏雪`;
      description = '雪花落满头顶和肩背，呼出的白气在冷空气中变成小云朵。';
      reactionQuotes = [
        '下雪啦！看我头顶接住了一片六角形雪花！',
        '踩雪发出嘎吱嘎吱的声音，好喜欢冬天的仪式感呀！',
      ];
    }
  } else if (condition === 'fog') {
    eyewear = 'round-glasses';
    handheldProp = isDay ? handheldProp : 'lantern';
    outfitTitle = `${outfitTitle} × 圆镜`;
    description = '架上玳瑁小圆框眼镜，在薄雾缭绕的空气中稳步前行。';
    reactionQuotes = [
      '雾气蒙蒙的像仙境一样，不过能见度低要注意安全哦！',
      '戴上圆框眼镜，能看清雾气后面的干草堆吗？',
    ];
  } else if (!isDay && (condition === 'clear' || condition === 'partly-cloudy' || condition === 'windy')) {
    if (tierId === 'mild' || tierId === 'cool' || tierId === 'warm') {
      headwear = 'nightcap';
      handheldProp = 'lantern';
      eyewear = 'none';
      outfitTitle = '星夜暖灯晚安';
      description = '夜色温柔降临，提着暖光黄铜小灯笼陪你漫步看星星。';
      reactionQuotes = [
        '夜晚的空气凉丝丝的，陪你提着小灯笼散步吧～',
        '数一数天上的星星，今天辛苦了，早点休息哦！',
      ];
    }
  }

  const tags: string[] = [
    tierLabel,
    rainy ? '防雨装备' : snowy ? '雪地保暖' : brightSun ? '防晒遮阳' : '日常舒适',
  ];
  if (windy) tags.push('防风动态');
  if (!isDay) tags.push('夜间穿搭');

  return {
    tierId,
    tierLabel,
    outfitTitle,
    description,
    headwear,
    eyewear,
    outerwear,
    neckwear,
    footwear,
    rainGear,
    handheldProp,
    hasFrostBreath: temperature <= 2 || snowy,
    hasSnowDust: snowy,
    hasPuddle: rainy,
    hasSweatDrop: temperature >= 33 && !rainy,
    isWindy: windy,
    animationMode,
    reactionQuotes,
    tags,
  };
}

export interface WardrobeLookPreset {
  id: string;
  name: string;
  subtitle: string;
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  isDay: boolean;
}

export const WARDROBE_PRESETS: WardrobeLookPreset[] = [
  {
    id: 'arctic',
    name: '极寒雪国探险',
    subtitle: '-8°C · 暴雪',
    temperature: -8,
    condition: 'blizzard',
    windSpeed: 32,
    isDay: true,
  },
  {
    id: 'winter-street',
    name: '冬日烤红薯散步',
    subtitle: '5°C · 晴朗',
    temperature: 5,
    condition: 'clear',
    windSpeed: 14,
    isDay: true,
  },
  {
    id: 'rainy-commute',
    name: '烟雨透明泡泡伞',
    subtitle: '14°C · 中雨',
    temperature: 14,
    condition: 'rain',
    windSpeed: 18,
    isDay: true,
  },
  {
    id: 'thunder-watch',
    name: '雷暴琥珀防风雨披',
    subtitle: '19°C · 雷阵雨',
    temperature: 19,
    condition: 'thunderstorm',
    windSpeed: 38,
    isDay: false,
  },
  {
    id: 'spring-picnic',
    name: '春日牧草背带裤',
    subtitle: '22°C · 多云',
    temperature: 22,
    condition: 'partly-cloudy',
    windSpeed: 10,
    isDay: true,
  },
  {
    id: 'starry-lantern',
    name: '星夜提灯晚安曲',
    subtitle: '18°C · 晴夜',
    temperature: 18,
    condition: 'clear',
    windSpeed: 8,
    isDay: false,
  },
  {
    id: 'island-breeze',
    name: '轻夏草帽冰柠茶',
    subtitle: '28°C · 晴朗',
    temperature: 28,
    condition: 'clear',
    windSpeed: 12,
    isDay: true,
  },
  {
    id: 'heatwave-fan',
    name: '酷暑冰圈小风扇',
    subtitle: '36°C · 烈日',
    temperature: 36,
    condition: 'clear',
    windSpeed: 6,
    isDay: true,
  },
];

export interface OutfitLockSpec {
  id: string;
  label: string;
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  isDay: boolean;
}

export const OUTFIT_LOCK_OPTIONS: OutfitLockSpec[] = [
  { id: 'freezing', label: '松绿冬日大衣', temperature: -6, condition: 'clear', windSpeed: 12, isDay: true },
  { id: 'blizzard', label: '暴雪护目大衣', temperature: -8, condition: 'blizzard', windSpeed: 32, isDay: true },
  { id: 'cold', label: '英伦毛呢大衣', temperature: 5, condition: 'clear', windSpeed: 14, isDay: true },
  { id: 'cool', label: '麻花针织开衫', temperature: 14, condition: 'clear', windSpeed: 10, isDay: true },
  { id: 'mild', label: '经典牛仔背带', temperature: 21, condition: 'clear', windSpeed: 10, isDay: true },
  { id: 'warm', label: '浅蓝丹宁背带', temperature: 27, condition: 'clear', windSpeed: 12, isDay: true },
  { id: 'hot', label: '盛夏清凉小扇', temperature: 35, condition: 'clear', windSpeed: 6, isDay: true },
  { id: 'rain', label: '蜜黄防雨大衣', temperature: 16, condition: 'rain', windSpeed: 16, isDay: true },
  { id: 'storm', label: '深海防风大衣', temperature: 19, condition: 'thunderstorm', windSpeed: 35, isDay: true },
  { id: 'night', label: '星夜暖灯晚安', temperature: 19, condition: 'clear', windSpeed: 8, isDay: false },
];

export function getSeasonalSnack(
  temperature: number,
  condition: WeatherCondition
): { id: MascotSnackId; label: string; emoji: string; eatQuotes: string[] } {
  if (temperature <= 8 || condition === 'snow' || condition === 'blizzard') {
    return {
      id: 'sweet-potato',
      label: '烤红薯块',
      emoji: '🍠',
      eatQuotes: [
        '啊呜！热乎乎的烤红薯甜到心坎里啦～',
        '嚼嚼嚼……冷天吃一口暖红薯最幸福！',
      ],
    };
  }
  if (temperature >= 26) {
    return {
      id: 'strawberry',
      label: '冰镇草莓',
      emoji: '🍓',
      eatQuotes: [
        '咔嚓咔嚓~ 冰冰凉凉的小草莓超多汁！',
        'Wheek！吃完这颗草莓元气瞬间回满啦～',
      ],
    };
  }
  if (isRainyCondition(condition) || temperature <= 17) {
    return {
      id: 'lettuce',
      label: '脆甜生菜',
      emoji: '🥬',
      eatQuotes: [
        '咔哧咔哧~ 脆生生的大叶子菜真爽口！',
        '谢谢投喂！这片生菜水灵灵的太合本鼠胃口了～',
      ],
    };
  }
  return {
    id: 'hay',
    label: '提摩西鲜草',
    emoji: '🌿',
    eatQuotes: [
      '沙沙嚼草中……带花穗的提摩西草最香啦！',
      'Wheek wheek！开心转圈圈，再来一根好不好～',
    ],
  };
}

export function buildLifestyleIndices(weather: WeatherSnapshot): LifestyleIndexItem[] {
  const { temperature, condition, uvIndex, humidity, windSpeed, airQuality } = weather;
  const rainy = isRainyCondition(condition);
  const snowy = isSnowyCondition(condition);
  const needsMask = Boolean(airQuality?.needsMask);

  const laundryScore = rainy || snowy ? 15 : humidity > 82 ? 40 : condition === 'fog' ? 45 : windSpeed > 10 && temperature > 12 ? 95 : 80;
  const laundryLevel = laundryScore >= 80 ? '极适宜晾晒' : laundryScore >= 55 ? '较适宜' : '建议室内烘干';

  const uvLevel =
    !weather.isDay || rainy || snowy
      ? '无需防晒'
      : uvIndex >= 7
      ? '强 · 必涂SPF50+'
      : uvIndex >= 4
      ? '中等 · 建议遮阳帽'
      : '温和 · 舒适采光';

  const outdoorScore = needsMask
    ? 36
    : condition === 'thunderstorm' || condition === 'blizzard'
    ? 18
    : rainy || snowy
    ? 42
    : temperature >= 15 && temperature <= 26 && windSpeed < 24
    ? 96
    : 68;

  const drinkTip =
    temperature >= 30
      ? { level: '冰镇电解质/青柠水', score: 92, summary: '高温蒸发加快，每小时少量多次补充水分与维C。' }
      : temperature <= 8
      ? { level: '热姜茶/桂花乌龙', score: 88, summary: '气温偏低，温热饮品能快速提升末端循环暖意。' }
      : { level: '茉莉冷萃/温开水', score: 84, summary: '体感舒适，日常补水配合新鲜蔬果刚刚好。' };

  const commuteLevel = needsMask
    ? '佩戴口罩出行'
    : condition === 'thunderstorm' || condition === 'blizzard' || condition === 'heavy-rain'
    ? '注意减速防滑'
    : condition === 'fog'
    ? '开启雾灯慢行'
    : rainy
    ? '备好雨具防溅'
    : '路况通畅舒心';

  const outfitAdvice = resolveGuineaPigOutfit(temperature, condition, windSpeed, weather.isDay);

  return [
    {
      id: 'dressing',
      title: '豚鼠同款穿衣',
      level: outfitAdvice.tierLabel,
      score: 94,
      summary: outfitAdvice.description,
      tone: temperature <= 9 ? 'sky' : temperature >= 28 ? 'amber' : 'emerald',
    },
    {
      id: 'laundry',
      title: '洗晒衣物指数',
      level: laundryLevel,
      score: laundryScore,
      summary:
        laundryScore >= 80
          ? `空气湿度 ${humidity}% 且无降水，被褥棉衣也能晒出太阳味。`
          : `湿度 ${humidity}% ${rainy ? '且伴有降水' : ''}，建议阳台通风或除湿烘干。`,
      tone: laundryScore >= 75 ? 'amber' : 'indigo',
    },
    {
      id: 'uv',
      title: '紫外线与护肤',
      level: uvLevel,
      score: Math.min(100, Math.round(uvIndex * 11 + 15)),
      summary:
        uvIndex >= 6
          ? `当前 UV 指数 ${uvIndex}，外出建议佩戴墨镜与宽檐帽。`
          : `当前 UV 指数 ${uvIndex}，光线柔和不刺眼，注意基础保湿即可。`,
      tone: uvIndex >= 6 ? 'rose' : 'sky',
    },
    {
      id: 'outdoor',
      title: '户外散步运动',
      level: needsMask ? '戴口罩短行' : outdoorScore >= 85 ? '绝佳出游' : outdoorScore >= 55 ? '适度活动' : '宜室内舒展',
      score: outdoorScore,
      summary: needsMask
        ? `当前 AQI ${airQuality?.aqi}（${airQuality?.level}），建议减少剧烈户外活动并佩戴口罩。`
        : outdoorScore >= 85
        ? '风速柔缓、体感宜人，非常推荐傍晚散步或公园轻跑。'
        : '天气变化较明显，推荐改为室内瑜伽、力量训练或居家观影。',
      tone: outdoorScore >= 75 ? 'emerald' : 'rose',
    },
    {
      id: 'hydration',
      title: '今日饮品灵感',
      level: drinkTip.level,
      score: drinkTip.score,
      summary: drinkTip.summary,
      tone: 'amber',
    },
    {
      id: 'commute',
      title: '通勤出行提示',
      level: commuteLevel,
      score: condition === 'thunderstorm' || condition === 'blizzard' ? 32 : rainy || needsMask ? 58 : 92,
      summary: needsMask
        ? `空气${airQuality?.level}，能见度 ${weather.visibility} km，建议戴好防护口罩并选公共交通。`
        : `当前能见度 ${weather.visibility} km，风速 ${windSpeed} km/h，提前预留余裕更从容。`,
      tone: rainy || condition === 'fog' || needsMask ? 'indigo' : 'emerald',
    },
  ];
}
