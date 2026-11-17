export interface TopicPoolItem {
  id: string;
  scene: string;
  sceneZh: string;
  titleEn: string;
  titleZh: string;
  promptZh: string;
  icebreakerEn: string;
  icebreakerZh: string;
}

/**
 * 内置话题池：24 个日常场景。
 * - LLM 会从随机抽取的场景中挑一个并细化成当日话题；
 * - 没有 API Key / 请求失败时，直接用这里的字段作为兜底话题。
 * 新增场景：直接往数组里追加一项即可，字段全部必填。
 */
export const TOPIC_POOL: TopicPoolItem[] = [
  {
    id: 'restaurant',
    scene: 'Ordering food at a restaurant',
    sceneZh: '餐厅点餐',
    titleEn: 'Ordering with a small change',
    titleZh: '点餐时提个小要求',
    promptZh: '你在一家西餐厅点一份主菜和一杯饮料，想换掉其中一种食材，并问服务员有什么推荐。',
    icebreakerEn: "Hi, could we get a table for two, please?",
    icebreakerZh: "你好，可以给我们安排一张两人桌吗？",
  },
  {
    id: 'directions',
    scene: 'Asking for directions',
    sceneZh: '问路',
    titleEn: 'Finding the museum on foot',
    titleZh: '步行找博物馆',
    promptZh: '你在陌生街区找一家博物馆，向路人问路，并确认步行时间和是否需要换乘公交。',
    icebreakerEn: "Excuse me, could you tell me how to get to the museum?",
    icebreakerZh: "打扰一下，能告诉我怎么去博物馆吗？",
  },
  {
    id: 'reschedule',
    scene: 'Rescheduling an appointment',
    sceneZh: '更改预约',
    titleEn: 'Moving a dentist appointment',
    titleZh: '改牙医预约',
    promptZh: '你临时有事，需要把明天的牙医预约改到下周，并询问有哪些时间段可选。',
    icebreakerEn: "Hi, I need to reschedule my dentist appointment tomorrow.",
    icebreakerZh: "你好，我需要把明天的牙医预约改期。",
  },
  {
    id: 'small-talk',
    scene: 'Making small talk with a neighbor',
    sceneZh: '和邻居闲聊',
    titleEn: 'A chat by the elevator',
    titleZh: '电梯口的闲聊',
    promptZh: '你在电梯里遇到新搬来的邻居，主动打招呼，问问对方住得是否习惯，并聊两句天气。',
    icebreakerEn: "Hi! I think we're neighbors — I just moved in upstairs.",
    icebreakerZh: "你好！我们应该是邻居，我刚搬到楼上。",
  },
  {
    id: 'clothes-shopping',
    scene: 'Shopping for clothes',
    sceneZh: '买衣服',
    titleEn: 'Finding the right fit',
    titleZh: '挑到合适的尺码',
    promptZh: '你在服装店看中一件外套，想试穿另一个尺码，并询问退换货政策。',
    icebreakerEn: "Hi, I'd like to try this jacket in a smaller size.",
    icebreakerZh: "你好，我想试一下这件外套小一号的。",
  },
  {
    id: 'phone-call',
    scene: 'Making a phone call to a company',
    sceneZh: '给公司打电话',
    titleEn: 'Calling about a missing package',
    titleZh: '包裹没收到',
    promptZh: '你打电话给快递公司，说明包裹显示已签收但你没收到，并提供订单号、询问下一步。',
    icebreakerEn: "Hi, I'm calling about a package that says delivered but I never received it.",
    icebreakerZh: "你好，我打电话想问一个显示已签收但我没收到的包裹。",
  },
  {
    id: 'apology',
    scene: 'Apologizing for being late',
    sceneZh: '为迟到道歉',
    titleEn: 'Late for coffee with a friend',
    titleZh: '和朋友约咖啡迟到了',
    promptZh: '你因为地铁延误迟到了二十分钟，向朋友道歉、解释原因，并提出请对方喝咖啡。',
    icebreakerEn: "Hey, I'm so sorry I'm late — the subway was delayed.",
    icebreakerZh: "嘿，真抱歉我迟到了，地铁延误了。",
  },
  {
    id: 'opinion',
    scene: 'Sharing an opinion about remote work',
    sceneZh: '表达对远程办公的看法',
    titleEn: 'Remote work: pro or con?',
    titleZh: '远程办公好不好',
    promptZh: '和朋友讨论远程办公，说明你更喜欢哪种方式、给出两个理由，并回应对方可能的反对意见。',
    icebreakerEn: "I heard the company might go fully remote — what do you think?",
    icebreakerZh: "我听说公司可能全面远程办公，你觉得怎么样？",
  },
  {
    id: 'coffee',
    scene: 'Ordering coffee',
    sceneZh: '咖啡店点单',
    titleEn: 'A complicated coffee order',
    titleZh: '一杯有要求的咖啡',
    promptZh: '你在咖啡店点一杯拿铁，要求换燕麦奶、少糖，并问有没有当日甜点。',
    icebreakerEn: "Hi, could I get a latte with oat milk and less sugar?",
    icebreakerZh: "你好，可以给我一杯燕麦奶、少糖的拿铁吗？",
  },
  {
    id: 'hotel',
    scene: 'Checking into a hotel',
    sceneZh: '酒店入住',
    titleEn: 'Checking in early',
    titleZh: '提前到店入住',
    promptZh: '你比入住时间早到两小时，询问能否先寄存行李，并确认早餐时间和 Wi-Fi 密码。',
    icebreakerEn: "Hi, I have a reservation, but I arrived a couple of hours early.",
    icebreakerZh: "你好，我有预订，但我提前到了两个小时。",
  },
  {
    id: 'airport',
    scene: 'Checking in at the airport',
    sceneZh: '机场值机',
    titleEn: 'A seat and a suitcase',
    titleZh: '选座位和托运行李',
    promptZh: '你在机场值机，想要靠过道的座位，询问行李额度，并确认登机口和登机时间。',
    icebreakerEn: "Hi, I'd like an aisle seat if possible, and I have a bag to check.",
    icebreakerZh: "你好，如果可以的话我想要靠过道的座位，还有一件行李要托运。",
  },
  {
    id: 'pharmacy',
    scene: 'Asking a pharmacist for help',
    sceneZh: '药店买药',
    titleEn: 'A sore throat before a trip',
    titleZh: '出差前嗓子疼',
    promptZh: '你嗓子疼、有点咳嗽，向药剂师描述症状，询问合适的药和服用方法。',
    icebreakerEn: "Hi, I've had a sore throat and a cough for a few days — what do you recommend?",
    icebreakerZh: "你好，我喉咙痛、咳嗽好几天了，你有什么推荐吗？",
  },
  {
    id: 'taxi',
    scene: 'Taking a taxi',
    sceneZh: '打车',
    titleEn: 'Getting to the station on time',
    titleZh: '赶去火车站',
    promptZh: '你打车去火车站，告诉司机目的地、询问大概多久到，并请他尽量快一点。',
    icebreakerEn: "Hi, could you take me to the train station? I'm in a bit of a hurry.",
    icebreakerZh: "你好，能送我去火车站吗？我有点赶时间。",
  },
  {
    id: 'apartment',
    scene: 'Viewing an apartment',
    sceneZh: '看房',
    titleEn: 'Questions before signing',
    titleZh: '签约前想问清楚',
    promptZh: '你在看一套出租公寓，询问租金包含哪些费用、能不能养宠物、以及最短租期。',
    icebreakerEn: "Hi, the apartment looks great — what does the rent include?",
    icebreakerZh: "你好，这套公寓看起来不错，租金包含哪些费用？",
  },
  {
    id: 'interview',
    scene: 'A job interview',
    sceneZh: '求职面试',
    titleEn: 'Tell me about yourself',
    titleZh: '自我介绍和提问',
    promptZh: '你在参加一场面试，用三句话介绍自己的经历，说明为什么适合这个岗位，并在最后问一个关于团队的问题。',
    icebreakerEn: "Hi, thanks for having me. I'm excited to learn more about the role.",
    icebreakerZh: "你好，感谢给我这个机会，我很想了解更多关于这个岗位的信息。",
  },
  {
    id: 'gym',
    scene: 'Joining a gym',
    sceneZh: '健身房咨询',
    titleEn: 'Choosing a membership',
    titleZh: '选会员方案',
    promptZh: '你咨询健身房会员，比较月卡和年卡的价格，询问是否有体验课和教练指导。',
    icebreakerEn: "Hi, I'm thinking about joining — could you tell me about the membership options?",
    icebreakerZh: "你好，我在考虑办会员，能介绍一下会员方案吗？",
  },
  {
    id: 'travel',
    scene: 'Planning a weekend trip',
    sceneZh: '计划周末旅行',
    titleEn: 'A weekend out of town',
    titleZh: '周末去哪儿',
    promptZh: '你和朋友商量周末短途旅行，提出一个目的地，讨论交通、住宿和预算，并达成一个计划。',
    icebreakerEn: "Hey, do you want to plan a short trip this weekend? I was thinking of somewhere nearby.",
    icebreakerZh: "嘿，这周末想不想计划一次短途旅行？我在想附近的地方。",
  },
  {
    id: 'return-item',
    scene: 'Returning an online purchase',
    sceneZh: '网购退货',
    titleEn: 'Returning the wrong size',
    titleZh: '尺码不对要退货',
    promptZh: '你在网上买的鞋子尺码不合适，联系客服说明情况，询问退货流程和退款时间。',
    icebreakerEn: "Hi, I'd like to return these shoes — they're the wrong size.",
    icebreakerZh: "你好，我想退这双鞋，尺码不对。",
  },
  {
    id: 'invitation',
    scene: 'Inviting a friend to dinner',
    sceneZh: '邀请朋友吃饭',
    titleEn: 'Dinner at my place',
    titleZh: '周末来家里吃饭',
    promptZh: '你邀请朋友周六来家里吃饭，说明时间和地点，问对方有没有忌口，并表示可以一起做饭。',
    icebreakerEn: "Hey! Are you free on Saturday? I'd love to have you over for dinner.",
    icebreakerZh: "嘿！你周六有空吗？我想请你来家里吃饭。",
  },
  {
    id: 'complaint',
    scene: 'Complaining about noise',
    sceneZh: '投诉噪音',
    titleEn: 'A noisy construction site',
    titleZh: '楼下的施工声',
    promptZh: '你向物业投诉楼下施工噪音，说明时间、影响，并礼貌地要求对方给出解决时间。',
    icebreakerEn: "Hello, I'd like to report a noise issue from the construction downstairs.",
    icebreakerZh: "你好，我想反映一下楼下施工的噪音问题。",
  },
  {
    id: 'weekend',
    scene: 'Talking about your weekend',
    sceneZh: '聊聊周末',
    titleEn: 'My unexpectedly good weekend',
    titleZh: '意外的周末',
    promptZh: '你和同事聊周末做了什么，讲一个小故事，并反问对方周末过得怎么样。',
    icebreakerEn: "Morning! How was your weekend? Mine turned out surprisingly good.",
    icebreakerZh: "早上好！周末过得怎么样？我的周末出乎意料地不错。",
  },
  {
    id: 'movie',
    scene: 'Discussing a movie',
    sceneZh: '聊一部电影',
    titleEn: 'The ending nobody expected',
    titleZh: '意想不到的结局',
    promptZh: '你和朋友讨论刚看的一部电影，表达你喜欢和不喜欢的部分，并推荐或不推荐它。',
    icebreakerEn: "Hey, I finally watched that movie you recommended — can we talk about it?",
    icebreakerZh: "嘿，我终于看了你推荐的那部电影，可以聊聊吗？",
  },
  {
    id: 'work-update',
    scene: 'Giving a work update',
    sceneZh: '工作汇报',
    titleEn: 'A quick project update',
    titleZh: '项目进度汇报',
    promptZh: '你向同事或上级汇报项目进度，说明已完成、遇到的问题和下一步计划，控制在五句话以内。',
    icebreakerEn: "Hi, do you have a minute? I'd like to give you a quick project update.",
    icebreakerZh: "你好，有空吗？我想跟你简单汇报一下项目进展。",
  },
  {
    id: 'pet',
    scene: 'Talking about pets',
    sceneZh: '聊宠物',
    titleEn: 'The dog that stole my sandwich',
    titleZh: '偷吃三明治的狗',
    promptZh: '你和朋友聊宠物，分享一件自家宠物做的趣事，并问对方有没有养宠物。',
    icebreakerEn: "Hey, I saw a picture of your dog — tell me more about him!",
    icebreakerZh: "嘿，我看到你狗的照片了，跟我多说说它吧！",
  },
];

export function pickRandomPoolItems(count: number, excludeIds: string[] = []): TopicPoolItem[] {
  const available = TOPIC_POOL.filter((item) => !excludeIds.includes(item.id));
  const source = available.length >= count ? available : TOPIC_POOL;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getPoolItem(id: string): TopicPoolItem | undefined {
  return TOPIC_POOL.find((item) => item.id === id);
}
