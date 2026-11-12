export interface TopicPoolItem {
  id: string;
  scene: string;
  sceneZh: string;
  titleEn: string;
  titleZh: string;
  promptZh: string;
  icebreakerEn: string;
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
    icebreakerEn: 'Hi there! Welcome in — can I start you off with something to drink?',
  },
  {
    id: 'directions',
    scene: 'Asking for directions',
    sceneZh: '问路',
    titleEn: 'Finding the museum on foot',
    titleZh: '步行找博物馆',
    promptZh: '你在陌生街区找一家博物馆，向路人问路，并确认步行时间和是否需要换乘公交。',
    icebreakerEn: 'Sure, I can help. Where are you trying to get to?',
  },
  {
    id: 'reschedule',
    scene: 'Rescheduling an appointment',
    sceneZh: '更改预约',
    titleEn: 'Moving a dentist appointment',
    titleZh: '改牙医预约',
    promptZh: '你临时有事，需要把明天的牙医预约改到下周，并询问有哪些时间段可选。',
    icebreakerEn: "Thanks for calling the clinic. How can I help you today?",
  },
  {
    id: 'small-talk',
    scene: 'Making small talk with a neighbor',
    sceneZh: '和邻居闲聊',
    titleEn: 'A chat by the elevator',
    titleZh: '电梯口的闲聊',
    promptZh: '你在电梯里遇到新搬来的邻居，主动打招呼，问问对方住得是否习惯，并聊两句天气。',
    icebreakerEn: 'Oh, hey! You live on this floor too? I just moved in last week.',
  },
  {
    id: 'clothes-shopping',
    scene: 'Shopping for clothes',
    sceneZh: '买衣服',
    titleEn: 'Finding the right fit',
    titleZh: '挑到合适的尺码',
    promptZh: '你在服装店看中一件外套，想试穿另一个尺码，并询问退换货政策。',
    icebreakerEn: 'Let me know if you want me to grab another size — that one runs a little small.',
  },
  {
    id: 'phone-call',
    scene: 'Making a phone call to a company',
    sceneZh: '给公司打电话',
    titleEn: 'Calling about a missing package',
    titleZh: '包裹没收到',
    promptZh: '你打电话给快递公司，说明包裹显示已签收但你没收到，并提供订单号、询问下一步。',
    icebreakerEn: 'Thanks for calling customer support. Could I get your order number, please?',
  },
  {
    id: 'apology',
    scene: 'Apologizing for being late',
    sceneZh: '为迟到道歉',
    titleEn: 'Late for coffee with a friend',
    titleZh: '和朋友约咖啡迟到了',
    promptZh: '你因为地铁延误迟到了二十分钟，向朋友道歉、解释原因，并提出请对方喝咖啡。',
    icebreakerEn: "Hey! There you are — I was starting to think you'd forgotten.",
  },
  {
    id: 'opinion',
    scene: 'Sharing an opinion about remote work',
    sceneZh: '表达对远程办公的看法',
    titleEn: 'Remote work: pro or con?',
    titleZh: '远程办公好不好',
    promptZh: '和朋友讨论远程办公，说明你更喜欢哪种方式、给出两个理由，并回应对方可能的反对意见。',
    icebreakerEn: 'So our company is thinking about going fully remote. What do you think about that?',
  },
  {
    id: 'coffee',
    scene: 'Ordering coffee',
    sceneZh: '咖啡店点单',
    titleEn: 'A complicated coffee order',
    titleZh: '一杯有要求的咖啡',
    promptZh: '你在咖啡店点一杯拿铁，要求换燕麦奶、少糖，并问有没有当日甜点。',
    icebreakerEn: "Good morning! What can I get started for you?",
  },
  {
    id: 'hotel',
    scene: 'Checking into a hotel',
    sceneZh: '酒店入住',
    titleEn: 'Checking in early',
    titleZh: '提前到店入住',
    promptZh: '你比入住时间早到两小时，询问能否先寄存行李，并确认早餐时间和 Wi-Fi 密码。',
    icebreakerEn: 'Welcome to the Riverside Hotel! Do you have a reservation with us?',
  },
  {
    id: 'airport',
    scene: 'Checking in at the airport',
    sceneZh: '机场值机',
    titleEn: 'A seat and a suitcase',
    titleZh: '选座位和托运行李',
    promptZh: '你在机场值机，想要靠过道的座位，询问行李额度，并确认登机口和登机时间。',
    icebreakerEn: 'Good afternoon! May I see your passport and booking reference, please?',
  },
  {
    id: 'pharmacy',
    scene: 'Asking a pharmacist for help',
    sceneZh: '药店买药',
    titleEn: 'A sore throat before a trip',
    titleZh: '出差前嗓子疼',
    promptZh: '你嗓子疼、有点咳嗽，向药剂师描述症状，询问合适的药和服用方法。',
    icebreakerEn: "Hi, how can I help you today? You look a little under the weather.",
  },
  {
    id: 'taxi',
    scene: 'Taking a taxi',
    sceneZh: '打车',
    titleEn: 'Getting to the station on time',
    titleZh: '赶去火车站',
    promptZh: '你打车去火车站，告诉司机目的地、询问大概多久到，并请他尽量快一点。',
    icebreakerEn: "Hop in! Where are you headed?",
  },
  {
    id: 'apartment',
    scene: 'Viewing an apartment',
    sceneZh: '看房',
    titleEn: 'Questions before signing',
    titleZh: '签约前想问清楚',
    promptZh: '你在看一套出租公寓，询问租金包含哪些费用、能不能养宠物、以及最短租期。',
    icebreakerEn: "So this is the living room — it gets great light in the afternoon. Any questions so far?",
  },
  {
    id: 'interview',
    scene: 'A job interview',
    sceneZh: '求职面试',
    titleEn: 'Tell me about yourself',
    titleZh: '自我介绍和提问',
    promptZh: '你在参加一场面试，用三句话介绍自己的经历，说明为什么适合这个岗位，并在最后问一个关于团队的问题。',
    icebreakerEn: "Thanks for coming in today. To start, could you tell me a bit about yourself?",
  },
  {
    id: 'gym',
    scene: 'Joining a gym',
    sceneZh: '健身房咨询',
    titleEn: 'Choosing a membership',
    titleZh: '选会员方案',
    promptZh: '你咨询健身房会员，比较月卡和年卡的价格，询问是否有体验课和教练指导。',
    icebreakerEn: "Hey! Are you interested in a membership, or just looking around today?",
  },
  {
    id: 'travel',
    scene: 'Planning a weekend trip',
    sceneZh: '计划周末旅行',
    titleEn: 'A weekend out of town',
    titleZh: '周末去哪儿',
    promptZh: '你和朋友商量周末短途旅行，提出一个目的地，讨论交通、住宿和预算，并达成一个计划。',
    icebreakerEn: 'So, do you still want to do something this weekend? I have no plans yet.',
  },
  {
    id: 'return-item',
    scene: 'Returning an online purchase',
    sceneZh: '网购退货',
    titleEn: 'Returning the wrong size',
    titleZh: '尺码不对要退货',
    promptZh: '你在网上买的鞋子尺码不合适，联系客服说明情况，询问退货流程和退款时间。',
    icebreakerEn: 'Hi, thanks for contacting us. How can I help you today?',
  },
  {
    id: 'invitation',
    scene: 'Inviting a friend to dinner',
    sceneZh: '邀请朋友吃饭',
    titleEn: 'Dinner at my place',
    titleZh: '周末来家里吃饭',
    promptZh: '你邀请朋友周六来家里吃饭，说明时间和地点，问对方有没有忌口，并表示可以一起做饭。',
    icebreakerEn: "Hey! It's been a while. What have you been up to?",
  },
  {
    id: 'complaint',
    scene: 'Complaining about noise',
    sceneZh: '投诉噪音',
    titleEn: 'A noisy construction site',
    titleZh: '楼下的施工声',
    promptZh: '你向物业投诉楼下施工噪音，说明时间、影响，并礼貌地要求对方给出解决时间。',
    icebreakerEn: 'Hello, property management. How may I assist you?',
  },
  {
    id: 'weekend',
    scene: 'Talking about your weekend',
    sceneZh: '聊聊周末',
    titleEn: 'My unexpectedly good weekend',
    titleZh: '意外的周末',
    promptZh: '你和同事聊周末做了什么，讲一个小故事，并反问对方周末过得怎么样。',
    icebreakerEn: 'Morning! How was your weekend? You look like you had a good one.',
  },
  {
    id: 'movie',
    scene: 'Discussing a movie',
    sceneZh: '聊一部电影',
    titleEn: 'The ending nobody expected',
    titleZh: '意想不到的结局',
    promptZh: '你和朋友讨论刚看的一部电影，表达你喜欢和不喜欢的部分，并推荐或不推荐它。',
    icebreakerEn: 'So, did you end up watching that movie I told you about?',
  },
  {
    id: 'work-update',
    scene: 'Giving a work update',
    sceneZh: '工作汇报',
    titleEn: 'A quick project update',
    titleZh: '项目进度汇报',
    promptZh: '你向同事或上级汇报项目进度，说明已完成、遇到的问题和下一步计划，控制在五句话以内。',
    icebreakerEn: "Hey, do you have a minute? I'd love a quick update on how the project's going.",
  },
  {
    id: 'pet',
    scene: 'Talking about pets',
    sceneZh: '聊宠物',
    titleEn: 'The dog that stole my sandwich',
    titleZh: '偷吃三明治的狗',
    promptZh: '你和朋友聊宠物，分享一件自家宠物做的趣事，并问对方有没有养宠物。',
    icebreakerEn: "Oh my gosh, is that a picture of your dog? Tell me everything.",
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
