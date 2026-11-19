import type {
  GuineaPigOutfit,
  LifestyleIndexItem,
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
      outfitTitle = '极地毛绒羽绒派克装';
      description = '穿上加厚毛领羽绒派克、绒球针织帽与雪地靴，抱紧热可可抗寒！';
      headwear = 'pom-beanie';
      eyewear = condition === 'blizzard' ? 'snow-goggles' : 'none';
      outerwear = 'parka';
      neckwear = 'wool-scarf';
      footwear = 'snow-boots';
      handheldProp = 'hot-cocoa';
      animationMode = 'shiver';
      reactionQuotes = [
        '呼——鼻子都要冻红啦，快喝一口棉花糖热可可！',
        '咕噜咕噜~ 羽绒服拉链拉到顶，毛绒帽护住小耳朵！',
        '零下啦！豚鼠建议今天窝在被窝里啃干草～',
      ];
      break;

    case 'cold':
      tierLabel = '冬日防风级';
      outfitTitle = '英伦牛角扣毛呢大衣';
      description = '驼色毛呢大衣配格子围巾与小贝雷帽，手里捧着刚烤好的红薯。';
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
      outfitTitle = '松软麻花针织开衫装';
      description = '焦糖绿软糯针织衫搭配报童帽和帆布鞋，正适合捧杯热奶茶散步。';
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
      outfitTitle = '经典背带牛仔生活装';
      description = '清爽条纹T恤搭配复古牛仔背带裤，叼一根鲜嫩提摩西草惬意晃悠！';
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
      outfitTitle = '热带度假草帽花衬衫';
      description = '透气亚麻花衬衫配编织草帽与茶色墨镜，冰柠檬茶时刻在线。';
      headwear = 'straw-hat';
      eyewear = brightSun ? 'sunglasses' : 'none';
      outerwear = 'floral-shirt';
      footwear = 'sandals';
      handheldProp = 'lemonade';
      animationMode = 'bounce';
      reactionQuotes = [
        '戴上墨镜就是这条街最靓的棕白豚鼠！',
        '气温升高啦，来一口冰爽青柠特饮降降温！',
        '晴天记得涂防晒霜，不要被晒成焦糖色咯（虽然我本来就是棕色的）！',
      ];
      break;

    case 'hot':
      tierLabel = '酷暑清凉级';
      outfitTitle = '冰感网眼背心+降温冰圈';
      description = '超轻凉感背心配冰凉颈圈和防晒遮阳帽，手持小风扇呼呼吹风！';
      headwear = 'sun-visor';
      eyewear = brightSun ? 'sunglasses' : 'none';
      outerwear = 'cooling-tank';
      neckwear = 'cooling-ring';
      footwear = 'sandals';
      handheldProp = 'mini-fan';
      animationMode = 'pant';
      reactionQuotes = [
        '呼哈呼哈……太热啦，全靠脖子上这个冰冰圈续命！',
        '小风扇开到最大档！豚鼠今天拒绝剧烈运动，只想吹空调吃西瓜～',
        '多喝水防中暑！本鼠的毛都要热蓬松啦！',
      ];
      break;
  }

  // Weather condition overrides & layers
  if (rainy) {
    const isStorm = condition === 'heavy-rain' || condition === 'thunderstorm';
    rainGear = isStorm ? 'storm-slicker' : 'yellow-poncho';
    headwear = 'rain-hood';
    footwear = 'rain-boots';
    handheldProp = 'umbrella';
    eyewear = 'none';

    if (condition === 'thunderstorm') {
      outfitTitle = '雷暴全副武装防水雨衣';
      description = '拉紧防风防水雨衣兜帽、踩上小黄雨靴、紧握大伞躲避闪电！';
      reactionQuotes = [
        '轰隆！刚刚那个闪电吓得本豚鼠耳朵抖了一下！',
        '暴雨雷电天尽量别出门，一定要撑好伞远离大树呀！',
        '雨靴踩在水洼里啪嗒啪嗒，不过里面还是干爽的～',
      ];
    } else if (condition === 'heavy-rain') {
      outfitTitle = '暴雨防泼水连帽雨披';
      description = '明黄色防风防水雨披配透明泡泡伞与高筒雨靴，踩水洼也不怕湿！';
      reactionQuotes = [
        '雨势好大！幸好豚鼠穿了小黄雨衣和高筒雨靴！',
        '听着哗啦啦的雨声，感觉特别治愈呢～',
        '地上有水洼，走过的时候当心溅湿裤脚哦！',
      ];
    } else {
      outfitTitle = `${outfitTitle} × 晴雨透明泡泡伞`;
      description = '外搭轻便明黄雨披与小雨靴，撑起透明泡泡伞漫步细雨中。';
      reactionQuotes = [
        '细雨绵绵最适合听雨声发呆啦，透明伞看天空超浪漫！',
        '出门记得带伞！豚鼠已经替你把小黄雨靴穿好啦～',
        '滴答滴答，雨点滑过伞面的声音真好听。',
      ];
    }
  } else if (snowy) {
    if (tierId !== 'freezing') {
      headwear = 'earmuffs';
      neckwear = neckwear === 'none' ? 'wool-scarf' : neckwear;
      footwear = 'snow-boots';
    }
    if (condition === 'blizzard') {
      eyewear = 'snow-goggles';
      headwear = 'pom-beanie';
      outfitTitle = '暴雪护目防风雪地装';
      description = '戴上防风雪镜与厚毛线帽，全身包裹严实对抗漫天飞雪！';
      reactionQuotes = [
        '雪花往脸上扑来啦！还好有防风雪镜护住眼睛！',
        '暴雪天气路滑，出门一定要慢慢走小碎步哦～',
      ];
    } else {
      outfitTitle = `${outfitTitle} × 雪天毛绒护耳`;
      description = '雪花落满头顶和肩头，呼出的白气在冷空气中变成小云朵。';
      reactionQuotes = [
        '下雪啦！看我头顶接住了一片六角形雪花！',
        '踩雪发出嘎吱嘎吱的声音，好喜欢冬天的仪式感呀！',
      ];
    }
  } else if (condition === 'fog') {
    eyewear = 'round-glasses';
    handheldProp = isDay ? handheldProp : 'lantern';
    outfitTitle = `${outfitTitle} × 雾天小侦探圆镜`;
    description = '戴上清晰小圆框眼镜，在薄雾缭绕的空气中稳步前行。';
    reactionQuotes = [
      '雾气蒙蒙的像仙境一样，不过能见度低要注意安全哦！',
      '戴上圆框眼镜，能看清雾气后面的干草堆吗？',
    ];
  } else if (!isDay && (condition === 'clear' || condition === 'partly-cloudy')) {
    if (tierId === 'mild' || tierId === 'cool') {
      headwear = 'nightcap';
      handheldProp = 'lantern';
      eyewear = 'none';
      outfitTitle = `${outfitTitle} × 星夜提灯模式`;
      description = '夜色温柔降临，戴上睡帽提着暖光小灯笼陪你看星星。';
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
    name: '雷暴防风全副武装',
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

export function buildLifestyleIndices(weather: WeatherSnapshot): LifestyleIndexItem[] {
  const { temperature, condition, uvIndex, humidity, windSpeed } = weather;
  const rainy = isRainyCondition(condition);
  const snowy = isSnowyCondition(condition);

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

  const outdoorScore =
    condition === 'thunderstorm' || condition === 'blizzard'
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

  const commuteLevel =
    condition === 'thunderstorm' || condition === 'blizzard' || condition === 'heavy-rain'
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
      level: outdoorScore >= 85 ? '绝佳出游' : outdoorScore >= 55 ? '适度活动' : '宜室内舒展',
      score: outdoorScore,
      summary:
        outdoorScore >= 85
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
      score: condition === 'thunderstorm' || condition === 'blizzard' ? 32 : rainy ? 58 : 92,
      summary: `当前能见度 ${weather.visibility} km，风速 ${windSpeed} km/h，提前预留余裕更从容。`,
      tone: rainy || condition === 'fog' ? 'indigo' : 'emerald',
    },
  ];
}
